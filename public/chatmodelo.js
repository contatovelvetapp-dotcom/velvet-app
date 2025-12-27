// ===============================
// CHAT MODELO — FINAL CORRIGIDO
// ===============================

const socket = window.socket;

// 🔐 IDs reais (vindos do token / backend)
const modeloId = localStorage.getItem("modeloId"); // SALVE ISSO NO LOGIN
const modeloNome = localStorage.getItem("modeloPerfil");

const state = {
  clientes: [],                 // [{ id, nome }]
  clienteIdSelecionado: null,
  clienteNomeSelecionado: null
};

const clientesMeta = {};

const lista = document.getElementById("listaClientes");
const chatBox = document.getElementById("chatBox");
const clienteNomeEl = document.getElementById("clienteNome");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// ===============================
// SOCKET INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  socket.emit("auth", { token: localStorage.getItem("token") });

  socket.on("connect", async () => {
    socket.emit("loginModelo", modeloId);
    await carregarClientesVip();
  });

  socket.on("chatHistory", renderHistorico);
  socket.on("newMessage", renderMensagem);
});

// ===============================
// CARREGAR CLIENTES VIP
// ===============================
async function carregarClientesVip() {
  const res = await fetch("/api/modelo/vips", {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") }
  });

  const clientes = await res.json(); // [{ id, cliente }]
  state.clientes = clientes.map(c => ({
    id: c.id,
    nome: c.cliente
  }));

  state.clientes.forEach(c => {
    if (!clientesMeta[c.id]) {
      clientesMeta[c.id] = {
        novo: true,
        naoLido: false,
        ultimaMsgModeloEm: null
      };
    }
  });

  renderListaClientes();
}

// ===============================
// ABRIR CHAT
// ===============================
function abrirChat(c) {
  state.clienteIdSelecionado = c.id;
  state.clienteNomeSelecionado = c.nome;

  clienteNomeEl.textContent = c.nome;
  chatBox.innerHTML = "";

  clientesMeta[c.id].novo = false;
  clientesMeta[c.id].naoLido = false;

  renderListaClientes();

  socket.emit("joinRoom", {
    clienteId: c.id,
    modeloId
  });
}

// ===============================
// ENVIAR MENSAGEM
// ===============================
sendBtn.onclick = () => {
  if (!state.clienteIdSelecionado) return;

  const text = input.value.trim();
  if (!text) return;

  socket.emit("sendMessage", {
    clienteId: state.clienteIdSelecionado,
    modeloId,
    text
  });

  clientesMeta[state.clienteIdSelecionado].ultimaMsgModeloEm = Date.now();
  renderListaClientes();

  input.value = "";
};

// ⌨️ ENTER envia
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.onclick();
  }
});

// ===============================
// RENDER HISTÓRICO
// ===============================
function renderHistorico(msgs) {
  chatBox.innerHTML = "";

  if (msgs.length > 0 && state.clienteIdSelecionado) {
    clientesMeta[state.clienteIdSelecionado].novo = false;
    renderListaClientes();
  }

  msgs.forEach(renderMensagem);
}

// ===============================
// RENDER MENSAGEM
// ===============================
function renderMensagem(msg) {
  if (
    msg.from !== modeloId &&
    msg.clienteId !== state.clienteIdSelecionado
  ) {
    clientesMeta[msg.clienteId].naoLido = true;
    renderListaClientes();
  }

  if (msg.clienteId !== state.clienteIdSelecionado) return;

  const div = document.createElement("div");
  div.className =
    msg.from === modeloId ? "msg-modelo" : "msg-cliente";

  div.textContent = msg.text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ===============================
// LISTA DE CLIENTES (ORDENADA)
// ===============================
function renderListaClientes() {
  lista.innerHTML = "";

  const ordenados = [...state.clientes].sort((a, b) => {
    const A = clientesMeta[a.id];
    const B = clientesMeta[b.id];

    if (A.novo !== B.novo) return A.novo ? -1 : 1;
    if (A.naoLido !== B.naoLido) return A.naoLido ? -1 : 1;

    return (B.ultimaMsgModeloEm || 0) - (A.ultimaMsgModeloEm || 0);
  });

  ordenados.forEach(c => {
    const meta = clientesMeta[c.id];

    const li = document.createElement("li");
    li.onclick = () => abrirChat(c);

    let label = c.nome;
    if (meta.novo) label = "🆕 Novo — " + label;
    else if (meta.naoLido) label = "🔴 Não lido — " + label;

    const hora = meta.ultimaMsgModeloEm
      ? new Date(meta.ultimaMsgModeloEm).toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";

    li.innerHTML = `
      <span>${label}</span>
      <small style="float:right; opacity:0.6">${hora}</small>
    `;

    lista.appendChild(li);
  });
}
