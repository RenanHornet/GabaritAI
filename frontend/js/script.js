console.log("GabaritAI iniciado com sucesso!");

async function testarAPI() {
    try{ 
        const response = await fetch('http://127.0.0.1:8000/');
        const data = await response.json();

        console.log(response);
        console.log(data);
        
        if (data.status === 'API funcionando') {
            document.getElementById('resultadoAPI').innerText = '🟢 Servidor Online';
        } else {
            document.getElementById('resultadoAPI').innerText = '🔴 Servidor Offline';
        }
    } catch (error) {
        console.error('Erro ao testar a API:', error);
        document.getElementById('resultadoAPI').innerText = '🔴 Servidor Offline';
    }
}

document.getElementById('cadastroProvaForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const alertaElement = document.getElementById('mensagemAlerta');
    const resultadoElement = document.getElementById('resultadoCadastro');

    //Captura os valores digitados
    const nomeInput = document.getElementById('nome').value.trim();
    const descricaoInput = document.getElementById('descricao').value.trim();
    const dataInput = document.getElementById('data').value.trim();
    
    //validação se o nome estiver vazio
    if (nomeInput === "") {
        alertaElement.innerHTML = `
            <div class="alert alert-warning py-2" role="alert">
                ⚠️ Informe o nome da prova.
            </div>
        `
        return; //interrompe a execução! Não envia o fetch para o backend.
    }

    //Validação se a data estiver vazia
    if (dataInput === "") {
        alertaElement.innerHTML = `
            <div class="alert alert-warning py-2" role="alert">
                ⚠️ Selecione a data de aplicação da prova.
            </div>
        `;
        return; // Interrompe a execução!
    }

    //limpa os alertas anteriores caso passe na validação
    alertaElement.innerHTML = '';

    // Se passou na validação, monta o objeto e faz a requisção normalmente
    const novaProva = {
        titulo: document.getElementById('nome').value,
        descricao: document.getElementById('descricao').value,
        data_aplicacao: document.getElementById('data').value,
        professor_id:1
    };
    console.log("Enviando prova:", novaProva);
    try {
        //Envia os dados para o endpoint POST /provas
        const response = await fetch('http://127.0.0.1:8000/provas', {
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
            
            // Limpa os campos do formulário após o sucesso
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

// Função para buscar as provas na API (GET) e montar a tabela
async function carregarProvas() {
    const tabelaBody = document.getElementById('tabelaProvasBody');

    try {
        const response = await fetch('http://127.0.0.1:8000/provas');
        
        if (!response.ok) {
            throw new Error('Falha ao carregar a lista de provas');
        }

        const provas = await response.json();

        // Limpa a tabela antes de preencher novamente
        tabelaBody.innerHTML = '';

        // Se não houver provas registradas
        if (provas.length === 0) {
            tabelaBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">Nenhuma prova cadastrada ainda.</td>
                </tr>
            `;
            return;
        }

        // Percorre cada prova e insere uma linha <tr> na tabela
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
                <td colspan="5" class="text-center text-danger fw-bold">Erro ao carregar dados do servidor.</td>
            </tr>
        `;
    }
}

// Carrega as provas assim que a página é aberta
document.addEventListener('DOMContentLoaded', carregarProvas);