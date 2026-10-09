import os
import sys
import traceback

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(THIS_DIR)
BACKEND_DIR = os.path.join(PARENT_DIR, "backend")

for p in [BACKEND_DIR, PARENT_DIR]:
    if p and os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except Exception:
    try:
        from backend.app.main import app
    except Exception:
        traceback.print_exc()
        raise

handler = app
