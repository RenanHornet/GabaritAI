
const API_URL = "http://127.0.0.1:8000";

const provaSelect = document.getElementById("provaSelect");
const turmaSelect = document.getElementById("turmaSelect")
const alunoSelect = document.getElementById("alunoSelect");
const listaQuestoes = document.getElementById("listaQuestoes");
const formRespostas = document.getElementById("formRespostas");
const mensagem = document.getElementById("mensagem");
const areaFoto = document.getElementById("areaFoto");
const areaRespostas = document.getElementById("areaRespostas");
const fotoCartao = document.getElementById("fotoCartao");
const botaoLer = document.getElementById("botaoLer");

const EM_BRANCO = "BRANCO";
const alternativas = ["A", "B", "C", "D", "E", EM_BRANCO];

let questoesAtuais = [];
let leituraPronta = false;

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

// Carrega  as turmas e  os alunos cadastrados.
async function carregarDadosIniciais() {
    try{
        const provas = await requisitar("/provas");

        provas.forEach((prova) => {
            const option = document.createElement("option");
            option.value = prova.id_prova;
            option.textContent = prova.titulo;
            provaSelect.appendChild(option);
        });
        exibirMensagem("Provas carregadas. Selecione a turma e o aluno.", "success");
    } catch (erro){
        exibirMensagem(`Não foi possível carregar as provas: ${erro.message}`

        );
    }
}

// Carrega as turmas disponíveis a partir dos alunos cadastrados.
async function carregarTurmas() {
    try {
        const alunos = await requisitar("/alunos");
        const turmas = [...new Set(alunos.map(aluno => aluno.turma))]
            .filter(turma => turma !== null && turma !== undefined)
            .sort((a, b) => a - b);

        turmaSelect.replaceChildren(
            new Option("Selecione uma turma", "")
        );

        turmas.forEach(turma => {
            turmaSelect.add(new Option(`Turma ${turma}`, turma));
        });
    } catch (erro) {
        exibirMensagem(`Não foi possível carregar as turmas: ${erro.message}`);
    }
}

// Carrega somente os alunos da turma selecionada.
async function carregarAlunosPorTurma() {
    alunoSelect.replaceChildren(
        new Option("Carregando alunos...", "")
    );
    alunoSelect.disabled = true;

    if (!turmaSelect.value) {
        alunoSelect.replaceChildren(
            new Option("Selecione primeiro uma turma", "")
        );
        return;
    }

    try {
        // Ajustaremos esta URL conforme a rota real do backend.
        const alunos = await requisitar(
            `/alunos/${turmaSelect.value}`
        );

        alunoSelect.replaceChildren(
            new Option("Selecione um aluno", "")
        );

        alunos.forEach(aluno => {
            alunoSelect.add(
                new Option(aluno.nome_aluno, aluno.id_aluno)
            );
        });

        alunoSelect.disabled = false;

        if (alunos.length === 0) {
            alunoSelect.replaceChildren(
                new Option("Nenhum aluno nesta turma", "")
            );
        }
    } catch (erro) {
        alunoSelect.replaceChildren(
            new Option("Erro ao carregar alunos", "")
        );
        exibirMensagem(`Não foi possível carregar os alunos: ${erro.message}`);
    }
}

// Busca as questões da prova selecionada.
async function carregarQuestoes() {
    listaQuestoes.replaceChildren();
    questoesAtuais = [];
    leituraPronta = false;
    atualizarModo();

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
        linha.id = `linha-${questao.id_questao}`;

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
            label.textContent = alternativa === EM_BRANCO ? "Em branco" : alternativa;

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

        // Envia as respostas de cada questão.
        for (const questao of questoesAtuais) {
            const selecionada = formRespostas.querySelector(
                `input[name="questao-${questao.id_questao}"]:checked`
            );

            if (!selecionada) {
                throw new Error(
                    `Selecione uma alternativa para a questão ${questao.numero_questao}.`
                );
            }

            // Questão em branco não gera resposta no banco.
            if (selecionada.value === EM_BRANCO) {
                continue;
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

        // Informa que o registro foi concluído.
        exibirMensagem(
            `${totalEnviadas} respostas registradas! Corrigindo a prova...`,
            "secondary"
        );

        // Executa a correção automática.
        const resultado = await requisitar(
            `/correcao/${provaAlunoId}`
        );

        // Exibe o resultado da correção.
        exibirMensagem(
            `Prova corrigida com sucesso! ` +
            `Acertos: ${resultado.acertos} | ` +
            `Erros: ${resultado.erros} | ` +
            `Em branco: ${resultado.em_branco} | ` +
            `Total de questões: ${resultado.total_questoes}.`,
            "success"
        );

    } catch (erro) {
        exibirMensagem(
            `Erro ao enviar ou corrigir as respostas: ${erro.message}`,
            "danger"
        );
    } finally {
        botaoEnviar.disabled = false;
    }
});


// No modo automático, as questões só aparecem depois da leitura da foto.
function atualizarModo() {
    const automatico = document.getElementById("modoAutomatico").checked;
    areaFoto.hidden = !automatico;
    areaRespostas.hidden = automatico && !leituraPronta;
}

// Consulta a API até o worker terminar de ler a foto.
async function aguardarLeitura(id) {
    for (let tentativa = 0; tentativa < 40; tentativa++) {
        const leitura = await requisitar(`/leituras/${id}`);

        if (leitura.status === "COMPLETED") {
            return leitura;
        }

        if (leitura.status === "FAILED") {
            throw new Error(leitura.erro);
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error("A leitura demorou demais. Verifique se o worker está rodando.");
}

// Marca na tela o que o worker leu e destaca o que precisa de revisão.
function aplicarLeitura(respostas) {
    renderizarQuestoes();
    let paraRevisar = 0;

    questoesAtuais.forEach((questao) => {
        const lida = respostas.find((r) => r.questao === questao.numero_questao);
        let valor = null;

        if (lida?.status === "ANSWERED") {
            valor = lida.alternativa;
        } else if (lida?.status === "BLANK") {
            valor = EM_BRANCO;
        }

        if (valor) {
            document.getElementById(`questao-${questao.id_questao}-${valor}`).checked = true;
        } else {
            document.getElementById(`linha-${questao.id_questao}`).classList.add("bg-warning-subtle");
            paraRevisar++;
        }
    });

    leituraPronta = true;
    atualizarModo();
    exibirMensagem(
        `Leitura concluída. Questões para revisar: ${paraRevisar}. Confira e registre.`,
        "success"
    );
}

// Envia a foto para a API e preenche o formulário com o resultado.
async function lerCartao() {
    const foto = fotoCartao.files[0];

    if (!provaSelect.value || !alunoSelect.value || !foto) {
        exibirMensagem("Selecione a prova, o aluno e a foto do cartão.");
        return;
    }

    if (questoesAtuais.length === 0) {
        exibirMensagem("A prova selecionada não possui questões carregadas.");
        return;
    }

    botaoLer.disabled = true;
    exibirMensagem("Lendo o cartão...", "secondary");

    try {
        const dados = new FormData();
        dados.append("prova_id", provaSelect.value);
        dados.append("aluno_id", alunoSelect.value);
        dados.append("arquivo", foto);

        const { id } = await requisitar("/leituras", {
            method: "POST",
            body: dados
        });

        const leitura = await aguardarLeitura(id);
        aplicarLeitura(leitura.respostas);
    } catch (erro) {
        exibirMensagem(`Não foi possível ler o cartão: ${erro.message}`);
    } finally {
        botaoLer.disabled = false;
    }
}

// Evita registrar a leitura de um aluno no cadastro de outro.
function descartarLeitura() {
    if (leituraPronta) {
        leituraPronta = false;
        renderizarQuestoes();
        atualizarModo();
    }
}

// Atualiza as questões quando a prova muda.
provaSelect.addEventListener("change", carregarQuestoes);

turmaSelect.addEventListener("change", carregarAlunosPorTurma);

alunoSelect.addEventListener("change", descartarLeitura);

document.querySelectorAll('input[name="modo"]').forEach((opcao) => {
    opcao.addEventListener("change", atualizarModo);
});

botaoLer.addEventListener("click", lerCartao);

// O "reset" limpa os campos depois deste evento; por isso o setTimeout.
formRespostas.addEventListener("reset", () => {
    setTimeout(() => {
        listaQuestoes.replaceChildren();
        questoesAtuais = [];
        leituraPronta = false;
        atualizarModo();
    });
});

carregarDadosIniciais();
carregarTurmas();
