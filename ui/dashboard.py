import sys
import os
import uuid
import time
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QLabel, 
                             QPushButton, QVBoxLayout, QHBoxLayout, QGridLayout, 
                             QTableWidget, QTableWidgetItem, QHeaderView, QProgressBar)
from PyQt5.QtCore import Qt, pyqtSlot
from PyQt5.QtGui import QPixmap, QImage, QFont, QColor
import matplotlib
matplotlib.use('Qt5Agg')
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure

# Import custom packages
from ui.video_thread import VideoThread
from reports.report_generator import generate_html_report
from analytics.database_manager import DatabaseManager

class MscChartCanvas(FigureCanvas):
    """Matplotlib canvas class to embed live scrolling EAR and MAR charts in PyQt5."""
    def __init__(self, parent=None, width=4, height=3, dpi=100):
        fig = Figure(figsize=(width, height), dpi=dpi, facecolor='#1c1c1e')
        self.axes = fig.add_subplot(111)
        self.axes.set_facecolor('#1c1c1e')
        self.axes.tick_params(colors='#8e8e93', labelsize=8)
        self.axes.spines['bottom'].set_color('#3a3a3c')
        self.axes.spines['left'].set_color('#3a3a3c')
        self.axes.spines['top'].set_visible(False)
        self.axes.spines['right'].set_visible(False)
        
        self.ear_history = []
        self.mar_history = []
        
        super().__init__(fig)
        self.setParent(parent)

    def update_data(self, ear, mar):
        self.ear_history.append(ear)
        self.mar_history.append(mar)
        if len(self.ear_history) > 40:
            self.ear_history.pop(0)
            self.mar_history.pop(0)
            
        self.axes.clear()
        self.axes.set_facecolor('#1c1c1e')
        self.axes.tick_params(colors='#8e8e93', labelsize=8)
        self.axes.set_ylim(0, 0.8)
        
        self.axes.plot(self.ear_history, label='EAR (Eyes)', color='#30d059', linewidth=1.5)
        self.axes.plot(self.mar_history, label='MAR (Mouth)', color='#ff9f0a', linewidth=1.5)
        self.axes.legend(facecolor='#1c1c1e', labelcolor='#ffffff', edgecolor='#3a3a3c', fontsize=8, loc='upper right')
        self.axes.grid(True, color='#2c2c2e', linestyle='--', linewidth=0.5)
        self.draw()

class DMSDashboard(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("AI-DMS Driver Safety Dashboard")
        self.resize(1200, 800)
        
        # Session state details
        self.session_id = f"SESS-{uuid.uuid4().hex[:8].upper()}"
        self.driver_name = "KUNCHALA RAJYALAXMI"
        self.safety_score = 100.0
        
        self.db = DatabaseManager()
        self.thread = None
        
        # Configure layout styling (stylesheet QSS)
        self.setStyleSheet("""
            QMainWindow {
                background-color: #121214;
            }
            QWidget#card {
                background-color: #1c1c1e;
                border: 1px solid #2c2c2e;
                border-radius: 8px;
            }
            QLabel {
                color: #ffffff;
            }
            QPushButton {
                background-color: #0a84ff;
                color: white;
                border-radius: 6px;
                padding: 10px 18px;
                font-weight: bold;
                font-size: 13px;
                border: none;
            }
            QPushButton:hover {
                background-color: #007aff;
            }
            QPushButton#btn_stop {
                background-color: #ff3b30;
            }
            QPushButton#btn_stop:hover {
                background-color: #e02b20;
            }
            QPushButton#btn_calibrate {
                background-color: #5e5ce6;
            }
            QPushButton#btn_calibrate:hover {
                background-color: #4e4cd1;
            }
            QProgressBar {
                border: 1px solid #2c2c2e;
                border-radius: 4px;
                text-align: center;
                background-color: #2c2c2e;
                color: white;
                font-weight: bold;
            }
            QProgressBar::chunk {
                background-color: #30d059;
                border-radius: 3px;
            }
            QTableWidget {
                background-color: #1c1c1e;
                color: white;
                gridline-color: #2c2c2e;
                border: 1px solid #2c2c2e;
                font-size: 11px;
            }
            QHeaderView::section {
                background-color: #2c2c2e;
                color: white;
                padding: 5px;
                border: 1px solid #1c1c1e;
                font-weight: bold;
            }
        """)
        
        self.init_ui()

    def init_ui(self):
        # Main central widget
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(15, 15, 15, 15)
        
        # =====================================================================
        # LEFT COLUMN (Webcam view + Live telemetry statistics)
        # =====================================================================
        left_layout = QVBoxLayout()
        
        # Header bar
        header_widget = QWidget()
        header_widget.setObjectName("card")
        header_layout = QHBoxLayout(header_widget)
        
        title_label = QLabel("AI DRIVER MONITORING SYSTEM")
        title_label.setFont(QFont("Arial", 16, QFont.Bold))
        header_layout.addWidget(title_label)
        
        self.status_badge = QLabel("ACTIVE STATUS")
        self.status_badge.setStyleSheet("background-color: #30d059; color: black; font-weight: bold; border-radius: 4px; padding: 5px 10px;")
        self.status_badge.setAlignment(Qt.AlignCenter)
        header_layout.addWidget(self.status_badge, 0, Qt.AlignRight)
        
        left_layout.addWidget(header_widget)
        
        # Webcam container
        self.video_container = QLabel()
        self.video_container.setObjectName("card")
        self.video_container.setMinimumSize(640, 480)
        self.video_container.setAlignment(Qt.AlignCenter)
        self.video_container.setStyleSheet("background-color: #000000; border: 1px solid #2c2c2e; border-radius: 8px;")
        self.video_container.setText("WEBCAM FEED OFFAIR\n\nClick 'Start Monitoring' to open camera")
        left_layout.addWidget(self.video_container)
        
        # Dashboard parameters telemetry grid
        metrics_widget = QWidget()
        metrics_widget.setObjectName("card")
        metrics_layout = QGridLayout(metrics_widget)
        
        # 1. Driver Auth Check
        self.auth_label = QLabel("Driver Auth: PENDING")
        self.auth_label.setFont(QFont("Arial", 11, QFont.Bold))
        metrics_layout.addWidget(self.auth_label, 0, 0)
        
        # 2. Safety Score
        self.safety_score_bar = QProgressBar()
        self.safety_score_bar.setValue(100)
        self.safety_score_bar.setFormat("Safety Score: %v%")
        metrics_layout.addWidget(self.safety_score_bar, 0, 1)
        
        # 3. Fatigue Meter
        self.fatigue_bar = QProgressBar()
        self.fatigue_bar.setValue(0)
        self.fatigue_bar.setFormat("Fatigue Index: %v%")
        self.fatigue_bar.setStyleSheet("QProgressBar::chunk { background-color: #ff9f0a; }")
        metrics_layout.addWidget(self.fatigue_bar, 1, 0)
        
        # 4. Attention Meter
        self.attention_bar = QProgressBar()
        self.attention_bar.setValue(100)
        self.attention_bar.setFormat("Attention: %v%")
        metrics_layout.addWidget(self.attention_bar, 1, 1)
        
        # 5. counters
        self.blink_label = QLabel("Blinks: 0")
        self.yawn_label = QLabel("Yawns: 0")
        metrics_layout.addWidget(self.blink_label, 2, 0)
        metrics_layout.addWidget(self.yawn_label, 2, 1)
        
        # 6. Stress & Emotion
        self.stress_label = QLabel("Stress Level: LOW")
        self.emotion_label = QLabel("Emotion: NEUTRAL")
        metrics_layout.addWidget(self.stress_label, 3, 0)
        metrics_layout.addWidget(self.emotion_label, 3, 1)
        
        # 7. Simulated steering wheel drift widget
        self.steering_label = QLabel("Virtual Steering Offset: 0.0 deg")
        metrics_layout.addWidget(self.steering_label, 4, 0, 1, 2)
        
        left_layout.addWidget(metrics_widget)
        main_layout.addLayout(left_layout, 2)
        
        # =====================================================================
        # RIGHT COLUMN (Matplotlib Charts + Database Logs list)
        # =====================================================================
        right_layout = QVBoxLayout()
        
        # Control Buttons Card
        controls_widget = QWidget()
        controls_widget.setObjectName("card")
        controls_layout = QHBoxLayout(controls_widget)
        
        self.btn_start = QPushButton("Start Monitoring")
        self.btn_start.clicked.connect(self.start_session)
        controls_layout.addWidget(self.btn_start)
        
        self.btn_stop = QPushButton("Stop Session")
        self.btn_stop.setObjectName("btn_stop")
        self.btn_stop.setEnabled(False)
        self.btn_stop.clicked.connect(self.stop_session)
        controls_layout.addWidget(self.btn_stop)
        
        self.btn_calibrate = QPushButton("Calibrate Face")
        self.btn_calibrate.setObjectName("btn_calibrate")
        self.btn_calibrate.setEnabled(False)
        self.btn_calibrate.clicked.connect(self.calibrate_face)
        controls_layout.addWidget(self.btn_calibrate)
        
        right_layout.addWidget(controls_widget)
        
        # Live Charts Area
        chart_widget = QWidget()
        chart_widget.setObjectName("card")
        chart_layout = QVBoxLayout(chart_widget)
        chart_title = QLabel("LIVE TELEMETRY SCROLLING CHART")
        chart_title.setFont(QFont("Arial", 11, QFont.Bold))
        chart_layout.addWidget(chart_title)
        
        self.canvas = MscChartCanvas(chart_widget, width=4, height=3)
        chart_layout.addWidget(self.canvas)
        right_layout.addWidget(chart_widget, 2)
        
        # Session Event Alarm Log List
        log_widget = QWidget()
        log_widget.setObjectName("card")
        log_layout = QVBoxLayout(log_widget)
        log_title = QLabel("SESSION ALARM EVENT DATABASE LOG")
        log_title.setFont(QFont("Arial", 11, QFont.Bold))
        log_layout.addWidget(log_title)
        
        self.log_table = QTableWidget()
        self.log_table.setColumnCount(3)
        self.log_table.setHorizontalHeaderLabels(["Time", "Type", "Details"])
        self.log_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.log_table.verticalHeader().setVisible(False)
        log_layout.addWidget(self.log_table)
        
        right_layout.addWidget(log_widget, 2)
        main_layout.addLayout(right_layout, 1)

    def start_session(self):
        # Disable start button, enable stop and calibrate
        self.btn_start.setEnabled(False)
        self.btn_stop.setEnabled(True)
        self.btn_calibrate.setEnabled(True)
        
        # Initialize video thread
        self.thread = VideoThread(self.session_id, self.driver_name)
        self.thread.frame_ready.connect(self.update_video_frame)
        self.thread.telemetry_ready.connect(self.update_telemetry_metrics)
        self.thread.alert_triggered.connect(self.handle_alert)
        self.thread.start()
        
        # Clear logs table
        self.log_table.setRowCount(0)
        self.safety_score = 100.0

    def stop_session(self):
        if self.thread:
            self.thread.stop()
            self.thread = None
            
        self.btn_start.setEnabled(True)
        self.btn_stop.setEnabled(False)
        self.btn_calibrate.setEnabled(False)
        self.video_container.setText("WEBCAM FEED OFFAIR\n\nClick 'Start Monitoring' to open camera")
        
        # Save session finish details in SQLite database
        self.db.end_session(self.session_id, self.safety_score)
        
        # Automatically generate HTML safety report
        report_path = generate_html_report(self.session_id)
        if report_path:
            self.add_log_row("REPORT", "Safety Report Exported", os.path.basename(report_path))
            
        self.status_badge.setText("SESSION FINISHED")
        self.status_badge.setStyleSheet("background-color: #8e8e93; color: black; font-weight: bold; border-radius: 4px; padding: 5px 10px;")

    def calibrate_face(self):
        if self.thread:
            self.thread.is_calibrating = True
            self.thread.calibration_frames = 0
            self.thread.calibration_ear_sum = 0.0
            self.thread.calibration_yaw_sum = 0.0
            self.thread.calibration_pitch_sum = 0.0

    @pyqtSlot(QImage)
    def update_video_frame(self, q_image):
        pixmap = QPixmap.fromImage(q_image)
        # Scaled web feed to label size preserving aspect ratio
        self.video_container.setPixmap(pixmap.scaled(self.video_container.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation))

    @pyqtSlot(dict)
    def update_telemetry_metrics(self, data):
        # Update metrics indicators
        avg_ear = data["ear"]
        mar = data["mar"]
        yaw = data["yaw"]
        pitch = data["pitch"]
        fatigue_pct = data["fatigue_score"]
        fatigue_lvl = data["fatigue_level"]
        attention = data["attention_score"]
        blink_c = data["blink_count"]
        yawn_c = data["yawn_count"]
        stress_score = data["stress_score"]
        stress_lvl = data["stress_level"]
        emotion = data["emotion"]
        steering = data["steering_angle"]
        authenticated = data["authenticated"]
        night_mode = data["night_mode"]
        
        # Authenticated driver label update
        if authenticated:
            self.auth_label.setText("Driver Auth: AUTHORIZED")
            self.auth_label.setStyleSheet("color: #30d059; font-weight: bold;")
        else:
            self.auth_label.setText("Driver Auth: UNAUTHORIZED")
            self.auth_label.setStyleSheet("color: #ff3b30; font-weight: bold;")
            
        # Deduct safety score dynamically for warnings
        if data["is_drowsy"] or data["is_phone_used"]:
            self.safety_score = max(0.0, self.safety_score - 0.05)
        elif data["is_distracted"]:
            self.safety_score = max(0.0, self.safety_score - 0.02)
            
        self.safety_score_bar.setValue(int(self.safety_score))
        
        # Color bar styling based on safety rating
        if self.safety_score >= 85.0:
            self.safety_score_bar.setStyleSheet("QProgressBar::chunk { background-color: #30d059; }")
        elif self.safety_score >= 65.0:
            self.safety_score_bar.setStyleSheet("QProgressBar::chunk { background-color: #ff9f0a; }")
        else:
            self.safety_score_bar.setStyleSheet("QProgressBar::chunk { background-color: #ff3b30; }")

        # Update bars and labels
        self.fatigue_bar.setValue(int(fatigue_pct))
        self.attention_bar.setValue(int(attention))
        self.blink_label.setText(f"Blinks: {blink_c}")
        self.yawn_label.setText(f"Yawns: {yawn_c}")
        self.stress_label.setText(f"Stress Level: {stress_lvl} ({stress_score:.0f}%)")
        self.emotion_label.setText(f"Emotion: {emotion}")
        self.steering_label.setText(f"Virtual Steering Offset: {steering:+.1f} deg")
        
        # Live status badge warning update
        if data["is_drowsy"]:
            self.status_badge.setText("WARNING: DROWSY")
            self.status_badge.setStyleSheet("background-color: #ff3b30; color: white; font-weight: bold; border-radius: 4px; padding: 5px 10px;")
        elif data["is_phone_used"]:
            self.status_badge.setText("WARNING: PHONE USAGE")
            self.status_badge.setStyleSheet("background-color: #ff3b30; color: white; font-weight: bold; border-radius: 4px; padding: 5px 10px;")
        elif data["is_distracted"]:
            self.status_badge.setText("WARNING: DISTRACTED")
            self.status_badge.setStyleSheet("background-color: #ff9f0a; color: black; font-weight: bold; border-radius: 4px; padding: 5px 10px;")
        elif data["is_yawning"]:
            self.status_badge.setText("ALERT: YAWNING")
            self.status_badge.setStyleSheet("background-color: #ff9f0a; color: black; font-weight: bold; border-radius: 4px; padding: 5px 10px;")
        else:
            if night_mode:
                self.status_badge.setText("ACTIVE (NIGHT MODE)")
                self.status_badge.setStyleSheet("background-color: #0a84ff; color: white; font-weight: bold; border-radius: 4px; padding: 5px 10px;")
            else:
                self.status_badge.setText("STATUS: ACTIVE")
                self.status_badge.setStyleSheet("background-color: #30d059; color: black; font-weight: bold; border-radius: 4px; padding: 5px 10px;")
                
        # Draw live data points on scrolling charts
        self.canvas.update_data(avg_ear, mar)

    @pyqtSlot(str, str)
    def handle_alert(self, alert_type, message):
        """Adds alert rows to UI database logs list dynamically."""
        self.add_log_row(alert_type, "System Alert", message)

    def add_log_row(self, alert_type, event, details):
        current_time = time.strftime("%H:%M:%S")
        row = self.log_table.rowCount()
        self.log_table.insertRow(row)
        
        # Color coding rows based on alert severity
        color_map = {
            "DROWSY": QColor("#ff3b30"),
            "PHONE": QColor("#ff3b30"),
            "DISTRACTED": QColor("#ff9f0a"),
            "YAWN": QColor("#0a84ff"),
            "REPORT": QColor("#30d059")
        }
        text_color = color_map.get(alert_type, QColor("#ffffff"))
        
        item_time = QTableWidgetItem(current_time)
        item_event = QTableWidgetItem(f"{alert_type} - {event}")
        item_details = QTableWidgetItem(details)
        
        for item in [item_time, item_event, item_details]:
            item.setForeground(text_color)
            
        self.log_table.setItem(row, 0, item_time)
        self.log_table.setItem(row, 1, item_event)
        self.log_table.setItem(row, 2, item_details)
        
        # Scroll to bottom
        self.log_table.scrollToBottom()

    def closeEvent(self, event):
        """Clean closure of thread on window termination."""
        self.stop_session()
        event.accept()

def launch_dashboard():
    app = QApplication(sys.argv)
    dashboard = DMSDashboard()
    dashboard.show()
    sys.exit(app.exec_())
