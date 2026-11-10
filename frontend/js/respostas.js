
const API_URL = "http://127.0.0.1:8000";

const provaSelect = document.getElementById("provaSelect");
const turmaSelect = document.getElementById("turmaSelect")
const alunoSelect = document.getElementById("alunoSelect");
const listaQuestoes = document.getElementById("listaQuestoes");
const formRespostas = document.getElementById("formRespostas");
const mensagem = document.getElementById("mensagem");
const areaCamera = document.getElementById("areaCamera");
const videoCamera = document.getElementById("videoCamera");
const modoWebcam = document.getElementById("modoWebcam");
const areaRespostas = document.getElementById("areaRespostas");
const botaoLer = document.getElementById("botaoLer");
const previaCartao = document.getElementById("previaCartao");
const statusPrevia = document.getElementById("statusPrevia");

const EM_BRANCO = "BRANCO";
const ANULADA = "X"; // mais de uma alternativa marcada: conta como erro
const alternativas = ["A", "B", "C", "D", "E", EM_BRANCO, ANULADA];
const ROTULOS = { [EM_BRANCO]: "Em branco", [ANULADA]: "Anulada" };

let questoesAtuais = [];
let leituraPronta = false;
let streamCamera = null;
let ligandoCamera = false;
let previaRodando = false;
let cartaoVisivel = false;
let lendoCartao = false;

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
            label.textContent = ROTULOS[alternativa] ?? alternativa;

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
            `Anuladas: ${resultado.anuladas} | ` +
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


// A câmera só fica ligada enquanto espera a leitura do cartão.
function precisaCamera() {
    return modoWebcam.checked && !leituraPronta;
}

async function ligarCamera() {
    if (streamCamera || ligandoCamera) {
        return;
    }

    ligandoCamera = true;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } }
        });

        // O usuário pode ter trocado de modo enquanto a câmera ligava.
        if (!precisaCamera()) {
            stream.getTracks().forEach((trilha) => trilha.stop());
            return;
        }

        streamCamera = stream;
        videoCamera.srcObject = stream;
        acompanharCartao();
    } catch (erro) {
        exibirMensagem("Não foi possível abrir a webcam. Verifique a permissão do navegador.");
    } finally {
        ligandoCamera = false;
    }
}

function desligarCamera() {
    if (streamCamera) {
        streamCamera.getTracks().forEach((trilha) => trilha.stop());
        streamCamera = null;
        videoCamera.srcObject = null;
    }
}

// No modo webcam, as questões só aparecem depois da leitura do cartão.
function atualizarModo() {
    areaCamera.hidden = !modoWebcam.checked;
    videoCamera.hidden = !precisaCamera();
    areaRespostas.hidden = precisaCamera();
    botaoLer.textContent = leituraPronta ? "Ler novamente" : "Capturar e ler";
    previaCartao.hidden = !precisaCamera() || !cartaoVisivel;
    statusPrevia.hidden = !precisaCamera();
    atualizarBotaoLer();

    if (precisaCamera()) {
        ligarCamera();
    } else {
        desligarCamera();
    }
}

// Na câmera, só deixa capturar quando o cartão está sendo reconhecido.
function atualizarBotaoLer() {
    botaoLer.disabled = lendoCartao || (precisaCamera() && !cartaoVisivel);
}

// Mostra na tela o que o leitor está vendo em cada momento.
function mostrarPrevia(previa) {
    cartaoVisivel = previa.encontrado;
    previaCartao.hidden = !previa.encontrado;

    if (previa.encontrado) {
        previaCartao.src = previa.imagem;
        statusPrevia.className = "fw-semibold mt-2 mb-0 text-success";
        statusPrevia.textContent =
            `Cartão encontrado. Marcadas: ${previa.marcadas} | ` +
            `Em branco: ${previa.em_branco} | Anuladas: ${previa.anuladas} | ` +
            `Dúvida: ${previa.duvidas}`;
    } else {
        statusPrevia.className = "fw-semibold mt-2 mb-0 text-danger";
        statusPrevia.textContent = "Procurando o cartão... mostre os quatro quadrados pretos.";
    }

    atualizarBotaoLer();
}

// Envia um quadro por vez: o próximo só sai depois da resposta do anterior.
async function acompanharCartao() {
    if (previaRodando) {
        return;
    }

    previaRodando = true;

    while (streamCamera && precisaCamera()) {
        if (videoCamera.videoWidth && !lendoCartao) {
            try {
                const dados = new FormData();
                dados.append("arquivo", await capturarFoto(), "quadro.jpg");
                mostrarPrevia(await requisitar("/leituras/previa", { method: "POST", body: dados }));
            } catch (erro) {
                mostrarPrevia({ encontrado: false });
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    previaRodando = false;
    cartaoVisivel = false;
}

// Transforma a imagem atual da câmera em um arquivo JPG.
function capturarFoto() {
    const canvas = document.createElement("canvas");
    canvas.width = videoCamera.videoWidth;
    canvas.height = videoCamera.videoHeight;
    canvas.getContext("2d").drawImage(videoCamera, 0, 0);

    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
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
    let anuladas = 0;

    questoesAtuais.forEach((questao) => {
        const lida = respostas.find((r) => r.questao === questao.numero_questao);
        let valor = null;

        if (lida?.status === "ANSWERED") {
            valor = lida.alternativa;
        } else if (lida?.status === "BLANK") {
            valor = EM_BRANCO;
        } else if (lida?.status === "MULTIPLE") {
            valor = ANULADA;
            anuladas++;
            document.getElementById(`linha-${questao.id_questao}`).classList.add("bg-danger-subtle");
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
        `Leitura concluída. Anuladas: ${anuladas}. Para revisar: ${paraRevisar}. Confira e registre.`,
        "success"
    );
}

// Captura o cartão, envia para a API e preenche o formulário com o resultado.
async function lerCartao() {
    // "Ler novamente": volta para a câmera.
    if (leituraPronta) {
        leituraPronta = false;
        atualizarModo();
        return;
    }

    if (!provaSelect.value || !alunoSelect.value) {
        exibirMensagem("Selecione a prova e o aluno.");
        return;
    }

    if (!streamCamera || !videoCamera.videoWidth) {
        exibirMensagem("A webcam ainda não está pronta.");
        return;
    }

    if (questoesAtuais.length === 0) {
        exibirMensagem("A prova selecionada não possui questões carregadas.");
        return;
    }

    lendoCartao = true;
    atualizarBotaoLer();
    exibirMensagem("Lendo o cartão...", "secondary");

    try {
        const dados = new FormData();
        dados.append("prova_id", provaSelect.value);
        dados.append("aluno_id", alunoSelect.value);
        dados.append("arquivo", await capturarFoto(), "cartao.jpg");

        const { id } = await requisitar("/leituras", {
            method: "POST",
            body: dados
        });

        const leitura = await aguardarLeitura(id);
        aplicarLeitura(leitura.respostas);
    } catch (erro) {
        exibirMensagem(`Não foi possível ler o cartão: ${erro.message}`);
    } finally {
        lendoCartao = false;
        atualizarBotaoLer();
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
