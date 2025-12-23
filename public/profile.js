// ===============================
// VIP.JS – VERSÃO SEGURA
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const btnVip = document.getElementById("btnVip");

  if (!btnVip) {
    console.error("❌ Botão VIP não encontrado");
    return;
  }

  console.log("✅ Botão VIP encontrado");

  btnVip.addEventListener("click", async () => {

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Você precisa estar logado");
      return;
    }

    let modeloId = window.modeloAtualId;

    // ===============================
    // FALLBACK – modelo ainda não carregada
    // ===============================
    if (!modeloId) {
      const nomeModelo = localStorage.getItem("modeloPerfil");

      if (!nomeModelo) {
        alert("Modelo não identificada");
        return;
      }

      try {
        console.warn("⚠️ modeloAtualId ausente, buscando via API...");

        const resModelo = await fetch(`/api/modelo/publico/${nomeModelo}`, {
          headers: {
            Authorization: "Bearer " + token
          }
        });

        if (!resModelo.ok) {
          alert("Erro ao identificar a modelo");
          return;
        }

        const modelo = await resModelo.json();

        if (!modelo.user_id) {
          alert("Modelo inválida");
          return;
        }

        modeloId = modelo.user_id;
        window.modeloAtualId = modeloId; // cache global

        console.log("✅ modeloAtualId recuperado:", modeloId);

      } catch (err) {
        console.error("Erro ao buscar modelo:", err);
        alert("Erro ao identificar a modelo");
        return;
      }
    }

    // ===============================
    // CRIAR ASSINATURA VIP
    // ===============================
    try {
      const res = await fetch("/api/vip/assinatura", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          modelo_id: modeloId
        })
      });

      if (!res.ok) {
        alert("Erro ao iniciar assinatura VIP");
        return;
      }

      const data = await res.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("Erro ao iniciar assinatura VIP");
      }

    } catch (err) {
      console.error("Erro assinatura VIP:", err);
      alert("Erro de conexão");
    }
  });
});
