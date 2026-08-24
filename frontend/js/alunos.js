const API_URL = 'http://127.0.0.1:8000';

//método GET para carregar os alunos e função DELETE no botão da tabela criada pelo JS 
async function carregarAlunos() {
    const tabelaBody = document.getElementById('tabelaAlunosBody');

    try {
        const response = await fetch(`${API_URL}/alunos`);
        if (!response.ok) throw new Error('Erro ao listar alunos');

        const alunos = await response.json();
        tabelaBody.innerHTML = '';

        if (alunos.length === 0) {
            tabelaBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhum aluno cadastrado.</td></tr>`;
            return;
        }

        alunos.forEach(aluno => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${aluno.id_aluno}</td>
                <td class="fw-bold">${aluno.nome_aluno}</td>
                <td><span class="badge bg-secondary fs-6">Turma ${aluno.turma}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger fw-bold" onclick="deletarAluno(${aluno.id_aluno})">
                        🗑️ Excluir
                    </button>
                </td>
            `;
            tabelaBody.appendChild(linha);
        });
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        tabelaBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Erro ao carregar dados dos alunos.</td></tr>`;
    }

    
    window.deletarAluno = async function(id_aluno) {
        if (!confirm(`Deseja realmente excluir o aluno ID ${id_aluno}?`)) return;

        try {
            const response = await fetch(`${API_URL}/alunos/${id_aluno}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                carregarAlunos(); // Atualiza a tabela após excluir
            } else {
                alert('Erro ao excluir aluno.');
            }
        } catch (error) {
            console.error('Erro ao excluir aluno:', error);
            alert('Erro ao se conectar com o servidor.');
        }
    };
}

//método POST para cadastrar um novo aluno
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
        turma: parseInt(turmaInput, 10) 
    };

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