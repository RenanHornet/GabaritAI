
const formulario = document.getElementById("cadastroForm");

const mensagem = document.getElementById("mensagemErro");

const botaoCadastrar = document.getElementById("btnCadastrar");

formulario.addEventListener("submit", async (evento) => {

    // Impede o comportamento padrão do formulário
    evento.preventDefault();

    // Captura os valores digitados
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    // Organiza os dados para enviar à API
    const dadosCadastro = {
        nome: nome,
        email: email,
        senha: senha
    };

    try {

        botaoCadastrar.disabled = true;
        botaoCadastrar.textContent = "Cadastrando...";

        const resposta = await fetch("http://127.0.0.1:8000/professores", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dadosCadastro)
        });

        const dadosResposta = await resposta.json();

        // Verifica se a API retornou algum erro
        if (!resposta.ok) {

            let erro = dadosResposta.detail;

            if (Array.isArray(erro)) {
                erro = erro.map(item => item.msg).join(", ");
            }

            throw new Error(erro || "Não foi possível realizar o cadastro.");
        }

        // Exibe mensagem de sucesso
        mensagem.textContent = `${dadosResposta.mensagem}. Você será redirecionado para o login.`;
        mensagem.className = "alert alert-success";

        // Limpa os campos
        formulario.reset();

        // Aguarda 2 segundos e redireciona para o login
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);

    } catch (erro) {

        // Exibe mensagem de erro
        mensagem.textContent = erro.message;
        mensagem.className = "alert alert-danger";

    } finally {

        // Restaura o botão
        botaoCadastrar.disabled = false;
        botaoCadastrar.textContent = "Cadastrar";

    }

});
