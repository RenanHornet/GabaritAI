
const API_URL = 'http://127.0.0.1:8000';
const PROFESSOR_ID = 1;

// Guarda a prova selecionada para cadastrar suas questões.
let provaSelecionada = null;

// Elementos da página
const formularioProva = document.getElementById('cadastroProvaForm');
const mensagemAlerta = document.getElementById('mensagemAlerta');
const tabelaProvasBody = document.getElementById('tabelaProvasBody');
const painelQuestoes = document.getElementById('painelQuestoes');
const tituloProvaSelecionada = document.getElementById('tituloProvaSelecionada');
const formularioQuestao = document.getElementById('cadastroQuestaoForm');
const alertaQuestao = document.getElementById('alertaQuestao');
const tabelaQuestoesBody = document.getElementById('tabelaQuestoesBody');

// Exibe mensagens usando os alertas do Bootstrap.
function exibirAlerta(elemento, mensagem, tipo = 'danger') {
    elemento.innerHTML = `
        <div class="alert alert-${tipo} py-2">
            ${mensagem}
        </div>
    `;
}

// Converte erros da API em mensagens mais úteis.
async function obterMensagemErro(response) {
    try {
        const erro = await response.json();

        if (Array.isArray(erro.detail)) {
            return erro.detail.map(item => item.msg).join('; ');
        }

        return erro.detail || 'Não foi possível concluir a operação.';
    } catch {
        return 'Não foi possível concluir a operação.';
    }
}

// Carrega e exibe as provas cadastradas.
async function carregarProvas() {
    try {
        const response = await fetch(`${API_URL}/provas`);

        if (!response.ok) {
            throw new Error(await obterMensagemErro(response));
        }

        const provas = await response.json();

        tabelaProvasBody.innerHTML = '';

        if (provas.length === 0) {
            tabelaProvasBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        Nenhuma prova cadastrada.
                    </td>
                </tr>
            `;
            return;
        }

        provas.forEach(prova => {
            const linha = document.createElement('tr');

            const valores = [
                prova.id_prova,
                prova.titulo,
                prova.descricao || '-',
                prova.data_aplicacao || '-',
                prova.professor_id
            ];

            valores.forEach(valor => {
                const celula = document.createElement('td');
                celula.textContent = valor;
                linha.appendChild(celula);
            });

            const celulaAcoes = document.createElement('td');
            celulaAcoes.className = 'text-center';

            const botaoQuestoes = document.createElement('button');
            botaoQuestoes.type = 'button';
            botaoQuestoes.className = 'btn btn-sm btn-primary me-1';
            botaoQuestoes.textContent = 'Questões';
            botaoQuestoes.addEventListener('click', () => {
                abrirPainelQuestoes(prova);
            });

            const botaoExcluir = document.createElement('button');
            botaoExcluir.type = 'button';
            botaoExcluir.className = 'btn btn-sm btn-danger';
            botaoExcluir.textContent = 'Excluir';
            botaoExcluir.addEventListener('click', () => {
                excluirProva(prova.id_prova);
            });

            celulaAcoes.append(botaoQuestoes, botaoExcluir);
            linha.appendChild(celulaAcoes);
            tabelaProvasBody.appendChild(linha);
        });
    } catch (error) {
        console.error('Erro ao carregar provas:', error);
        exibirAlerta(
            mensagemAlerta,
            `Erro ao carregar provas: ${error.message}`
        );
    }
}

// Cadastra uma nova prova.
formularioProva.addEventListener('submit', async (event) => {
    event.preventDefault();

    const titulo = document.getElementById('nome').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const data = document.getElementById('data').value;

    if (!titulo) {
        exibirAlerta(
            mensagemAlerta,
            'Informe o nome da prova.',
            'warning'
        );
        return;
    }

    const novaProva = {
        titulo,
        descricao: descricao || null,
        data_aplicacao: data || null,
        professor_id: PROFESSOR_ID
    };

    try {
        const response = await fetch(`${API_URL}/provas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaProva)
        });

        if (!response.ok) {
            throw new Error(await obterMensagemErro(response));
        }

        const provaCriada = await response.json();

        exibirAlerta(
            mensagemAlerta,
            `Prova "${provaCriada.titulo}" cadastrada com sucesso!`,
            'success'
        );

        formularioProva.reset();
        await carregarProvas();
    } catch (error) {
        console.error('Erro ao cadastrar prova:', error);
        exibirAlerta(
            mensagemAlerta,
            `Erro ao cadastrar prova: ${error.message}`
        );
    }
});

// Abre o painel de questões da prova escolhida.
async function abrirPainelQuestoes(prova) {
    provaSelecionada = prova;

    tituloProvaSelecionada.textContent =
        `Questões da Prova: ${prova.titulo} (ID ${prova.id_prova})`;

    painelQuestoes.classList.remove('d-none');
    alertaQuestao.innerHTML = '';

    await carregarQuestoes();
    painelQuestoes.scrollIntoView({ behavior: 'smooth' });
}

// Disponibiliza a função usada pelo botão "Fechar" do HTML.
function fecharPainelQuestoes() {
    painelQuestoes.classList.add('d-none');
    provaSelecionada = null;
}

// Carrega somente as questões da prova selecionada.
async function carregarQuestoes() {
    if (!provaSelecionada) return;

    try {
        const response = await fetch(
            `${API_URL}/provas/${provaSelecionada.id_prova}/questoes`
        );

        if (!response.ok) {
            throw new Error(await obterMensagemErro(response));
        }

        const questoes = await response.json();

        tabelaQuestoesBody.innerHTML = '';

        questoes.sort((a, b) => a.numero_questao - b.numero_questao);

        if (questoes.length === 0) {
            tabelaQuestoesBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        Nenhuma questão cadastrada para esta prova.
                    </td>
                </tr>
            `;
            return;
        }

        questoes.forEach(questao => {
            const linha = document.createElement('tr');

            const numero = document.createElement('td');
            numero.textContent = questao.numero_questao;

            const alternativa = document.createElement('td');
            alternativa.textContent = questao.alternativa_correta;

            const acao = document.createElement('td');
            const botaoExcluir = document.createElement('button');

            botaoExcluir.type = 'button';
            botaoExcluir.className = 'btn btn-sm btn-danger';
            botaoExcluir.textContent = 'Excluir';
            botaoExcluir.addEventListener('click', () => {
                excluirQuestao(questao.id_questao);
            });

            acao.appendChild(botaoExcluir);
            linha.append(numero, alternativa, acao);
            tabelaQuestoesBody.appendChild(linha);
        });
    } catch (error) {
        console.error('Erro ao carregar questões:', error);
        exibirAlerta(
            alertaQuestao,
            `Erro ao carregar questões: ${error.message}`
        );
    }
}

// Cadastra uma questão na prova selecionada.
formularioQuestao.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!provaSelecionada) {
        exibirAlerta(
            alertaQuestao,
            'Selecione uma prova antes de cadastrar questões.',
            'warning'
        );
        return;
    }

    const numeroQuestao = Number(
        document.getElementById('numeroQuestao').value
    );

    const alternativa = document.getElementById('alternativaCorreta').value;

    if (!Number.isInteger(numeroQuestao) || numeroQuestao <= 0) {
        exibirAlerta(
            alertaQuestao,
            'O número da questão deve ser um inteiro maior que zero.',
            'warning'
        );
        return;
    }

    if (!['A', 'B', 'C', 'D', 'E'].includes(alternativa)) {
        exibirAlerta(
            alertaQuestao,
            'Selecione uma alternativa válida de A a E.',
            'warning'
        );
        return;
    }

    const novaQuestao = {
        numero_questao: numeroQuestao,
        alternativa_correta: alternativa,
        prova_id: provaSelecionada.id_prova,
        professor_id: PROFESSOR_ID
    };

    try {
        const response = await fetch(`${API_URL}/questoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaQuestao)
        });

        if (!response.ok) {
            throw new Error(await obterMensagemErro(response));
        }

        exibirAlerta(
            alertaQuestao,
            `Questão ${numeroQuestao} cadastrada com sucesso!`,
            'success'
        );

        formularioQuestao.reset();
        await carregarQuestoes();
    } catch (error) {
        console.error('Erro ao cadastrar questão:', error);
        exibirAlerta(
            alertaQuestao,
            `Erro ao cadastrar questão: ${error.message}`
        );
    }
});

// Exclui uma prova após confirmação.
async function excluirProva(idProva) {
    if (!confirm(`Deseja excluir a prova ${idProva}?`)) return;

    try {
        const response = await fetch(`${API_URL}/provas/${idProva}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(await obterMensagemErro(response));
        }

        if (provaSelecionada?.id_prova === idProva) {
            fecharPainelQuestoes();
        }

        exibirAlerta(
            mensagemAlerta,
            'Prova excluída com sucesso.',
            'success'
        );

        await carregarProvas();
    } catch (error) {
        console.error('Erro ao excluir prova:', error);
        exibirAlerta(
            mensagemAlerta,
            `Erro ao excluir prova: ${error.message}`
        );
    }
}

// Exclui uma questão após confirmação.
async function excluirQuestao(idQuestao) {
    if (!confirm(`Deseja excluir a questão ${idQuestao}?`)) return;

    try {
        const response = await fetch(`${API_URL}/questoes/${idQuestao}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(await obterMensagemErro(response));
        }

        exibirAlerta(
            alertaQuestao,
            'Questão excluída com sucesso.',
            'success'
        );

        await carregarQuestoes();
    } catch (error) {
        console.error('Erro ao excluir questão:', error);
        exibirAlerta(
            alertaQuestao,
            `Erro ao excluir questão: ${error.message}`
        );
    }
}

// Inicializa a tabela ao abrir a página.
carregarProvas();
