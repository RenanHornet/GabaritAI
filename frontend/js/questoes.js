
const API_URL = 'http://127.0.0.1:8000';

//lista as provas (GET /provas)
async function listarProvas() {
    const provaSelect = document.getElementById("provaSelect");
    try {
        const response = await fetch(`${API_URL}/provas`);
        if (!response.ok) {
            throw new Error("Erro ao listar provas");
        }
        const provas = await response.json();
        provas.forEach(prova => {
            const option = document.createElement("option");

            option.value = prova.id_prova;
            option.textContent = prova.titulo;

            provaSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar provas:", error);
    }
}

//lista as questões da prova selecionada (GET /provas/{id}/questoes)
async function listarQuestoesPorProva(idProva) {
    const tabelaBody = document.getElementById("tabelaQuestoesBody");
    try {
        const response = await fetch(
            `${API_URL}/provas/${idProva}/questoes`
        );

        if (!response.ok) {
            throw new Error("Erro ao listar questões");
        }

        const questoes = await response.json();

        tabelaBody.innerHTML = "";
        if (questoes.length === 0) {
            tabelaBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        Nenhuma questão cadastrada para esta prova.
                    </td>
                </tr>
            `;
            return;
        }

        questoes.forEach(questao => {
            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${questao.numero_questao}</td>
                <td>${questao.alternativa_correta}</td>
                <td>${questao.professor_id}</td>
                <td>
                    <button class="btn btn-warning btn-sm">
                        Editar
                    </button>
                </td>
            `;
            tabelaBody.appendChild(linha);
        });

    } catch (error) {
        console.error("Erro ao listar questões:", error);
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger fw-bold">
                    Erro ao carregar questões.
                </td>
            </tr>
        `;
    }
}

//cadastra uma questão na prova selecionada (POST /questoes)
document
    .getElementById("cadastroQuestaoForm")
    .addEventListener("submit", async function(event) {
        event.preventDefault();

        const provaSelect = document.getElementById("provaSelect");
        const numeroQuestao = Number(document.getElementById("numeroQuestao").value);
        const alternativaCorreta = document.getElementById("alternativaCorreta").value;
        const provaId = Number(provaSelect.value);
        
        if (!provaId) {
            alert("Selecione uma prova antes de cadastrar a questão.");
            return;
        }

        const novaQuestao = {
            numero_questao: numeroQuestao,
            alternativa_correta: alternativaCorreta,
            prova_id: provaId,
            professor_id: 1
        };

        try {
            const response = await fetch(`${API_URL}/questoes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(novaQuestao)
            });

            if (!response.ok) {
                const erro = await response.json().catch(() => ({}));
                throw new Error(erro.detail || "Erro ao cadastrar questão");
            }

            document.getElementById("cadastroQuestaoForm").reset();
            alert("Questão cadastrada com sucesso.");
            listarQuestoesPorProva(provaId);
        } catch (error) {
            console.error("Erro ao cadastrar questão:", error);
            alert(error.message || "Erro de conexão com o servidor.");
        }
    });


//seleçao da prova
document
    .getElementById("seletorProvaForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const provaSelect = document.getElementById("provaSelect");

        const idProva = provaSelect.value;

        if (!idProva) {
            alert("Selecione uma prova.");
            return;
        }

        listarQuestoesPorProva(idProva);
    });

listarProvas();
