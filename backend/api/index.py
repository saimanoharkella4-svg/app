import os
import sys

# Append parent directory to sys.path
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(THIS_DIR)
GRANDPARENT_DIR = os.path.dirname(PARENT_DIR)

for p in [PARENT_DIR, os.path.join(PARENT_DIR, "backend"), GRANDPARENT_DIR, os.path.join(GRANDPARENT_DIR, "backend")]:
    if p and os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

from app.main import app

handler = app
application = app
