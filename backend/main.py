from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session
from dotenv import load_dotenv
import os

# Optional OpenAI integration
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except Exception:
    OPENAI_AVAILABLE = False

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-.env")
JWT_ALG = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
auth_scheme = HTTPBearer()

app = FastAPI(title="Globe Scholarship API")

# CORS: allow browser preflight OPTIONS and local file origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- MODELS --------------------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    saves = relationship("SavedScholarship", back_populates="user", cascade="all, delete-orphan")

class SavedScholarship(Base):
    __tablename__ = "saved_scholarships"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(300), nullable=False)
    provider = Column(String(300), nullable=True)
    deadline = Column(String(50), nullable=True)
    url = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saves")

Base.metadata.create_all(bind=engine)

# -------------------- UTILS --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def hash_password(plain):
    return pwd_context.hash(plain)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id: int = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

# -------------------- SCHEMAS --------------------
class SignupIn(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    first_name: str
    user_id: int

class ScholarshipIn(BaseModel):
    name: str
    provider: Optional[str] = ""
    deadline: Optional[str] = "unknown"
    url: str

class CountryQuery(BaseModel):
    country: str

class ScholarshipOut(BaseModel):
    name: str
    provider: str
    deadline: str
    url: str

# -------------------- AUTH ROUTES --------------------
@app.post("/auth/signup")
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Signup successful"}

@app.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id), "first_name": user.first_name})
    return TokenOut(access_token=token, first_name=user.first_name, user_id=user.id)

@app.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email}

# -------------------- SCHOLARSHIP ROUTES --------------------
@app.post("/fetch-scholarships", response_model=List[ScholarshipOut])
def fetch_scholarships(query: CountryQuery):
    """
    Uses OpenAI to suggest scholarships if OPENAI_API_KEY present.
    Otherwise returns an empty list with a demo example.
    """
    key = os.getenv("OPENAI_API_KEY")
    if OPENAI_AVAILABLE and key:
        try:
            client = OpenAI(api_key=key)
            prompt = (
                f"List 8 legitimate scholarships for students in {query.country}. "
                "Return ONLY JSON array of objects with fields: name, provider, deadline, url. "
                "Deadlines as YYYY-MM-DD or 'unknown'. URLs must be real."
            )
            chat = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )
            text = chat.choices[0].message.content.strip()
            # Try to parse as pure JSON; fallback if wrapped
            import json, re
            m = re.search(r"(\[\s*\{.*\}\s*\])", text, re.DOTALL)
            if m:
                data = json.loads(m.group(1))
            else:
                data = json.loads(text)
            # Coerce to pydantic shape
            clean = []
            for it in data:
                clean.append({
                    "name": str(it.get("name","")).strip()[:300],
                    "provider": str(it.get("provider","")).strip()[:300],
                    "deadline": str(it.get("deadline","unknown")).strip()[:50],
                    "url": str(it.get("url","")).strip()
                })
            return clean
        except Exception as e:
            # Fall back to demo item
            return [{
                "name": "Demo Scholarship",
                "provider": "Example Foundation",
                "deadline": "unknown",
                "url": "https://example.org/scholarship"
            }]
    else:
        return [{
            "name": "Demo Scholarship",
            "provider": "Example Foundation",
            "deadline": "unknown",
            "url": "https://example.org/scholarship"
        }]

@app.post("/scholarships/save")
def save_scholarship(item: ScholarshipIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = SavedScholarship(
        user_id=user.id,
        name=item.name.strip(),
        provider=(item.provider or "").strip(),
        deadline=(item.deadline or "unknown").strip(),
        url=item.url.strip()
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"message": "Saved", "id": rec.id}

@app.get("/scholarships/saved", response_model=List[ScholarshipOut])
def list_saved(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(SavedScholarship).filter(SavedScholarship.user_id == user.id).order_by(SavedScholarship.created_at.desc()).all()
    return [ScholarshipOut(name=r.name, provider=r.provider or "", deadline=r.deadline or "unknown", url=r.url) for r in rows]

@app.delete("/scholarships/saved/{scholarship_id}")
def delete_saved(scholarship_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(SavedScholarship).filter(SavedScholarship.id == scholarship_id, SavedScholarship.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row)
    db.commit()
    return {"message": "Deleted"}
