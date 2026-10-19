
const API_URL = "http://127.0.0.1:8000";

const provaSelect = document.getElementById("provaSelect");
const alunoSelect = document.getElementById("alunoSelect");
const listaQuestoes = document.getElementById("listaQuestoes");
const formRespostas = document.getElementById("formRespostas");
const mensagem = document.getElementById("mensagem");

const alternativas = ["A", "B", "C", "D", "E"];

let questoesAtuais = [];

// Exibe mensagens para o usuário.
function exibirMensagem(texto, tipo = "danger") {
    mensagem.textContent = texto;
    mensagem.className = `mt-3 text-${tipo}`;
}

// Faz requisições à API e trata erros HTTP.
async function requisitar(url, opcoes = {}) {
    const resposta = await fetch(`${API_URL}${url}`, opcoes);

    const dados = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        const erro = dados?.detail;

        throw new Error(
            typeof erro === "string"
                ? erro
                : `Erro na requisição: HTTP ${resposta.status}`
        );
    }

    return dados;
}

// Carrega as provas e os alunos cadastrados.
async function carregarDadosIniciais() {
    try {
        const [provas, alunos] = await Promise.all([
            requisitar("/provas"),
            requisitar("/alunos")
        ]);

        provas.forEach((prova) => {
            const option = document.createElement("option");
            option.value = prova.id_prova;
            option.textContent = prova.titulo;
            provaSelect.appendChild(option);
        });

        alunos.forEach((aluno) => {
            const option = document.createElement("option");
            option.value = aluno.id_aluno;
            option.textContent = aluno.nome_aluno;
            alunoSelect.appendChild(option);
        });

        exibirMensagem("Provas e alunos carregados.", "success");
    } catch (erro) {
        exibirMensagem(
            `Não foi possível carregar provas e alunos: ${erro.message}`
        );
    }
}

// Busca as questões da prova selecionada.
async function carregarQuestoes() {
    listaQuestoes.replaceChildren();
    questoesAtuais = [];

    if (!provaSelect.value) {
        return;
    }

    provaSelect.disabled = true;

    try {
        const questoes = await requisitar(
            `/provas/${provaSelect.value}/questoes`
        );

        questoesAtuais = questoes.sort(
            (a, b) => a.numero_questao - b.numero_questao
        );

        if (questoesAtuais.length === 0) {
            exibirMensagem("Esta prova não possui questões cadastradas.");
            return;
        }

        renderizarQuestoes();
        exibirMensagem(
            `${questoesAtuais.length} questões carregadas.`,
            "success"
        );
    } catch (erro) {
        exibirMensagem(
            `Não foi possível carregar as questões: ${erro.message}`
        );
    } finally {
        provaSelect.disabled = false;
    }
}

// Monta as alternativas usando os IDs reais das questões.
function renderizarQuestoes() {
    listaQuestoes.replaceChildren();

    questoesAtuais.forEach((questao) => {
        const linha = document.createElement("div");
        linha.className = "border-bottom py-3";

        const titulo = document.createElement("p");
        titulo.className = "fw-semibold mb-2";
        titulo.textContent = `Questão ${questao.numero_questao}`;

        const grupo = document.createElement("div");
        grupo.className = "d-flex flex-wrap gap-3";

        alternativas.forEach((alternativa) => {
            const id = `questao-${questao.id_questao}-${alternativa}`;

            const wrapper = document.createElement("div");
            wrapper.className = "form-check";

            const input = document.createElement("input");
            input.type = "radio";
            input.className = "form-check-input";
            input.id = id;
            input.name = `questao-${questao.id_questao}`;
            input.value = alternativa;
            input.required = true;

            const label = document.createElement("label");
            label.className = "form-check-label";
            label.htmlFor = id;
            label.textContent = alternativa;

            wrapper.append(input, label);
            grupo.appendChild(wrapper);
        });

        linha.append(titulo, grupo);
        listaQuestoes.appendChild(linha);
    });
}

// Procura a participação existente ou cria uma nova.
async function obterParticipacao(alunoId, provaId) {
    const participacoes = await requisitar("/prova-aluno");

    const existente = participacoes.find(
        (participacao) =>
            participacao.aluno_id === Number(alunoId) &&
            participacao.prova_id === Number(provaId)
    );

    if (existente) {
        return existente.id_prova_aluno;
    }

    const novaParticipacao = await requisitar("/prova-aluno", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            aluno_id: Number(alunoId),
            prova_id: Number(provaId)
        })
    });

    return novaParticipacao.id_prova_aluno;
}

// Envia cada resposta ao endpoint já implementado.
formRespostas.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!formRespostas.reportValidity()) {
        return;
    }

    if (!provaSelect.value || !alunoSelect.value) {
        exibirMensagem("Selecione a prova e o aluno.");
        return;
    }

    if (questoesAtuais.length === 0) {
        exibirMensagem("A prova selecionada não possui questões carregadas.");
        return;
    }

    const botaoEnviar = formRespostas.querySelector(
        'button[type="submit"]'
    );

    botaoEnviar.disabled = true;
    exibirMensagem("Enviando respostas...", "secondary");

    try {
        const provaAlunoId = await obterParticipacao(
            alunoSelect.value,
            provaSelect.value
        );

        let totalEnviadas = 0;

        for (const questao of questoesAtuais) {
            const selecionada = formRespostas.querySelector(
                `input[name="questao-${questao.id_questao}"]:checked`
            );

            if (!selecionada) {
                throw new Error(
                    `Selecione uma alternativa para a questão ${questao.numero_questao}.`
                );
            }

            await requisitar("/respostas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    prova_aluno_id: provaAlunoId,
                    questao_id: questao.id_questao,
                    alternativa_marcada: selecionada.value
                })
            });

            totalEnviadas++;
        }

        exibirMensagem(
            `${totalEnviadas} respostas registradas com sucesso!`,
            "success"
        );
    } catch (erro) {
        exibirMensagem(
            `Erro ao enviar respostas: ${erro.message}`
        );
    } finally {
        botaoEnviar.disabled = false;
    }
});

// Atualiza as questões quando a prova muda.
provaSelect.addEventListener("change", carregarQuestoes);

// Inicializa o formulário.
carregarDadosIniciais();
