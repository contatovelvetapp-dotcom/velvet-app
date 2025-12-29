// ===============================
// AUTH GUARD — CLIENT HOME
// ===============================
const token = localStorage.getItem("token");
const role  = localStorage.getItem("role");

if (!token) {
  window.location.href = "/index.html";
  throw new Error("Sem token");
}


function logout() {
  localStorage.clear();
  window.location.href = "/index.html";
}

// ===============================
// 📦 CONTEÚDOS — MODELO (LIMPO)
// ===============================

// ---------- ESTADO ----------
let modelo = null;

// ---------- ELEMENTOS DOM ----------
const fileInput = document.getElementById("conteudoFile");
const fileNameSpan = document.getElementById("fileName");
const lista = document.getElementById("listaConteudos");

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await carregarModelo();
  listarConteudos();
  bindFileInput();
}

// ---------- MODELO (via JWT) ----------
async function carregarModelo() {
  const res = await fetch("/api/me", {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token")
    }
  });

  const user = await res.json();
  if (user.role !== "modelo") {
  alert("Acesso restrito à modelo");
  window.location.href = "/index.html";
  throw new Error("Usuário não é modelo");
}
  modelo = user.id;
console.log("📦 Conteúdos da modelo:", user.nome);
}

// ---------- INPUT FILE ----------
function bindFileInput() {
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      fileNameSpan.textContent = fileInput.files[0].name;
    } else {
      fileNameSpan.textContent = "Nenhum ficheiro selecionado";
    }
  });
}

// ---------- UPLOAD ----------
async function uploadConteudo() {
  const file = fileInput.files[0];
  if (!file) {
    alert("Selecione um ficheiro primeiro");
    return;
  }

  const fd = new FormData();
  fd.append("conteudo", file);

  const res = await fetch("/api/conteudos/upload", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token")
    },
    body: fd
  });

  const data = await res.json();
  if (!data.success) {
    alert("Erro ao enviar conteúdo");
    return;
  }

  fileInput.value = "";
  fileNameSpan.textContent = "Nenhum ficheiro selecionado";
  listarConteudos();
}

// ---------- LISTAR ----------
async function listarConteudos() {
  const res = await fetch("/api/conteudos", {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token")
    }
  });

  if (!res.ok) {
    const texto = await res.text();
    alert(texto);
    return;
  }

  const conteudos = await res.json();

  lista.innerHTML = "";

  if (!conteudos.length) {
    lista.innerHTML = "<p>Nenhum conteúdo enviado ainda.</p>";
    return;
  }

  conteudos.forEach(c => {
    const card = document.createElement("div");
    card.className = "conteudo-card";

    const media =
      c.tipo === "video"
        ? `<video src="${c.url}" muted onclick="abrirModalMidia('${c.url}', true)"></video>`
        : `<img src="${c.url}" onclick="abrirModalMidia('${c.url}', false)"/>`;

    card.innerHTML = `
      ${media}
      <button class="btn-excluir"
        onclick="event.stopPropagation(); excluirConteudo('${c.id}')">
        ✕
      </button>
    `;

    lista.appendChild(card);
  });
}

// ---------- EXCLUIR ----------
async function excluirConteudo(id) {
  if (!confirm("Deseja excluir este conteúdo?")) return;

  const res = await fetch(`/api/conteudos/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token")
    }
  });

  // 🔥 SE DER 403, NÃO TENTAR JSON
  if (!res.ok) {
    const texto = await res.text();
    alert(texto);
    return;
  }

  const data = await res.json();
  if (!data.success) {
    alert("Erro ao excluir conteúdo");
    return;
  }

  listarConteudos();
}

function abrirModalMidia(url, isVideo) {
  const modal = document.getElementById("modalMidia");
  const img = document.getElementById("modalImg");
  const video = document.getElementById("modalVideo");

  img.style.display = "none";
  video.style.display = "none";

  if (isVideo) {
    video.src = url;
    video.style.display = "block";
    video.play();
  } else {
    img.src = url;
    img.style.display = "block";
  }

  modal.classList.remove("hidden");
}

document.getElementById("fecharModal")?.addEventListener("click", () => {
  const modal = document.getElementById("modalMidia");
  const video = document.getElementById("modalVideo");

  video.pause();
  video.src = "";
  modal.classList.add("hidden");
});
