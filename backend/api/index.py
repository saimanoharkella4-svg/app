import os
import sys
import traceback

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(THIS_DIR)
GRANDPARENT_DIR = os.path.dirname(PARENT_DIR)

for p in [PARENT_DIR, os.path.join(PARENT_DIR, "backend"), os.path.join(GRANDPARENT_DIR, "backend"), GRANDPARENT_DIR]:
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
