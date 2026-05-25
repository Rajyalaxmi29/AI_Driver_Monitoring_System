import cv2
import numpy as np

def apply_night_mode_enhancement(image, brightness_threshold=70):
    """Enhances frame contrast and brightness in low-light environments.
    
    If the average brightness of the image is below the threshold, it converts 
    the frame to LAB color space, applies CLAHE (Contrast Limited Adaptive 
    Histogram Equalization) to the Lightness channel, and converts it back.
    
    Returns:
        enhanced_image: cv2 image frame
        is_enhanced: bool indicating if enhancement was applied
    """
    # Convert to grayscale to check overall brightness
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    
    if mean_brightness < brightness_threshold:
        # Convert BGR to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        
        # Apply CLAHE to Lightness channel
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l_channel)
        
        # Merge enhanced channel back and convert to BGR
        enhanced_lab = cv2.merge((cl, a_channel, b_channel))
        enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
        return enhanced_bgr, True
    
    return image, False
