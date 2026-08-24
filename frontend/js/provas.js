
//método POST para cadastrar um novo aluno
const API_URL = 'http://127.0.0.1:8000';

document.getElementById('cadastroAlunoForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const alertaElement = document.getElementById('mensagemAlerta');
    const nomeInput = document.getElementById('nome').value.trim();
    const turmaInput = document.getElementById('turma').value.trim();

    if (!nomeInput || !turmaInput) {
        alertaElement.innerHTML = `<div class="alert alert-warning py-2">⚠️ Preencha todos os campos.</div>`;
        return;
    }

    const novoAluno = {
        nome_aluno: nomeInput,
        turma: parseInt(turmaInput, 10) // Converte o texto para número inteiro
    };

    // Valida se o valor digitado na turma é realmente um número válido
    if (isNaN(novoAluno.turma)) {
        alertaElement.innerHTML = `<div class="alert alert-warning py-2">⚠️ A turma deve ser um número inteiro (Ex: 3, 301, 8).</div>`;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/alunos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoAluno)
        });

        if (response.ok) {
            alertaElement.innerHTML = `<div class="alert alert-success py-2">🟢 Aluno cadastrado com sucesso!</div>`;
            document.getElementById('cadastroAlunoForm').reset();
            
            if (typeof carregarAlunos === 'function') {
                carregarAlunos();
            }
        } else {
            const erroData = await response.json();
            console.error('Erro de validação 422:', erroData);
            alertaElement.innerHTML = `<div class="alert alert-danger py-2">🔴 Erro de validação nos dados enviados.</div>`;
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        alertaElement.innerHTML = `<div class="alert alert-danger py-2">🔴 Servidor indisponível.</div>`;
    }
});