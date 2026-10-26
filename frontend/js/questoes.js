
const API_URL = "http://127.0.0.1:8000";

let questaoEditandoId = null;

// Lista as provas disponíveis
async function listarProvas() {
    const provaSelect = document.getElementById("provaSelect");

    try {
        const response = await fetch(`${API_URL}/provas`);

        if (!response.ok) {
            throw new Error("Erro ao listar provas.");
        }

        const provas = await response.json();

        // Evita duplicar opções ao carregar novamente
        provaSelect.querySelectorAll("option:not(:first-child)")
            .forEach(option => option.remove());

        provas.forEach(prova => {
            const option = document.createElement("option");
            option.value = prova.id_prova;
            option.textContent = prova.titulo;
            provaSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar provas:", error);
        alert("Não foi possível carregar as provas. Verifique o servidor.");
    }
}

// Lista as questões da prova selecionada
async function listarQuestoesPorProva(idProva) {
    const tabelaBody = document.getElementById("tabelaQuestoesBody");

    if (!idProva) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    Selecione uma prova para visualizar as questões.
                </td>
            </tr>
        `;
        return;
    }

    tabelaBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-muted">
                Carregando questões...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            `${API_URL}/provas/${idProva}/questoes`
        );

        if (!response.ok) {
            throw new Error("Erro ao buscar questões da prova.");
        }

        const questoes = await response.json();

        tabelaBody.innerHTML = "";

        if (!Array.isArray(questoes) || questoes.length === 0) {
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

            // Cria as células sem inserir dados da API como HTML
            const colunaNumero = document.createElement("td");
            colunaNumero.textContent = questao.numero_questao;

            const colunaAlternativa = document.createElement("td");
            colunaAlternativa.textContent = questao.alternativa_correta;

            const colunaProfessor = document.createElement("td");
            colunaProfessor.textContent = questao.professor_id;

            const colunaAcoes = document.createElement("td");
            const botaoEditar = document.createElement("button");

            botaoEditar.type = "button";
            botaoEditar.className = "btn btn-sm button-destaque";
            botaoEditar.textContent = "Editar";

            botaoEditar.addEventListener("click", function() {
                if (questao.id_questao == null) {
                    alert("O ID da questão não foi retornado pela API.");
                    return;
                }

                questaoEditandoId = questao.id_questao;

                document.getElementById("numeroQuestao").value =
                    questao.numero_questao;

                document.getElementById("alternativaCorreta").value =
                    questao.alternativa_correta;

                document.getElementById("botaoSalvarQuestao").textContent =
                    "Atualizar questão";

                document.getElementById("botaoCancelarEdicao")
                    .classList.remove("d-none");

                document.getElementById("numeroQuestao").focus();
            });

            colunaAcoes.appendChild(botaoEditar);

            linha.append(
                colunaNumero,
                colunaAlternativa,
                colunaProfessor,
                colunaAcoes
            );

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

// Sai do modo de edição e limpa o formulário
function sairModoEdicao() {
    questaoEditandoId = null;

    const formulario = document.getElementById("cadastroQuestaoForm");
    const botaoSalvar = document.getElementById("botaoSalvarQuestao");
    const botaoCancelar = document.getElementById("botaoCancelarEdicao");

    if (formulario) {
        formulario.reset();
    }

    if (botaoSalvar) {
        botaoSalvar.textContent = "Salvar questão";
    }

    if (botaoCancelar) {
        botaoCancelar.classList.add("d-none");
    }
}

// Cadastra ou atualiza uma questão
document
    .getElementById("cadastroQuestaoForm")
    .addEventListener("submit", async function(event) {
        event.preventDefault();

        const provaSelect = document.getElementById("provaSelect");
        const numeroQuestao = Number(
            document.getElementById("numeroQuestao").value
        );
        const alternativaCorreta =
            document.getElementById("alternativaCorreta").value;
        const provaId = Number(provaSelect.value);

        if (!provaId) {
            alert("Selecione uma prova antes de salvar a questão.");
            return;
        }

        if (!Number.isInteger(numeroQuestao) || numeroQuestao <= 0) {
            alert("O número da questão deve ser um inteiro maior que zero.");
            return;
        }

        if (!["A", "B", "C", "D", "E"].includes(alternativaCorreta)) {
            alert("Selecione uma alternativa válida.");
            return;
        }

        const estavaEditando = questaoEditandoId !== null;

        const questao = {
            numero_questao: numeroQuestao,
            alternativa_correta: alternativaCorreta,
            prova_id: provaId,
            professor_id: 1
        };

        const url = estavaEditando
            ? `${API_URL}/questoes/${questaoEditandoId}`
            : `${API_URL}/questoes`;

        const metodo = estavaEditando ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: metodo,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(questao)
            });

            if (!response.ok) {
                const erro = await response.json().catch(() => ({}));

                throw new Error(
                    erro.detail ||
                    `Erro ao ${estavaEditando ? "atualizar" : "cadastrar"} questão.`
                );
            }

            // Sai do modo de edição somente após sucesso
            sairModoEdicao();

            // Atualiza a tabela da prova selecionada
            await listarQuestoesPorProva(provaId);

            alert(
                estavaEditando
                    ? "Questão atualizada com sucesso."
                    : "Questão cadastrada com sucesso."
            );

        } catch (error) {
            console.error("Erro ao salvar questão:", error);
            alert(error.message || "Erro de conexão com o servidor.");
        }
    });

// Cancela a edição
document
    .getElementById("botaoCancelarEdicao")
    .addEventListener("click", sairModoEdicao);

// Seleciona uma prova e carrega suas questões
document
    .getElementById("seletorProvaForm")
    .addEventListener("submit", async function(event) {
        event.preventDefault();

        const provaSelect = document.getElementById("provaSelect");
        const idProva = provaSelect.value;

        if (!idProva) {
            alert("Selecione uma prova.");
            return;
        }

        sairModoEdicao();

        await listarQuestoesPorProva(idProva);
    });

// Carrega as provas ao abrir a página
listarProvas();
