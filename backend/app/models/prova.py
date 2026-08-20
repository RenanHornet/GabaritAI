from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.database.base import Base

class Prova(Base):
    __tablename__ = "prova"

    id_prova = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(100), nullable=False)
    descricao = Column(String(255), nullable=True)
    data_aplicacao = Column(Date)
    professor_id = Column(
    Integer,
    ForeignKey("professor.id_cadastro"),
    nullable=False
)
    