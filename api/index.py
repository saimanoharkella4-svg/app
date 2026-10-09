import os
import sys
import traceback
from fastapi import FastAPI

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(THIS_DIR)
BACKEND_DIR = os.path.join(PARENT_DIR, "backend")

for p in [BACKEND_DIR, PARENT_DIR]:
    if p and os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

app = None
init_error = None

try:
    from app.main import app as _app
    app = _app
except Exception as e:
    init_error = traceback.format_exc()
    print("Vercel Serverless Init Error:", init_error)

if app is None:
    app = FastAPI(title="CogniTrack Serverless Fallback")

    @app.get("/{full_path:path}")
    def fallback_diagnostic(full_path: str):
        return {
            "status": "error",
            "message": "Backend serverless initialization error",
            "path": full_path,
            "error_details": str(init_error)
        }

handler = app
application = app
