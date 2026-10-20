
const API_URL = 'http://127.0.0.1:8000';

// Elementos da página
const provaSelect = document.getElementById('provaSelect');
const turmaSelect = document.getElementById('turmaSelect');
const btnConsultarRanking = document.getElementById('btnConsultarRanking');
const btnLimparRanking = document.getElementById('btnLimparRanking');
const mensagemAlerta = document.getElementById('mensagemAlerta');
const tabelaRankingBody = document.getElementById('tabelaRankingBody');

// Carrega as provas disponíveis na API
async function listarProvas() {
    try {
        const response = await fetch(`${API_URL}/provas`);

        if (!response.ok) {
            throw new Error('Erro ao carregar as provas.');
        }

        const provas = await response.json();

        provas.forEach(prova => {
            const option = document.createElement('option');

            option.value = prova.id_prova;
            option.textContent = prova.titulo;

            provaSelect.appendChild(option);
        });
    } catch (error) {
        mostrarMensagem('Não foi possível carregar as provas.', 'danger');
        console.error(error);
    }
}

// Carrega as turmas disponíveis para a prova selecionada
async function listarTurmas(provaId) {
    turmaSelect.innerHTML = '<option value="">Carregando turmas...</option>';
    turmaSelect.disabled = true;
    btnConsultarRanking.disabled = true;

    try {
        const response = await fetch(`${API_URL}/provas/${provaId}/ranking`);

        if (!response.ok) {
            throw new Error('Erro ao carregar as turmas.');
        }

        const ranking = await response.json();

        turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';

        ranking.turmas.forEach(grupo => {
            const option = document.createElement('option');

            option.value = grupo.turma;
            option.textContent = `Turma ${grupo.turma}`;

            turmaSelect.appendChild(option);
        });

        turmaSelect.disabled = ranking.turmas.length === 0;

        if (ranking.turmas.length === 0) {
            mostrarMensagem(
                'Ainda não há resultados disponíveis para esta prova.',
                'info'
            );
        } else {
            limparMensagem();
        }
    } catch (error) {
        turmaSelect.innerHTML = '<option value="">Erro ao carregar turmas</option>';
        mostrarMensagem('Não foi possível carregar as turmas.', 'danger');
        console.error(error);
    }
}

// Consulta o ranking da prova e da turma selecionadas
async function consultarRanking() {
    const provaId = provaSelect.value;
    const turma = turmaSelect.value;

    if (!provaId || !turma) {
        mostrarMensagem('Selecione uma prova e uma turma.', 'warning');
        return;
    }

    tabelaRankingBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">Carregando ranking...</td>
        </tr>
    `;

    btnConsultarRanking.disabled = true;

    try {
        const response = await fetch(
            `${API_URL}/provas/${provaId}/ranking?turma=${turma}`
        );

        if (!response.ok) {
            throw new Error('Erro ao consultar o ranking.');
        }

        const ranking = await response.json();

        tabelaRankingBody.innerHTML = '';

        const grupoTurma = ranking.turmas.find(
            grupo => String(grupo.turma) === String(turma)
        );

        if (!grupoTurma || grupoTurma.alunos.length === 0) {
            mostrarMensagem(
                'Ainda não há resultados disponíveis para esta turma.',
                'info'
            );

            tabelaRankingBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        Nenhum aluno classificado.
                    </td>
                </tr>
            `;
            return;
        }

        grupoTurma.alunos.forEach(aluno => {
            const linha = document.createElement('tr');

            linha.innerHTML = `
                <td>${aluno.posicao}º</td>
                <td></td>
                <td>${aluno.turma}</td>
                <td>${aluno.acertos}</td>
                <td>${aluno.erros}</td>
                <td>${aluno.total_questoes}</td>
            `;

            // Usa textContent para exibir o nome com segurança.
            linha.children[1].textContent = aluno.nome_aluno;

            tabelaRankingBody.appendChild(linha);
        });

        const temEmpate = grupoTurma.alunos.some((aluno, indice, alunos) =>
            alunos.some((outro, outroIndice) =>
                outroIndice !== indice && outro.posicao === aluno.posicao
            )
        );

        if (temEmpate) {
            mostrarMensagem(
                'Há alunos empatados. Participantes com a mesma posição possuem a mesma quantidade de acertos.',
                'info'
            );
        } else {
            limparMensagem();
        }
    } catch (error) {
        tabelaRankingBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    Não foi possível carregar a classificação.
                </td>
            </tr>
        `;

        mostrarMensagem('Erro ao consultar o ranking.', 'danger');
        console.error(error);
    } finally {
        btnConsultarRanking.disabled = false;
    }
}

// Exibe mensagens usando alertas do Bootstrap
function mostrarMensagem(texto, tipo) {
    mensagemAlerta.innerHTML = '';

    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = texto;

    mensagemAlerta.appendChild(alerta);
}

// Limpa a mensagem exibida
function limparMensagem() {
    mensagemAlerta.innerHTML = '';
}

// Limpa os filtros e a tabela
function limparRanking() {
    provaSelect.value = '';
    turmaSelect.innerHTML = '<option value="">Selecione uma prova primeiro</option>';
    turmaSelect.disabled = true;
    btnConsultarRanking.disabled = true;

    tabelaRankingBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                Selecione uma prova e uma turma para consultar o ranking.
            </td>
        </tr>
    `;

    limparMensagem();
}

// Quando uma prova é selecionada, carrega as turmas com resultados
provaSelect.addEventListener('change', () => {
    const provaId = provaSelect.value;

    tabelaRankingBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                Selecione uma turma para consultar o ranking.
            </td>
        </tr>
    `;

    limparMensagem();

    if (provaId) {
        listarTurmas(provaId);
    } else {
        turmaSelect.innerHTML = '<option value="">Selecione uma prova primeiro</option>';
        turmaSelect.disabled = true;
        btnConsultarRanking.disabled = true;
    }
});

// Habilita a consulta quando uma turma é selecionada
turmaSelect.addEventListener('change', () => {
    btnConsultarRanking.disabled = !turmaSelect.value;
    limparMensagem();
});

// Eventos dos botões
btnConsultarRanking.addEventListener('click', consultarRanking);
btnLimparRanking.addEventListener('click', limparRanking);

// Inicializa a página
listarProvas();
