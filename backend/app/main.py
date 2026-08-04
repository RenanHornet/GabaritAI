from fastapi import FastAPI
from app.routes.base import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="GabaritAI API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)