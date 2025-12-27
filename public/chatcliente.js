// ===============================
// ESTADO GLOBAL
// ===============================
let cliente = null;
const socket = window.socket; // 🔑 USA O SOCKET DO header.js

const state = {
  modelos: [],
  unread: {},
  modeloAtual: null
};

// ===============================
// DOM
// ===============================
const lista = document.getElementById("listaModelos");
const chatBox = document.getElementById("chatBox");
const modeloNome = document.getElementById("modeloNome");
const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

// ===============================
// GUARD
// ===============================
if (!socket) {
  console.error("Socket não encontrado (header.js)");
  throw new Error("Socket ausente");
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  socket.emit("auth", { token: localStorage.getItem("token") });

  socket.on("connect", async () => {
    await carregarCliente();
    await carregarModelos();
    pedirUnread();

    const modeloSalvo = localStorage.getItem("chatModelo");
    if (modeloSalvo) abrirChat(modeloSalvo);
  });

  socket.on("chatHistory", onChatHistory);
  socket.on("newMessage", onNewMessage);
  socket.on("unreadUpdate", onUnreadUpdate);
});

// ===============================
// CLIENTE
// ===============================
async function carregarCliente() {
  const res = await fetch("/api/cliente/me", {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") }
  });

  const data = await res.json();
  cliente = data.nome;
}

// ===============================
// MODELOS (VIP)
// ===============================
async function carregarModelos() {
  const res = await fetch("/api/cliente/modelos", {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") }
  });

  const modelos = await res.json();

  if (!Array.isArray(modelos)) {
    console.error("Modelos inválidos:", modelos);
    return;
  }

  state.modelos = modelos;
  renderLista();
}

function renderLista() {
  lista.innerHTML = "";

  state.modelos.forEach(nome => {
    const li = document.createElement("li");
    li.textContent = state.unread[nome] ? `${nome} (Não lida)` : nome;

    li.onclick = () => {
      abrirChat(nome);
      limparUnread(nome);
    };

    lista.appendChild(li);
  });
}

// ===============================
// CHAT
// ===============================
function abrirChat(nomeModelo) {
  state.modeloAtual = nomeModelo;
  modeloNome.textContent = nomeModelo;
  chatBox.innerHTML = "";

  localStorage.setItem("chatModelo", nomeModelo);
  socket.emit("joinRoom", { cliente, modelo: nomeModelo });
}

function limparUnread(modelo) {
  socket.emit("markAsRead", { cliente, modelo });
  delete state.unread[modelo];
  renderLista();
}

// ===============================
// MENSAGENS
// ===============================
sendBtn.onclick = () => {
  if (!state.modeloAtual) return;

  const text = input.value.trim();
  if (!text) return;

  socket.emit("sendMessage", {
    cliente,
    modelo: state.modeloAtual,
    from: cliente,
    text
  });

  input.value = "";
};

function onChatHistory(messages) {
  chatBox.innerHTML = "";
  messages.forEach(renderMessage);
}

function onNewMessage(msg) {
  renderMessage(msg);
}

function onUnreadUpdate(map) {
  state.unread = map || {};
  renderLista();
}

function pedirUnread() {
  socket.emit("getUnread", cliente);
}

// ===============================
// RENDER
// ===============================
function renderMessage(msg) {
  const div = document.createElement("div");
  div.className = msg.from === cliente ? "msg-cliente" : "msg-modelo";
  div.textContent = msg.text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
