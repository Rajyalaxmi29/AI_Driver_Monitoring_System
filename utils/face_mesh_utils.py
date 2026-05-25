import cv2
import numpy as np

# MediaPipe Landmark Indices for Eye Aspect Ratio (EAR)
LEFT_EYE_INDICES = [362, 263, 385, 380, 387, 373] # [corner_inner, corner_outer, v1_t, v1_b, v2_t, v2_b]
RIGHT_EYE_INDICES = [33, 133, 160, 144, 158, 153] # [corner_outer, corner_inner, v1_t, v1_b, v2_t, v2_b]

# Face contours to render in HUD view
FACE_SILHOUETTE = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
LEFT_EYE_CONTOUR = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
RIGHT_EYE_CONTOUR = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
INNER_LIPS_CONTOUR = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95]
LEFT_EYEBROW_CONTOUR = [276, 283, 282, 295, 285, 300, 293, 334, 296, 336]
RIGHT_EYEBROW_CONTOUR = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107]

def get_distance(p1, p2):
    """Calculates Euclidean distance between two points."""
    return np.linalg.norm(p1 - p2)

def calculate_ear(landmarks, eye_indices, w, h):
    """Calculates the Eye Aspect Ratio (EAR) for a single eye.
    
    Formula:
        EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
    """
    p = [np.array([landmarks[idx].x * w, landmarks[idx].y * h]) for idx in eye_indices]
    v1 = get_distance(p[2], p[3])
    v2 = get_distance(p[4], p[5])
    h1 = get_distance(p[0], p[1])
    
    if h1 == 0:
        return 0.0
    return (v1 + v2) / (2.0 * h1)

def calculate_mar(landmarks, w, h):
    """Calculates the Mouth Aspect Ratio (MAR) to monitor yawning.
    
    Formula:
        MAR = ||p_top - p_bottom|| / ||p_left - p_right||
    """
    p_78 = np.array([landmarks[78].x * w, landmarks[78].y * h])
    p_308 = np.array([landmarks[308].x * w, landmarks[308].y * h])
    p_13 = np.array([landmarks[13].x * w, landmarks[13].y * h])
    p_14 = np.array([landmarks[14].x * w, landmarks[14].y * h])
    
    dist_v = get_distance(p_13, p_14)
    dist_h = get_distance(p_78, p_308)
    
    if dist_h == 0:
        return 0.0
    return dist_v / dist_h

def draw_contour(image, landmarks, indices, color, w, h, is_closed=True, thickness=1):
    """Draws connected lines between specified landmarks on the image."""
    points = []
    for idx in indices:
        if idx < len(landmarks):
            pt = landmarks[idx]
            points.append((int(pt.x * w), int(pt.y * h)))
    if points:
        points = np.array(points, dtype=np.int32)
        cv2.polylines(image, [points], is_closed, color, thickness, cv2.LINE_AA)

def draw_hud_contours(image, landmarks, w, h):
    """Draws all essential facial silhouettes for a high-tech HUD effect."""
    draw_contour(image, landmarks, FACE_SILHOUETTE, (220, 220, 220), w, h, is_closed=True, thickness=1)
    draw_contour(image, landmarks, LEFT_EYE_CONTOUR, (0, 255, 0), w, h, is_closed=True, thickness=1)
    draw_contour(image, landmarks, RIGHT_EYE_CONTOUR, (0, 255, 0), w, h, is_closed=True, thickness=1)
    draw_contour(image, landmarks, INNER_LIPS_CONTOUR, (0, 255, 255), w, h, is_closed=True, thickness=1)
    draw_contour(image, landmarks, LEFT_EYEBROW_CONTOUR, (180, 180, 180), w, h, is_closed=False, thickness=1)
    draw_contour(image, landmarks, RIGHT_EYEBROW_CONTOUR, (180, 180, 180), w, h, is_closed=False, thickness=1)
