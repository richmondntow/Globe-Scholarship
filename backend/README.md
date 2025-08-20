# Globe Scholarship Pro (FastAPI + SQLite)

## Backend setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env to set JWT_SECRET and optionally OPENAI_API_KEY
uvicorn main:app --reload --port 5000
```
API runs at `http://127.0.0.1:5000`.
CORS is open to simplify local file-based frontends.
SQLite DB file: `backend/app.db` (auto-created on first run).
