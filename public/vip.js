const socket = window.socket;
Authorization: "Bearer " + 

fetch("/api/rota-protegida", {
  headers: {
    "Authorization": "Bearer " + localStorage.removeItem("token")
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/";
}


if (!socket) {
  console.error("❌ Socket não disponível no chatmodelo");
}

document.addEventListener("DOMContentLoaded", () => {
  btnVip.addEventListener("click", () => {
  fetch("/api/vip/assinatura", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({
      modelo_id: localStorage.getItem("modeloId")
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("Erro ao iniciar assinatura VIP");
      }
    });
  });

});

