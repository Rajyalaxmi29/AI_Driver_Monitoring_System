import sqlite3
import os
import time

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "dms_database.db")

def init_db():
    """Initializes the SQLite database schema if tables do not exist."""
    # Ensure assets directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        driver_name TEXT,
        start_time INTEGER,
        end_time INTEGER,
        safety_score REAL,
        total_drowsy INTEGER DEFAULT 0,
        total_distract INTEGER DEFAULT 0,
        total_yawn INTEGER DEFAULT 0,
        total_phone INTEGER DEFAULT 0
    )
    """)
    
    # 2. Alerts logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        timestamp INTEGER,
        alert_type TEXT,
        description TEXT,
        FOREIGN KEY(session_id) REFERENCES sessions(session_id)
    )
    """)
    
    # 3. Telemetry periodic tracking table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry (
        telemetry_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        timestamp INTEGER,
        ear REAL,
        mar REAL,
        yaw REAL,
        pitch REAL,
        fatigue_score REAL,
        attention_score REAL,
        FOREIGN KEY(session_id) REFERENCES sessions(session_id)
    )
    """)
    
    conn.commit()
    conn.close()

class DatabaseManager:
    def __init__(self):
        init_db()
        self.db_path = DB_PATH

    def _execute(self, query, params=(), commit=True):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            if commit:
                conn.commit()
            return cursor.fetchall()
        finally:
            conn.close()

    def start_session(self, session_id, driver_name):
        """Creates a new driving session in the database."""
        query = """
        INSERT OR REPLACE INTO sessions 
        (session_id, driver_name, start_time, end_time, safety_score)
        VALUES (?, ?, ?, NULL, 100.0)
        """
        self._execute(query, (session_id, driver_name, int(time.time())))

    def log_alert(self, session_id, alert_type, description):
        """Logs a driver warning alert."""
        query = "INSERT INTO alerts (session_id, timestamp, alert_type, description) VALUES (?, ?, ?, ?)"
        self._execute(query, (session_id, int(time.time()), alert_type, description))
        
        # Update alert counter in sessions table
        column_map = {
            "DROWSY": "total_drowsy",
            "DISTRACTED": "total_distract",
            "YAWN": "total_yawn",
            "PHONE": "total_phone"
        }
        col = column_map.get(alert_type)
        if col:
            update_query = f"UPDATE sessions SET {col} = {col} + 1 WHERE session_id = ?"
            self._execute(update_query, (session_id,))

    def log_telemetry(self, session_id, ear, mar, yaw, pitch, fatigue, attention):
        """Logs periodic telemetry signals for dashboard analytics."""
        query = """
        INSERT INTO telemetry (session_id, timestamp, ear, mar, yaw, pitch, fatigue_score, attention_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        self._execute(query, (session_id, int(time.time()), ear, mar, yaw, pitch, fatigue, attention))

    def end_session(self, session_id, safety_score):
        """Finalizes the driving session and records the safety score."""
        query = "UPDATE sessions SET end_time = ?, safety_score = ? WHERE session_id = ?"
        self._execute(query, (int(time.time()), safety_score, session_id))

    def get_session_stats(self, session_id):
        """Retrieves aggregated statistics for a specific session."""
        query = "SELECT * FROM sessions WHERE session_id = ?"
        rows = self._execute(query, (session_id,))
        if rows:
            r = rows[0]
            return {
                "session_id": r[0],
                "driver_name": r[1],
                "start_time": r[2],
                "end_time": r[3],
                "safety_score": r[4],
                "total_drowsy": r[5],
                "total_distract": r[6],
                "total_yawn": r[7],
                "total_phone": r[8]
            }
        return None

    def get_session_telemetry(self, session_id):
        """Retrieves raw telemetry data over the session duration."""
        query = "SELECT timestamp, ear, mar, fatigue_score, attention_score FROM telemetry WHERE session_id = ? ORDER BY timestamp ASC"
        return self._execute(query, (session_id,))

    def get_session_alerts(self, session_id):
        """Retrieves all alert warning instances logged in the session."""
        query = "SELECT timestamp, alert_type, description FROM alerts WHERE session_id = ? ORDER BY timestamp ASC"
        return self._execute(query, (session_id,))
