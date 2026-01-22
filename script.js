const nomes = { "CLP": "Peso Chileno", "USD": "Dólar", "EUR": "Euro", "ARS": "Peso Argentino", "GBP": "Libra", "UYU": "Peso Uruguaio" };
let taxas = JSON.parse(localStorage.getItem('taxas')) || { 
    "CLP": 0.0058, "USD": 5.80, "EUR": 6.20, "ARS": 0.005, "GBP": 7.20, "UYU": 0.14 
};

function init() {
    const select = document.getElementById('moedaOrigem');
    Object.keys(taxas).sort().forEach(m => {
        let opt = document.createElement('option');
        opt.value = m;
        opt.innerText = `${nomes[m] || m} (${m})`;
        select.appendChild(opt);
    });

    const ultima = localStorage.getItem('ultimaMoeda');
    if (ultima) select.value = ultima;
    
    renderLista();
    converter();
    atualizarCotacoes();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log("Offline Ready"))
                .catch((err) => console.log("SW error", err));
        });
    }
}

function showPage(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    el.classList.add('active');
}

function converter() {
    const moeda = document.getElementById('moedaOrigem').value;
    const valorRaw = document.getElementById('valorInput').value;
    // parseFloat lida melhor com a conversão de strings de inputs
    const valor = parseFloat(valorRaw) || 0;
    const total = valor * taxas[moeda];
    document.getElementById('resultado').innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderLista() {
    const container = document.getElementById('listaContainer');
    container.innerHTML = '';
    Object.keys(taxas).sort().forEach(m => {
        container.innerHTML += `
            <div class="moeda-item">
                <div class="moeda-info">
                    <span class="moeda-name">${nomes[m] || m}</span>
                    <span style="font-size: 0.75rem; color: #888;">${m} / BRL</span>
                </div>
                <span class="moeda-val">R$ ${taxas[m].toFixed(4)}</span>
            </div>`;
    });
}

function mostrarToast(mensagem, cor = "#333") {
    const toast = document.getElementById("toast");
    if (!toast) return; // Segurança caso a div suma

    toast.classList.remove("show"); // reset
    void toast.offsetWidth;         // força reflow

    toast.innerText = mensagem;
    toast.style.backgroundColor = cor;
    
    // Adiciona a classe para mostrar
    toast.classList.add("show");
    
    // Remove após 3 segundos
    setTimeout(() => { 
        toast.classList.remove("show"); 
    }, 3000);
}

async function atualizarCotacoes(btn = null) {
    const statusTexts = document.querySelectorAll('.status-text');
    const originalText = btn ? btn.innerText : "";
    
    if (btn) {
        btn.classList.add('loading');
        btn.innerText = "Buscando...";
        btn.disabled = true;
    }
    
    try {
        const moedas = Object.keys(taxas).map(m => `${m}-BRL`).join(',');
        // Timeout de 8 segundos para não ficar "pendurado" em redes ruins
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`https://economia.awesomeapi.com.br/last/${moedas}`, { signal: controller.signal });
        clearTimeout(id);

        if (!res.ok) throw new Error("Erro na resposta da API");
        const data = await res.json();
        
        Object.keys(taxas).forEach(m => {
            if (data[m + 'BRL']) {
                taxas[m] = parseFloat(data[m + 'BRL'].bid);
            }
        });

        localStorage.setItem('taxas', JSON.stringify(taxas));

        const horaAtual = new Date().toLocaleTimeString('pt-BR');
        statusTexts.forEach(st => { 
            st.innerText = "Sincronizado: " + horaAtual;
            st.style.color = "#4caf50";
        });

        renderLista();
        if(typeof converter === 'function') converter();

        mostrarToast("✅ Cotações atualizadas!", "#4caf50");

    } catch (e) {
        statusTexts.forEach(st => {
            st.innerText = "Offline: Usando dados salvos.";
            st.style.color = "#f44336";
        });

        mostrarToast("❌ Falha na conexão", "#f44336");  

    } finally {
        if (btn) {
            btn.classList.remove('loading');
            btn.innerText = btn.getAttribute('data-type') === 'calc' ? "Atualizar Cotações" : "Atualizar Lista";
            btn.disabled = false;
        }
    }
}

function salvarPreferencias() {
    localStorage.setItem('ultimaMoeda', document.getElementById('moedaOrigem').value);
}

init();