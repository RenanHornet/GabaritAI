from fastapi import FastAPI
from app.routes.base import router

app = FastAPI(
    title="GabaritAI API",
    version="0.1.0"
)

app.include_router(router)