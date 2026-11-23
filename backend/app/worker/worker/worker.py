"""
Worker do GabaritAI: lê as fotos dos cartões em segundo plano.

Fluxo:
  1) a API salva a foto em disco e cria uma linha em processing_jobs;
  2) este processo pega as linhas PENDING e lê a foto com o OpenCV;
  3) o resultado fica em result_json para a tela de respostas buscar.

A nota não é calculada aqui. O professor confere a leitura na tela e
a correção usa o mesmo caminho do preenchimento manual.

Para executar (dentro da pasta backend):
    python -m app.worker.worker.runner
"""

from __future__ import annotations

import json
import os
import socket
import time
import traceback
from pathlib import Path
from typing import Any

from sqlalchemy import text

from app.database.connection import engine
from app.worker.vision.omr_engine import process_image

POLL_SECONDS = 1.5
MAX_ATTEMPTS = 3
BASE_DIR = Path.cwd()
DEBUG_DIR = BASE_DIR / "debug_omr"
WORKER_ID = f"{socket.gethostname()}-{os.getpid()}"


def claim_one_job() -> dict[str, Any] | None:
    """Pega o job mais antigo e marca como PROCESSING."""
    with engine.begin() as conn:
        row = conn.execute(text("""
            SELECT id, image_path, attempts
            FROM processing_jobs
            WHERE status = 'PENDING' AND attempts < :max_attempts
            ORDER BY created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        """), {"max_attempts": MAX_ATTEMPTS}).mappings().first()

        if not row:
            return None

        conn.execute(text("""
            UPDATE processing_jobs
            SET status = 'PROCESSING',
                attempts = attempts + 1,
                worker_id = :worker_id,
                started_at = NOW(),
                error_message = NULL
            WHERE id = :job_id
        """), {"worker_id": WORKER_ID, "job_id": row["id"]})

        return dict(row)


def finish_job(job_id: int, result: dict[str, Any]) -> None:
    with engine.begin() as conn:
        conn.execute(text("""
            UPDATE processing_jobs
            SET status = 'COMPLETED',
                result_json = CAST(:result_json AS JSON),
                finished_at = NOW(),
                error_message = NULL
            WHERE id = :job_id
        """), {"result_json": json.dumps(result), "job_id": job_id})


def fail_job(job: dict[str, Any], exc: Exception) -> None:
    """Devolve o job para a fila ou marca FAILED na última tentativa."""
    status = "FAILED" if int(job["attempts"]) + 1 >= MAX_ATTEMPTS else "PENDING"
    with engine.begin() as conn:
        conn.execute(text("""
            UPDATE processing_jobs
            SET status = :status,
                error_message = :error,
                finished_at = CASE WHEN :status = 'FAILED' THEN NOW() ELSE NULL END
            WHERE id = :job_id
        """), {"status": status, "error": str(exc)[:6000], "job_id": job["id"]})
    print(f"[job {job['id']}] falhou ({status}): {exc}")


def process_job(job: dict[str, Any]) -> None:
    job_id = int(job["id"])
    print(f"[job {job_id}] lendo imagem...")
    result = process_image(
        image_path=BASE_DIR / str(job["image_path"]),
        debug_dir=DEBUG_DIR / f"job_{job_id}",
    )
    finish_job(job_id, result)
    print(f"[job {job_id}] concluído.")


def recover_stale_jobs() -> None:
    """Devolve à fila os jobs abandonados por uma queda do worker."""
    with engine.begin() as conn:
        conn.execute(text("""
            UPDATE processing_jobs
            SET status = 'PENDING', worker_id = NULL, started_at = NULL
            WHERE status = 'PROCESSING'
              AND started_at < (NOW() - INTERVAL 10 MINUTE)
        """))


def main() -> None:
    recover_stale_jobs()
    print(f"GabaritAI Worker iniciado: {WORKER_ID}")
    while True:
        job = None
        try:
            job = claim_one_job()
            if job is None:
                time.sleep(POLL_SECONDS)
                continue
            process_job(job)
        except KeyboardInterrupt:
            print("Worker encerrado.")
            break
        except Exception as exc:
            traceback.print_exc()
            if job is not None:
                try:
                    fail_job(job, exc)
                except Exception:
                    traceback.print_exc()
            else:
                time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
