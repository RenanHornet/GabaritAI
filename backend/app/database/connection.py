from dotenv import load_dotenv
import os

load_dotenv()

HOST = os.getenv("DB_HOST")
PORT = os.getenv("DB_PORT")
DATABASE = os.getenv("DB_NAME")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = f"mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

'''try:
    # Teste da conexão com o banco de dados
    with engine.connect() as connection:
        print("Conexão com o MySQL estabelecida com sucesso.")
except Exception as e:
    print(f"Conexão com o MySQL falhou: {e}")'''
    
def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()