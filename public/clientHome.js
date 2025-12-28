// ===============================
// AUTH GUARD — CLIENT HOME
// ===============================
const token = localStorage.getItem("token");
const role  = localStorage.getItem("role");

if (!token || role !== "cliente") {
  window.location.href = "/index.html";
  throw new Error("Acesso negado");
}

function logout() {
  localStorage.clear();
  window.location.href = "/index.html";
}


document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("listaModelos");
  const token = localStorage.getItem("token");

  if (!lista) {
    console.error("listaModelos não encontrada");
    return;
  }

  fetch("/api/feed/modelos", {
    headers: {
      Authorization: "Bearer " + token
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar feed");
      return res.json();
    })
    .then(modelos => {
      console.log("📥 Modelos:", modelos);

      lista.innerHTML = "";

      if (!modelos || modelos.length === 0) {
        lista.innerHTML = "<p>Nenhuma modelo disponível</p>";
        return;
      }

      modelos.forEach(modelo => {
        const card = document.createElement("div");
        card.className = "modelItem";

        card.innerHTML = `
          <img
            src="${modelo.avatar || "/assets/avatarDefault.png"}"
            alt="${modelo.nome}">
        `;

 card.addEventListener("click", () => {
  if (!modelo.id) {
    console.error("Modelo sem id:", modelo);
    return;
  }

  localStorage.setItem("modelo_id", modelo.id);
  window.location.href = "profile.html";
});

  lista.appendChild(card);
  });
  })
  .catch(err => {
  console.error("Erro feed:", err);
  lista.innerHTML = "<p>Erro ao carregar modelos</p>";
  });
});