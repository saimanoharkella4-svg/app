import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for d in [BACKEND_DIR, ROOT_DIR, CURRENT_DIR]:
    if os.path.exists(d) and d not in sys.path:
        sys.path.insert(0, d)

try:
    from app.main import app
except Exception as e:
    import logging
    logging.exception("Failed to import app.main from root api entrypoint")
    raise e
