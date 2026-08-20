// cadastro de provas (POST /provas)
document.getElementById('cadastroProvaForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const alertaElement = document.getElementById('mensagemAlerta');
    const resultadoElement = document.getElementById('resultadoCadastro');
    const nomeInput = document.getElementById('nome').value.trim();
    const descricaoInput = document.getElementById('descricao').value.trim();
    const dataInput = document.getElementById('data').value.trim();
    
    if (nomeInput === "") {
        alertaElement.innerHTML = `
            <div class="alert alert-warning py-2" role="alert">
                ⚠️ Informe o nome da prova.
            </div>
        `;
        return;
    }

    if (dataInput === "") {
        alertaElement.innerHTML = `
            <div class="alert alert-warning py-2" role="alert">
                ⚠️ Selecione a data de aplicação da prova.
            </div>
        `;
        return;
    }

    alertaElement.innerHTML = '';

    const novaProva = {
        titulo: nomeInput,
        descricao: descricaoInput,
        data_aplicacao: dataInput,
        professor_id: 1
    };

    console.log("Enviando prova:", novaProva);

    try {
        const response = await fetch(`${API_URL}/provas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaProva)
        });

        if (response.ok) {

            const data = await response.json();

            console.log("Resposta da API:", data);

            resultadoElement.innerText = '🟢 Prova cadastrada com sucesso!';
            resultadoElement.className = 'mt-3 text-success fw-bold';

            document.getElementById('cadastroProvaForm').reset();
        } else {

            resultadoElement.innerText = '🔴 Erro ao cadastrar prova.';
            resultadoElement.className = 'mt-3 text-danger fw-bold';
        }

    } catch (error) {

        console.error('Erro na requisição:', error);

        resultadoElement.innerText = '🔴 Erro de conexão com o servidor.';
        resultadoElement.className = 'mt-3 text-danger fw-bold';
    }
});

//listagem de provas (GET /provas)
async function carregarProvas() {
    const tabelaBody = document.getElementById('tabelaProvasBody');

    try {
        const response = await fetch(`${API_URL}/provas`);

        if (!response.ok) {
            throw new Error('Falha ao carregar a lista de provas');
        }

        const provas = await response.json();

        tabelaBody.innerHTML = '';

        if (provas.length === 0) {
            tabelaBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        Nenhuma prova cadastrada ainda.
                    </td>
                </tr>
            `;
            return;
        }

        provas.forEach(prova => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${prova.id_prova}</td>
                <td>${prova.titulo}</td>
                <td>${prova.descricao || '-'}</td>
                <td>${prova.data_aplicacao || '-'}</td>
                <td>${prova.professor_id}</td>
            `;

            tabelaBody.appendChild(linha);
        });

    } catch (error) {
        console.error('Erro ao buscar provas:', error);
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger fw-bold">
                    Erro ao carregar dados do servidor.
                </td>
            </tr>
        `;
    }
}

document.addEventListener('DOMContentLoaded', carregarProvas);