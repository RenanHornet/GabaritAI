async function verificarAutenticacao() {

    const token = sessionStorage.getItem("token");

    // Verifica se existe um token armazenado
    if (!token) {
        window.location.replace("../index.html");
        return;
    }

    try {

        // Consulta o backend para validar o token
        const resposta = await fetch("http://127.0.0.1:8000/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            throw new Error("Sessão inválida ou expirada.");
        }

        const professor = await resposta.json();

        // Exibe o nome retornado pelo backend
        document.getElementById("nomeProfessor").textContent = professor.nome;

    } catch (erro) {

        // Remove os dados de uma sessão inválida
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("professor_id");
        sessionStorage.removeItem("nome");

        window.location.replace("../index.html");

    }
}

verificarAutenticacao();

const btnLogout = document.getElementById("btnLogout");

btnLogout.addEventListener("click", () => {

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("professor_id");
    sessionStorage.removeItem("nome");

    window.location.href = "../index.html";

});