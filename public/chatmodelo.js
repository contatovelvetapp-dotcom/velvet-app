// ===============================
// CHAT MODELO — FINAL CORRIGIDO
// ===============================

const socket = io({
  path: "/socket.io",
  transports: ["websocket", "polling"]
});


const modeloId = Number(localStorage.getItem("modeloId"));

const state = {
  clientes: [],                 // [{ id, nome }]
  clienteIdSelecionado: null
};

const clientesMeta = {};

const lista = document.getElementById("listaClientes");
const chatBox = document.getElementById("chatBox");
const clienteNomeEl = document.getElementById("clienteNome");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// SOCKET INIT
document.addEventListener("DOMContentLoaded", async () => {
  socket.emit("auth", { token: localStorage.getItem("token") });

  socket.on("connect", async () => {
    await carregarClientesVip();
  });

  socket.on("chatHistory", renderHistorico);
  socket.on("newMessage", renderMensagem);
});

// CLIENTES VIP
async function carregarClientesVip() {
  const res = await fetch("/api/modelo/vips", {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") }
  });

  const clientes = await res.json();

  state.clientes = clientes.map(c => ({
    id: Number(c.id),
    nome: c.cliente
  }));

  state.clientes.forEach(c => {
    if (!clientesMeta[c.id]) {
      clientesMeta[c.id] = {
        naoLido: false
      };
    }
  });

  renderListaClientes();
}

// ABRIR CHAT
function abrirChat(c) {
  state.clienteIdSelecionado = c.id;
  clienteNomeEl.textContent = c.nome;
  chatBox.innerHTML = "";

  clientesMeta[c.id].naoLido = false;
  renderListaClientes();

  socket.emit("joinRoom", {
    clienteId: c.id,
    modeloId
  });
}

// ENVIAR
sendBtn.onclick = () => {
  if (!state.clienteIdSelecionado) return;

  const text = input.value.trim();
  if (!text) return;

  socket.emit("sendMessage", {
    clienteId: state.clienteIdSelecionado,
    modeloId,
    text
  });

  input.value = "";
};

// ENTER envia
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.onclick();
  }
});

// RENDER
function renderHistorico(msgs) {
  chatBox.innerHTML = "";
  msgs.forEach(renderMensagem);
}

function renderMensagem(msg) {
  if (Number(msg.clienteId) !== state.clienteIdSelecionado) {
    clientesMeta[msg.clienteId].naoLido = true;
    renderListaClientes();
    return;
  }

  const div = document.createElement("div");
  div.className =
    Number(msg.from) === modeloId ? "msg-modelo" : "msg-cliente";

  div.textContent = msg.text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// LISTA
function renderListaClientes() {
  lista.innerHTML = "";

  state.clientes.forEach(c => {
    const li = document.createElement("li");
    li.onclick = () => abrirChat(c);
    li.textContent = clientesMeta[c.id].naoLido
      ? "🔴 Não lido — " + c.nome
      : c.nome;
    lista.appendChild(li);
  });
}
