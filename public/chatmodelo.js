// ===============================
// CHAT MODELO — VERSÃO CORRIGIDA
// ===============================

const socket = io({
  transports: ["websocket", "polling"]
});

let modelo = null;

const state = {
  clientes: [],              // [{ id, nome }]
  clienteAtual: null         // { id, nome }
};

const listaClientes = document.getElementById("listaClientes");
const chatBox = document.getElementById("chatBox");
const clienteNomeEl = document.getElementById("clienteNome");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// ===============================
// SOCKET
// ===============================
socket.on("connect", async () => {
  console.log("🟣 Modelo conectado:", socket.id);

  socket.emit("auth", {
    token: localStorage.getItem("token")
  });

  await carregarModelo();

  // 🔐 IDENTIFICA O MODELO NO SERVER (CRÍTICO)
  socket.emit("loginModelo", modelo.id);

  restaurarChatAtivo();
});

// listeners fora do connect (evita duplicar)
socket.on("chatHistory", renderHistorico);
socket.on("newMessage", renderMensagem);

// ===============================
// CARREGAR MODELO
// ===============================
async function carregarModelo() {
  const res = await fetch("/api/modelo/me", {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token")
    }
  });

  modelo = await res.json();
}

// ===============================
// CARREGAR CLIENTES (VIP / CHAT)
// ===============================
async function carregarClientes() {
  const res = await fetch("/api/modelo/clientes", {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token")
    }
  });

  state.clientes = await res.json();
  renderListaClientes();
}

function renderListaClientes() {
  listaClientes.innerHTML = "";

  state.clientes.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c.nome;
    li.onclick = () => abrirChat(c);
    listaClientes.appendChild(li);
  });
}

// ===============================
// ABRIR CHAT
// ===============================
function abrirChat(cliente) {
  state.clienteAtual = cliente;
  clienteNomeEl.textContent = cliente.nome;
  chatBox.innerHTML = "";

  // 💾 salva chat ativo (F5-safe)
  localStorage.setItem("chatAtivoModelo", JSON.stringify({
    clienteId: cliente.id,
    clienteNome: cliente.nome
  }));

  socket.emit("joinRoom", {
    clienteId: cliente.id,
    modeloId: modelo.id
  });
}

// ===============================
// RESTAURAR CHAT APÓS F5
// ===============================
function restaurarChatAtivo() {
  const salvo = localStorage.getItem("chatAtivoModelo");
  if (!salvo) return;

  const { clienteId, clienteNome } = JSON.parse(salvo);

  state.clienteAtual = {
    id: clienteId,
    nome: clienteNome
  };

  clienteNomeEl.textContent = clienteNome;

  socket.emit("joinRoom", {
    clienteId,
    modeloId: modelo.id
  });
}

// ===============================
// ENVIAR MENSAGEM
// ===============================
sendBtn.addEventListener("click", enviarMensagem);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") enviarMensagem();
});

function enviarMensagem() {
  if (!state.clienteAtual) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = "";

  // render otimista
  renderMensagem({
    from: modelo.id,
    text
  });

  socket.emit("sendMessage", {
    clienteId: state.clienteAtual.id,
    modeloId: modelo.id,
    text
  });
}

// ===============================
// RENDER
// ===============================
function renderHistorico(msgs) {
  chatBox.innerHTML = "";
  msgs.forEach(renderMensagem);
}

function renderMensagem(msg) {
  if (!state.clienteAtual) return;

  const div = document.createElement("div");
  div.className =
    Number(msg.from) === modelo.id ? "msg-modelo" : "msg-cliente";

  div.textContent = msg.text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", carregarClientes);
