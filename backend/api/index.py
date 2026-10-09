import os
import sys

# Ensure backend root directory is in sys.path for Vercel Serverless environment
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)

if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from app.main import app
except Exception as e:
    import logging
    logging.exception("Failed to import FastAPI app in Vercel serverless entrypoint")
    raise e
