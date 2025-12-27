// ===========================
// VARIÁVEIS GLOBAIS
// ===========================
let socket = null;
let cliente = null;

const state = {
  modeloAtual: null,
  unread: {},
  modelos: []
};

// ===========================
// DOM
// ===========================
const chatBox = document.getElementById("chatBox");
const lista = document.getElementById("listaModelos");
const modeloNome = document.getElementById("modeloNome");
const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

// ===========================
// SOCKET (vem do header.js)
// ===========================
function obterSocket() {
  return window.socket || null;
}

// ===========================
// IDENTIDADE DO CLIENTE
// ===========================
async function carregarCliente() {
  const res = await fetch("/api/cliente/me", {
    headers: { Authorization: "Bearer " + window.token }
  });

  const data = await res.json();
  cliente = data.nome;
}

// ===========================
// INIT
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  socket = obterSocket();

  if (!socket) {
    console.error("❌ Socket não inicializado (header.js)");
    return;
  }

  socket.emit("auth", { token: window.token });

  socket.on("connect", async () => {
    await carregarCliente();

    socket.emit("loginCliente", cliente);
    carregarModelos();
    pedirUnread();

    const modeloSalvo = localStorage.getItem("chatModelo");
    if (modeloSalvo) abrirChat(modeloSalvo);
  });

  socket.on("chatHistory", onChatHistory);
  socket.on("newMessage", onNewMessage);
  socket.on("unreadUpdate", onUnreadUpdate);
  socket.on("conteudoDesbloqueado", onConteudoDesbloqueado);
});

// ===========================
// LISTA DE MODELOS
// ===========================
async function carregarModelos() {
  const res = await fetch("/api/cliente/modelos", {
    headers: { Authorization: "Bearer " + window.token }
  });

  if (!res.ok) return;

  const modelosAPI = await res.json();
  const modeloDoPerfil = localStorage.getItem("modeloAtual");

  state.modelos = Array.isArray(modelosAPI) ? modelosAPI : [];

  if (modeloDoPerfil && !state.modelos.includes(modeloDoPerfil)) {
    state.modelos.unshift(modeloDoPerfil);
  }

  renderLista();

  if (modeloDoPerfil && !state.modeloAtual) {
    abrirChat(modeloDoPerfil);
  }
}

function renderLista() {
  lista.innerHTML = "";

  const ordenados = [...state.modelos].sort((a, b) => {
    const aUnread = state.unread[a] ? 1 : 0;
    const bUnread = state.unread[b] ? 1 : 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    return a.localeCompare(b);
  });

  ordenados.forEach(nome => {
    const li = document.createElement("li");
    li.textContent = state.unread[nome] ? `${nome} (Não lida)` : nome;
    li.onclick = () => {
      abrirChat(nome);
      limparUnread(nome);
    };
    lista.appendChild(li);
  });
}

// ===========================
// CHAT
// ===========================
function abrirChat(nomeModelo) {
  if (state.modeloAtual === nomeModelo) return;

  state.modeloAtual = nomeModelo;
  modeloNome.textContent = nomeModelo;
  chatBox.innerHTML = "";

  localStorage.setItem("modeloAtual", nomeModelo);
  localStorage.setItem("chatModelo", nomeModelo);

  socket.emit("joinRoom", { cliente, modelo: nomeModelo });
}

function limparUnread(modelo) {
  socket.emit("markAsRead", { cliente, modelo });
  delete state.unread[modelo];
  renderLista();
}

// ===========================
// ENVIO DE MENSAGEM
// ===========================
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

input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendBtn.click();
  }
});

// ===========================
// SOCKET HANDLERS
// ===========================
function onChatHistory(messages) {
  chatBox.innerHTML = "";
  messages.forEach(renderMessage);
}

function onNewMessage(msg) {
  renderMessage(msg);
  pedirUnread();
}

function onUnreadUpdate(map) {
  state.unread = map;
  renderLista();
}

function pedirUnread() {
  socket.emit("getUnread", cliente);
}

// ===========================
// CONTEÚDO DESBLOQUEADO
// ===========================
function onConteudoDesbloqueado({ conteudoId }) {
  const card = document.querySelector(
    `.chat-conteudo .btn-desbloquear[data-id="${conteudoId}"]`
  )?.closest(".chat-conteudo");

  if (!card) return;

  card.classList.remove("bloqueado");
  card.querySelector(".overlay-bloqueado")?.remove();

  const media = card.querySelector("img, video");
  if (media) {
    media.style.cursor = "pointer";
    media.style.pointerEvents = "auto";
    if (media.tagName === "VIDEO") media.controls = true;
  }

  fecharPopupPix();
}

// ===========================
// RENDER DE MENSAGEM
// ===========================
function renderMessage(msg) {
  const div = document.createElement("div");
  div.classList.add("msg");
  div.classList.add(msg.from === cliente ? "msg-cliente" : "msg-modelo");

  div.innerHTML = `<div class="msg-text">${msg.text}</div>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
