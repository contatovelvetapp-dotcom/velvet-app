// ===============================
// ELEMENTOS DO PERFIL
// ===============================
const avatarImg  = document.getElementById("profileAvatar");
const capaImg    = document.getElementById("profileCapa");
const nomeEl     = document.getElementById("profileName");
const profileBio = document.getElementById("profileBio");

const inputAvatar = document.getElementById("inputAvatar");
const inputCapa   = document.getElementById("inputCapa");
const inputMedia  = document.getElementById("inputMedia");
const listaMidias = document.getElementById("listaMidias");

const btnChat = document.getElementById("btnChat");
const btnVip  = document.getElementById("btnVip");

const btnSalvarBio = document.getElementById("btnSalvarBio");
const bioInput     = document.getElementById("bioInput");

// ===============================
// ESTADO GLOBAL
// ===============================
const token = localStorage.getItem("token"); // ✅ CORRETO
const role  = localStorage.getItem("role");
const modeloPublico = localStorage.getItem("modeloPerfil");

let modeloIdAtual = null;

let modo = "privado";
if (role === "cliente" && modeloPublico) modo = "publico";

// ===============================
// GUARD TOKEN
// ===============================
if (!token) {
  alert("Sessão expirada. Faça login novamente.");
  window.location.href = "/";
  throw new Error("Token ausente");
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  aplicarRoleNoBody();
  iniciarPerfil();
  iniciarUploads();
  iniciarBioPopup();
});

// ===============================
// ROLE VISUAL
// ===============================
function aplicarRoleNoBody() {
  document.body.classList.remove("role-modelo", "role-cliente");
  if (role === "modelo") document.body.classList.add("role-modelo");
  if (role === "cliente") document.body.classList.add("role-cliente");
}

// ===============================
// PERFIL
// ===============================
function iniciarPerfil() {
  if (modo === "privado") {
    carregarPerfil();
    carregarFeed();
  }

  if (modo === "publico") {
    carregarPerfilPublico();
    carregarFeedPublico();
  }
}

async function carregarPerfil() {
  const res = await fetch("/api/modelo/me", {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;

  const modelo = await res.json();
  aplicarPerfilNoDOM(modelo);
}

async function carregarPerfilPublico() {
  const res = await fetch(`/api/modelo/publico/${modeloPublico}`, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) return;

  const modelo = await res.json();
  modeloIdAtual = modelo.id;

  aplicarPerfilNoDOM(modelo);

  // 🔐 VERIFICAR VIP (persistente)
  const vipRes = await fetch(`/api/vip/status/${modelo.id}`, {
    headers: { Authorization: "Bearer " + token }
  });

  if (vipRes.ok) {
    const vipData = await vipRes.json();
    if (vipData.vip && btnVip) {
      btnVip.textContent = "VIP ativo 💜";
      btnVip.disabled = true;
    }
  }
}

// ===============================
// CHAT
// ===============================
btnChat?.addEventListener("click", () => {
  localStorage.setItem("chatModelo", nomeEl.textContent);
  window.location.href = "/chatcliente.html";
});

// ===============================
// VIP
// ===============================
btnVip?.addEventListener("click", async () => {
  if (!modeloIdAtual) {
    alert("Modelo não identificada");
    return;
  }

  const res = await fetch("/api/vip/ativar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ modelo_id: modeloIdAtual })
  });

  const data = await res.json();

  if (data.success) {
    btnVip.textContent = "VIP ativo 💜";
    btnVip.disabled = true;
    alert("VIP ativado com sucesso!");
  } else {
    alert(data.error || "Erro ao ativar VIP");
  }
});

// ===============================
// FEED
// ===============================
function carregarFeed() {
  if (!listaMidias) return;

  fetch("/api/feed/me", {
    headers: { Authorization: "Bearer " + token }
  })
    .then(r => r.json())
    .then(feed => {
      if (!Array.isArray(feed)) return;
      listaMidias.innerHTML = "";
      feed.forEach(item => adicionarMidia(item.url));
    });
}

function carregarFeedPublico() {
  if (!listaMidias) return;

  fetch(`/api/modelo/${modeloPublico}/feed`, {
    headers: { Authorization: "Bearer " + token }
  })
    .then(r => r.json())
    .then(feed => {
      if (!Array.isArray(feed)) return;
      listaMidias.innerHTML = "";
      feed.forEach(item => adicionarMidia(item.url));
    });
}

// ===============================
// BIO
// ===============================
function iniciarBioPopup() {
  const btnEditarBio = document.getElementById("btnEditarBio");
  const popupBio = document.getElementById("popupBio");
  const btnFecharPopup = document.getElementById("btnFecharPopup");

  if (!btnEditarBio || !popupBio) return;

  btnEditarBio.onclick = () => {
    bioInput.value = profileBio.textContent.trim();
    popupBio.classList.remove("hidden");
  };

  btnFecharPopup.onclick = () => popupBio.classList.add("hidden");
}

btnSalvarBio?.addEventListener("click", async () => {
  const bio = bioInput.value.trim();
  if (!bio) return;

  const res = await fetch("/api/modelo/bio", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ bio })
  });

  if (res.ok) profileBio.textContent = bio;
});

// ===============================
// UPLOADS
// ===============================
function iniciarUploads() {
  inputMedia?.addEventListener("change", async () => {
    const file = inputMedia.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("midia", file);

    const res = await fetch("/uploadMidia", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: fd
    });

    const data = await res.json();
    if (data.url) adicionarMidia(data.url);
  });
}

// ===============================
// MIDIA
// ===============================
function adicionarMidia(url) {
  const card = document.createElement("div");
  card.className = "midiaCard";

  const ext = url.split(".").pop().toLowerCase();
  const el = ["mp4","webm","ogg"].includes(ext)
    ? Object.assign(document.createElement("video"), { src: url, controls: true })
    : Object.assign(document.createElement("img"), { src: url });

  el.className = "midiaThumb";
  card.appendChild(el);
  listaMidias.appendChild(card);
}

// ===============================
// DOM PERFIL
// ===============================
function aplicarPerfilNoDOM(modelo) {
  nomeEl.textContent = modelo.nome;
  profileBio.textContent = modelo.bio || "";
  if (modelo.avatar) avatarImg.src = modelo.avatar;
  if (modelo.capa) capaImg.src = modelo.capa;
}
