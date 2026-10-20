
from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.aluno import Aluno
from app.models.prova_aluno import ProvaAluno
from app.services.correcao_service import corrigir_prova


def gerar_ranking(db: Session, prova_id: int):
    # Busca somente participações corrigidas da prova selecionada.
    participacoes = (
        db.query(ProvaAluno, Aluno)
        .join(Aluno, Aluno.id_aluno == ProvaAluno.aluno_id)
        .filter(
            ProvaAluno.prova_id == prova_id,
            ProvaAluno.corrigida.is_(True)
        )
        .all()
    )

    # Separa os resultados por turma.
    ranking_por_turma = defaultdict(list)

    for participacao, aluno in participacoes:
        resultado = corrigir_prova(
            db,
            participacao.id_prova_aluno
        )

        ranking_por_turma[aluno.turma].append({
            "prova_aluno_id": participacao.id_prova_aluno,
            "aluno_id": aluno.id_aluno,
            "nome_aluno": aluno.nome_aluno,
            "turma": aluno.turma,
            "total_questoes": resultado["total_questoes"],
            "acertos": resultado["acertos"],
            "erros": resultado["erros"]
        })

    # Ordena cada turma e atribui as posições.
    turmas = []

    for turma, alunos in sorted(ranking_por_turma.items()):
        alunos.sort(
            key=lambda aluno: (
                -aluno["acertos"],
                aluno["nome_aluno"].lower()
            )
        )

        # Atribui as posições, considerando os empates.
        posicao_anterior = None
        posicao_atribuida = None

        for indice, aluno in enumerate(alunos, start=1):
            if aluno["acertos"] != posicao_anterior:
                posicao_atribuida = indice
                posicao_anterior = aluno["acertos"]

            aluno["posicao"] = posicao_atribuida

        turmas.append({
            "turma": turma,
            "total_participantes": len(alunos),
            "alunos": alunos
        })

    return {
        "prova_id": prova_id,
        "total_turmas": len(turmas),
        "turmas": turmas
    }
