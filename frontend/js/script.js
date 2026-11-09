
const API_URL = "http://127.0.0.1:8000";

// Captura os elementos do formulário
const loginForm = document.getElementById("loginForm");
const mensagemErro = document.getElementById("mensagemErro");
const btnEntrar = document.getElementById("btnEntrar");

// Escuta o envio do formulário
loginForm.addEventListener("submit", async (event) => {

    // Impede o comportamento padrão do formulário
    event.preventDefault();

    // Captura os valores digitados
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    // Esconde mensagens de erro anteriores
    mensagemErro.classList.add("d-none");

    // Indica que o login está sendo processado
    btnEntrar.disabled = true;
    btnEntrar.textContent = "Entrando...";

    try {

        // Envia as credenciais para o backend
        const resposta = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                senha: senha
            })
        });

        // Converte a resposta para JSON
        const dados = await resposta.json();

        // Verifica se houve erro na autenticação
        if (!resposta.ok) {
            throw new Error(dados.detail || "Erro ao realizar login.");
        }

        //Armazena os dados da autenticação
        sessionStorage.setItem("token", dados.access_token);
        sessionStorage.setItem("professor_id", dados.professor_id);
        sessionStorage.setItem("nome", dados.nome);

        // Redireciona para a página de dashboard
        window.location.href = "pages/dashboard.html";

    } catch (erro) {

        // Exibe a mensagem de erro na tela
        mensagemErro.textContent = erro.message;
        mensagemErro.classList.remove("d-none");

    } finally {

        // Reabilita o botão
        btnEntrar.disabled = false;
        btnEntrar.textContent = "Entrar";

    }

});
