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

