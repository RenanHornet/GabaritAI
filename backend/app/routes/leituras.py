from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.aluno import Aluno
from app.models.processing_job import ProcessingJob
from app.models.prova import Prova

router = APIRouter(prefix="/leituras", tags=["Leitura do cartão"])

PASTA_UPLOADS = Path("uploads")
EXTENSOES = {"image/jpeg": ".jpg", "image/png": ".png"}
TAMANHO_MAXIMO = 10 * 1024 * 1024  # 10 MB


# Recebe a foto e cria o job que o worker vai processar.
@router.post("", status_code=status.HTTP_202_ACCEPTED)
def criar_leitura(
    prova_id: int = Form(...),
    aluno_id: int = Form(...),
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not db.get(Prova, prova_id):
        raise HTTPException(status_code=404, detail="Prova não encontrada.")

    if not db.get(Aluno, aluno_id):
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    extensao = EXTENSOES.get(arquivo.content_type)
    if not extensao:
        raise HTTPException(status_code=400, detail="Envie uma foto JPG ou PNG.")

    conteudo = arquivo.file.read(TAMANHO_MAXIMO + 1)
    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(status_code=400, detail="A foto deve ter até 10 MB.")

    # O nome é gerado aqui para nunca confiar no nome enviado pelo usuário.
    caminho = PASTA_UPLOADS / f"{uuid4().hex}{extensao}"
    PASTA_UPLOADS.mkdir(exist_ok=True)
    caminho.write_bytes(conteudo)

    job = ProcessingJob(
        exam_id=prova_id,
        student_id=aluno_id,
        image_path=str(caminho),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return {"id": job.id, "status": job.status}


# A tela consulta esta rota até a leitura terminar.
@router.get("/{leitura_id}")
def consultar_leitura(leitura_id: int, db: Session = Depends(get_db)):
    job = db.get(ProcessingJob, leitura_id)
    if not job:
        raise HTTPException(status_code=404, detail="Leitura não encontrada.")

    respostas = [
        {
            "questao": item["question"],
            "alternativa": item["answer"],
            "status": item["status"],
        }
        for item in (job.result_json or {}).get("answers", [])
    ]

    return {
        "id": job.id,
        "status": job.status,
        "erro": job.error_message,
        "respostas": respostas,
    }
