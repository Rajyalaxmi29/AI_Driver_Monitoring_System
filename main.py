import sys
# Disable tensorflow to bypass broken native DLL loading on Python 3.13
sys.modules['tensorflow'] = None

from ui.dashboard import launch_dashboard

if __name__ == "__main__":
    launch_dashboard()
