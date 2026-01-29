from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Ensure 'admin' matches the password you set for the 'postgres' user in pgAdmin
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:admin@localhost:5432/postgres"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This is the Base that bridges your models to PostgreSQL
Base = declarative_base()