
const API_URL = "http://127.0.0.1:8000";

// Recupera o token salvo durante o login
function obterHeaders(headersAdicionais = {}) {
    const token = sessionStorage.getItem("token");

    console.log("Token encontrado:", Boolean(token));
    console.log("Tamanho do token:", token?.length);

    return {
        ...headersAdicionais,
        Authorization: `Bearer ${token}`
    };
}

// GET: carregar todos os alunos
async function carregarAlunos() {
    const tabelaBody = document.getElementById("tabelaAlunosBody");

    try {
        const response = await fetch(`${API_URL}/alunos`, {
            headers: obterHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erro ao listar alunos: HTTP ${response.status}`);
        }

        const alunos = await response.json();
        tabelaBody.innerHTML = "";

        if (alunos.length === 0) {
            tabelaBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        Nenhum aluno cadastrado.
                    </td>
                </tr>`;
            return;
        }

        alunos.forEach(aluno => {
            const linha = document.createElement("tr");

            linha.innerHTML = `
                <td>${aluno.id_aluno}</td>
                <td class="fw-bold"></td>
                <td><span class="badge badge-turma">Turma ${aluno.turma}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger fw-bold">
                        🗑️ Excluir
                    </button>
                </td>
            `;

            // Evita interpretar o nome do aluno como HTML
            linha.children[1].textContent = aluno.nome_aluno;

            linha.querySelector("button").addEventListener("click", () => {
                deletarAluno(aluno.id_aluno);
            });

            tabelaBody.appendChild(linha);
        });

    } catch (error) {
        console.error("Erro ao carregar alunos:", error);

        tabelaBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>`;
    }
}

// GET: carregar alunos por turma
async function carregarAlunosPorTurma(turma) {
    const tabelaBody = document.getElementById("tabelaAlunosBody");

    try {
        const response = await fetch(`${API_URL}/alunos/${turma}`, {
            headers: obterHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erro ao pesquisar alunos: HTTP ${response.status}`);
        }

        const alunos = await response.json();
        tabelaBody.innerHTML = "";

        if (alunos.length === 0) {
            tabelaBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        Nenhum aluno encontrado para a turma ${turma}.
                    </td>
                </tr>`;
            return;
        }

        alunos.forEach(aluno => {
            const linha = document.createElement("tr");

            linha.innerHTML = `
                <td>${aluno.id_aluno}</td>
                <td class="fw-bold"></td>
                <td><span class="badge badge-turma">Turma ${aluno.turma}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger fw-bold">
                        🗑️ Excluir
                    </button>
                </td>
            `;

            linha.children[1].textContent = aluno.nome_aluno;

            linha.querySelector("button").addEventListener("click", () => {
                deletarAluno(aluno.id_aluno);
            });

            tabelaBody.appendChild(linha);
        });

    } catch (error) {
        console.error("Erro ao carregar alunos por turma:", error);

        tabelaBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>`;
    }
}

// DELETE: excluir aluno

// DELETE: excluir aluno
async function deletarAluno(id_aluno) {
    if (!confirm(`Deseja realmente excluir o aluno ID ${id_aluno}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/alunos/${id_aluno}`, {
            method: "DELETE",
            headers: obterHeaders()
        });

        const dados = await response.json();

        if (!response.ok) {
            throw new Error(dados.detail || `Erro HTTP ${response.status}`);
        }

        alert(dados.mensagem || "Aluno excluído com sucesso!");
        carregarAlunos();

    } catch (error) {
        console.error("Erro ao excluir aluno:", error);
        alert(error.message);
    }
}


// Botão pesquisar
document.getElementById("btnPesquisar").addEventListener("click", () => {
    const turmaInput = document.getElementById("pesquisa").value.trim();

    if (!turmaInput) {
        alert("Por favor, digite o número da turma para buscar.");
        return;
    }

    const turmaNumero = parseInt(turmaInput, 10);

    if (isNaN(turmaNumero)) {
        alert("Informe uma turma válida.");
        return;
    }

    carregarAlunosPorTurma(turmaNumero);
});

// Botão ver todos
document.getElementById("btnLimparPesquisa").addEventListener("click", () => {
    document.getElementById("pesquisa").value = "";
    carregarAlunos();
});

// POST: cadastrar aluno
document.getElementById("cadastroAlunoForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const alertaElement = document.getElementById("mensagemAlerta");
    const nomeInput = document.getElementById("nome").value.trim();
    const turmaInput = document.getElementById("turma").value.trim();

    if (!nomeInput || !turmaInput) {
        alertaElement.innerHTML = `
            <div class="alert alert-warning py-2">
                Preencha todos os campos.
            </div>`;
        return;
    }

    const turmaNumero = parseInt(turmaInput, 10);

    if (isNaN(turmaNumero)) {
        alertaElement.innerHTML = `
            <div class="alert alert-warning py-2">
                A turma deve ser um número válido.
            </div>`;
        return;
    }

    const novoAluno = {
        nome_aluno: nomeInput,
        turma: turmaNumero
    };

    try {
        const response = await fetch(`${API_URL}/alunos`, {
            method: "POST",
            headers: obterHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(novoAluno)
        });

        const dados = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(
                typeof dados?.detail === "string"
                    ? dados.detail
                    : `Erro ao cadastrar aluno: HTTP ${response.status}`
            );
        }

        alertaElement.innerHTML = `
            <div class="alert alert-success py-2">
                Aluno cadastrado com sucesso!
            </div>`;

        document.getElementById("cadastroAlunoForm").reset();

        carregarAlunos();

    } catch (error) {
        console.error("Erro ao cadastrar aluno:", error);

        alertaElement.innerHTML = `
            <div class="alert alert-danger py-2">
                ${error.message}
            </div>`;
    }
});

// Carrega os alunos ao abrir a página
carregarAlunos();
