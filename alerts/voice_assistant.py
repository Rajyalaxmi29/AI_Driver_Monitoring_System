import subprocess
import threading

def speak(text):
    """Speaks the text asynchronously using Windows native System.Speech via PowerShell.
    
    This function spawns a background thread to call a lightweight PowerShell command, 
    preventing any frame-rate lag in the main computer vision processing loop.
    """
    def run_speech():
        # Escape single quotes for PowerShell safety
        safe_text = text.replace("'", "''")
        cmd = f"Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('{safe_text}')"
        subprocess.run(["powershell", "-Command", cmd], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Run in a daemon thread so it doesn't block the main GUI loop
    threading.Thread(target=run_speech, daemon=True).start()
