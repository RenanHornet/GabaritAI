from sqlalchemy import BigInteger, Column, Integer, JSON, String, Text

from app.database.base import Base


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    exam_id = Column(BigInteger, nullable=False)
    student_id = Column(BigInteger, nullable=True)
    image_path = Column(String(1024), nullable=False)
    status = Column(String(24), nullable=False, default="PENDING")
    attempts = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    result_json = Column(JSON, nullable=True)
