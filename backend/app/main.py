from fastapi import FastAPI
from app.routes.base import router
from app.routes.provas import router as provas
from fastapi.middleware.cors import CORSMiddleware
from app.routes.questoes import router as questoes
from app.routes.alunos import router as alunos
from app.routes.provas_alunos import router as provas_alunos
from app.routes.respostas import router as respostas
from app.routes.correcao import router as correcao
from app.routes.ranking import router as ranking

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

app.include_router(provas)

app.include_router(questoes)

app.include_router(alunos)

app.include_router(respostas)

app.include_router(provas_alunos)

app.include_router(correcao)

app.include_router(ranking)

