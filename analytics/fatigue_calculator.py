import numpy as np
import time

class FatigueCalculator:
    def __init__(self):
        # Attention score smoothing window
        self.attention_history = []
        self.head_pose_jitter = []
        
        # Steering Wheel Simulator state
        self.steering_angle = 0.0
        self.steering_direction = 1 # 1 for right, -1 for left

    def calculate_attention_score(self, ear, is_drowsy, yaw, pitch, phone_detected):
        """Calculates attention percentage based on pose, eye state, and phone presence."""
        score = 100.0
        
        # 1. Deduct for phone detection
        if phone_detected:
            score -= 40.0
            
        # 2. Deduct for eye closure / drowsiness
        if is_drowsy:
            score -= 35.0
        elif ear < 0.20:
            score -= 15.0
            
        # 3. Deduct for looking away (head pose distraction)
        pose_offset = max(0, abs(yaw) - 10) + max(0, abs(pitch) - 8)
        score -= min(35.0, pose_offset * 1.5)
        
        # Ensure score stays in bounds
        score = max(0.0, min(100.0, score))
        
        # Smooth with moving average
        self.attention_history.append(score)
        if len(self.attention_history) > 30:
            self.attention_history.pop(0)
            
        return float(np.mean(self.attention_history))

    def calculate_fatigue_score(self, drowsy_duration, yawn_count):
        """Generates dynamic fatigue percentage (0% to 100%) and categorizes alert levels.
        
        Levels:
            Safe: < 35%
            Warning: 35% - 70%
            Critical: > 70%
        """
        # Calculate base score from drowsiness duration (seconds) and yawning frequency
        fatigue_pct = (min(drowsy_duration, 4.0) / 4.0) * 60.0
        fatigue_pct += min(yawn_count * 15.0, 40.0)
        
        fatigue_pct = min(100.0, max(0.0, fatigue_pct))
        
        if fatigue_pct < 35.0:
            level = "SAFE"
        elif fatigue_pct < 70.0:
            level = "WARNING"
        else:
            level = "CRITICAL"
            
        return fatigue_pct, level

    def detect_emotion(self, landmarks):
        """Classifies base driver emotional state using facial landmark geometries.
        
        Calculates mouth corner height relative to the upper lip (smiling detection)
        and eyebrow distance (frowning/neutral detection).
        """
        # Mouth corners (61, 291) vs upper lip (13) and lower lip (14)
        p_61 = np.array([landmarks[61].x, landmarks[61].y])
        p_291 = np.array([landmarks[291].x, landmarks[291].y])
        p_13 = np.array([landmarks[13].x, landmarks[13].y])
        p_14 = np.array([landmarks[14].x, landmarks[14].y])
        
        lip_center = (p_13 + p_14) / 2.0
        corners_center_y = (p_61[1] + p_291[1]) / 2.0
        
        # A smile pulls mouth corners upwards (lower Y values in image space)
        mouth_width = np.linalg.norm(p_61 - p_291)
        if mouth_width == 0:
            return "NEUTRAL"
            
        smile_ratio = (lip_center[1] - corners_center_y) / mouth_width
        
        if smile_ratio > 0.15:
            return "HAPPY/SMILING"
        elif smile_ratio < -0.05:
            return "STRESSED/FROWNING"
        return "NEUTRAL"

    def estimate_stress_level(self, landmarks, yaw, pitch, roll, blink_rate_per_min):
        """Estimates driver stress index based on blink rate and head pose jitter."""
        # Accumulate head pose values to compute variance (micro-jitters indicate stress/fatigue)
        self.head_pose_jitter.append(yaw + pitch + roll)
        if len(self.head_pose_jitter) > 100:
            self.head_pose_jitter.pop(0)
            
        jitter_val = 0.0
        if len(self.head_pose_jitter) > 10:
            jitter_val = float(np.std(self.head_pose_jitter))
            
        # Stress score logic combining high blink rate and high head jitter
        stress_score = (jitter_val * 4.0) + (max(0, blink_rate_per_min - 20) * 2.0)
        stress_score = min(100.0, max(0.0, stress_score))
        
        if stress_score < 40.0:
            return stress_score, "LOW"
        elif stress_score < 75.0:
            return stress_score, "MEDIUM"
        return stress_score, "HIGH"

    def simulate_steering_drift(self, attention_score, dt=0.03):
        """Simulates steering wheel micro-correction drift.
        
        If driver attention drops, the vehicle starts drifting, requiring 
        larger virtual corrections, simulating distracted driving behavior.
        """
        # Drift coefficient increases as attention score drops
        drift_factor = max(0.1, (100.0 - attention_score) / 10.0)
        
        # Apply random micro-drift
        drift = np.random.normal(0, 2.0) * drift_factor * dt
        self.steering_angle += drift
        
        # Virtual correction from driver (diminished if distracted)
        correction_factor = max(0.1, attention_score / 100.0)
        self.steering_angle -= self.steering_angle * 0.1 * correction_factor
        
        # Clamp steering angle
        self.steering_angle = max(-45.0, min(45.0, self.steering_angle))
        return float(self.steering_angle)
