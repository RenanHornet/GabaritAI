from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.prova_aluno import ProvaAluno
from app.models.resposta import Resposta
from app.models.questao import Questao

def corrigir_prova(
    db:Session,
    prova_aluno_id: int
):
    participacao = (
        db.query(ProvaAluno)
        .filter(ProvaAluno.id_prova_aluno == prova_aluno_id)
        .first()
    )
    
    if not participacao:
        raise HTTPException(
           status_code=status.HTTP_404_NOT_FOUND,
           detail="Participação na prova não encontrada." 
        )
        
    questoes = (
        db.query(Questao)
        .filter(Questao.prova_id == participacao.prova_id)
        .all()
    )
    
    respostas = (
        db.query(Resposta)
        .filter(Resposta.prova_aluno_id == prova_aluno_id)
        .all()
    )
    
    if len(respostas) != len(questoes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível corrigir: existem questões sem resposta."
        )

    ids_questoes = {
        questao.id_questao
        for questao in questoes
    }

    for resposta in respostas:
        if resposta.questao_id not in ids_questoes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Não é possível corrigir: existe uma resposta "
                    "associada a uma questão de outra prova."
                )
            )

    acertos = 0
    erros = 0

    for questao in questoes:
        resposta_aluno = next(
            resposta
            for resposta in respostas
            if resposta.questao_id == questao.id_questao
        )

        if resposta_aluno.alternativa_marcada == questao.alternativa_correta:
            acertos += 1
        else:
            erros += 1
    
    #Marca a participação como corrigida.
    participacao.corrigida = True
    db.commit()
    
    return {
        "prova_aluno_id": prova_aluno_id,
        "total_questoes": len(questoes),
        "acertos": acertos,
        "erros": erros
    }