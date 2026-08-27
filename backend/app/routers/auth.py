from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from sqlalchemy.future import select
import uuid
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "supersecretkey"  # Should be env var in prod
ALGORITHM = "HS256"

# -- Database Models --
class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

# -- Pydantic Models --
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserProfile(BaseModel):
    id: uuid.UUID
    email: str
    role: str

# -- Dependencies (Stubs for demonstration) --
async def get_db():
    # In a real app, this yields an AsyncSession
    yield None

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str, db: AsyncSession = Depends(get_db)):
    # Verify JWT and fetch user
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    # In a real app: user = await db.execute(select(User).where(User.email == email))
    # Return mock for now
    return UserProfile(id=uuid.uuid4(), email=email, role=payload.get("role", "user"))

# -- Endpoints --
@router.post("/register", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user (admin only in real life)"""
    logger.info("Registering user", email=user.email)
    # Check existing, hash password, save to DB...
    hashed = pwd_context.hash(user.password)
    # db.add(...)
    return UserProfile(id=uuid.uuid4(), email=user.email, role=user.role)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Validate credentials and return JWT"""
    logger.info("User login attempt", email=credentials.email)
    # Verify against DB...
    # if not pwd_context.verify(credentials.password, db_user.hashed_password): raise 401
    token = create_access_token(data={"sub": credentials.email, "role": "admin"})
    return Token(access_token=token)

@router.get("/me", response_model=UserProfile)
async def get_me(current_user: UserProfile = Depends(get_current_user)):
    """Return current user profile"""
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: UserProfile = Depends(get_current_user)):
    """Refresh JWT token"""
    token = create_access_token(data={"sub": current_user.email, "role": current_user.role})
    return Token(access_token=token)
