from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models import Product
from database import SessionLocal, engine, Base
import database_models
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

app = FastAPI()

# --- JWT CONFIGURATION ---
SECRET_KEY = "telusko_secret_key" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- BRIDGE (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PostgreSQL Tables
database_models.Base.metadata.create_all(bind=engine)

# --- SECURITY UTILITIES ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- LOGIN ENDPOINT ---
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Hardcoded credentials for your demo
    if form_data.username != "admin" or form_data.password != "password123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

# --- DATABASE CONNECTION ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- SECURED ROUTES ---
@app.get("/products")
def get_all_products(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    # This route is now protected by the JWT token
    return db.query(database_models.Product).all()

@app.post("/product")
def add_product(product: Product, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    new_db_item = database_models.Product(**product.model_dump())
    db.add(new_db_item)
    db.commit()
    db.refresh(new_db_item)
    return new_db_item

@app.delete("/product/{id}")
def delete_product(id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if db_product:
        db.delete(db_product)
        db.commit()
        return {"message": f"Product {id} deleted successfully"}
    return {"error": "Product not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)