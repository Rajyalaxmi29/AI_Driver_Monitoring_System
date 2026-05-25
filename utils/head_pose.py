import cv2
import numpy as np

# SolvePnP 3D Model Points (standard 3D facial coordinates)
# X points right (from viewer), Y points up, Z points out towards viewer
MODEL_POINTS = np.array([
    (0.0, 0.0, 0.0),             # Nose tip (index 1)
    (0.0, -330.0, -65.0),        # Chin (index 152)
    (-225.0, 170.0, -135.0),     # Right eye corner (index 33)
    (225.0, 170.0, -135.0),      # Left eye corner (index 263)
    (-150.0, -150.0, -125.0),    # Right mouth corner (index 61)
    (150.0, -150.0, -125.0)      # Left mouth corner (index 291)
], dtype=np.float32)

def estimate_head_pose(landmarks, w, h):
    """Estimates head pose (yaw, pitch, roll) from face mesh landmarks using cv2.solvePnP.
    
    Returns:
        success: bool indicating if calculation succeeded
        pitch, yaw, roll: float angles in degrees
        rvec, tvec: rotation and translation vectors
        camera_matrix: intrinsic camera calibration matrix used
    """
    p_nose = landmarks[1]
    p_chin = landmarks[152]
    p_reye = landmarks[33]
    p_leye = landmarks[263]
    p_rmouth = landmarks[61]
    p_lmouth = landmarks[291]
    
    image_points = np.array([
        (p_nose.x * w, p_nose.y * h),
        (p_chin.x * w, p_chin.y * h),
        (p_reye.x * w, p_reye.y * h),
        (p_leye.x * w, p_leye.y * h),
        (p_rmouth.x * w, p_rmouth.y * h),
        (p_lmouth.x * w, p_lmouth.y * h)
    ], dtype=np.float32)
    
    # Approximate camera intrinsic matrix (headless calibration)
    focal_length = w
    center = (w / 2.0, h / 2.0)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float32)
    dist_coeffs = np.zeros((4, 1))
    
    success, rvec, tvec = cv2.solvePnP(
        MODEL_POINTS, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
    )
    
    if not success:
        return False, 0.0, 0.0, 0.0, None, None, camera_matrix
    
    # Get rotation matrix from vector
    rmat, _ = cv2.Rodrigues(rvec)
    proj_matrix = np.hstack((rmat, tvec))
    
    # Decompose projection matrix to extract Euler angles
    euler_angles = cv2.decomposeProjectionMatrix(proj_matrix)[6]
    pitch = euler_angles[0, 0]
    yaw = euler_angles[1, 0]
    roll = euler_angles[2, 0]
    
    # --- Normalize Pitch ---
    # Standard facial model has Y-axis pointing up, so pitch is returned around -180.
    # We shift it by 180 to center it around 0 degrees when looking forward.
    if pitch < 0:
        pitch = pitch + 180.0
    else:
        pitch = pitch - 180.0
        
    return True, pitch, yaw, roll, rvec, tvec, camera_matrix

def draw_pose_axes(image, rvec, tvec, camera_matrix, landmarks, w, h):
    """Draws a 3D coordinate projection axis extending from the driver's nose."""
    if rvec is None or tvec is None:
        return
    
    axis_3d = np.array([
        (100.0, 0.0, 0.0),  # X axis (Red) - Yaw direction
        (0.0, 100.0, 0.0),  # Y axis (Green) - Pitch direction
        (0.0, 0.0, 100.0)   # Z axis (Blue) - Roll direction
    ], dtype=np.float32)
    
    dist_coeffs = np.zeros((4, 1))
    img_pts, _ = cv2.projectPoints(axis_3d, rvec, tvec, camera_matrix, dist_coeffs)
    
    pt_nose_2d = (int(landmarks[1].x * w), int(landmarks[1].y * h))
    pt_x_2d = (int(img_pts[0][0][0]), int(img_pts[0][0][1]))
    pt_y_2d = (int(img_pts[1][0][0]), int(img_pts[1][0][1]))
    pt_z_2d = (int(img_pts[2][0][0]), int(img_pts[2][0][1]))
    
    # Draw vector axes lines
    cv2.line(image, pt_nose_2d, pt_x_2d, (0, 0, 255), 2)  # Red: X axis
    cv2.line(image, pt_nose_2d, pt_y_2d, (0, 255, 0), 2)  # Green: Y axis
    cv2.line(image, pt_nose_2d, pt_z_2d, (255, 0, 0), 2)  # Blue: Z axis
