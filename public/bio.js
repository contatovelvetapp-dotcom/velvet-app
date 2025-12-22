document.addEventListener("DOMContentLoaded", () => {
  const btnEditarBio   = document.getElementById("btnEditarBio");
  const popupBio       = document.getElementById("popupBio");
  const btnSalvarBio   = document.getElementById("btnSalvarBio");
  const btnFecharPopup = document.getElementById("btnFecharPopup");
  const bioInput       = document.getElementById("bioInput");
  const bioText        = document.getElementById("profileBio");

  if (!btnEditarBio || !popupBio) return;

  // abrir popup
  btnEditarBio.addEventListener("click", () => {
    bioInput.value = bioText.textContent.trim();
    popupBio.classList.remove("hidden");
  });

  // fechar popup
  btnFecharPopup.addEventListener("click", () => {
    popupBio.classList.add("hidden");
  });

  // salvar bio
  btnSalvarBio.addEventListener("click", async () => {
    const novaBio = bioInput.value.trim();
    if (!novaBio) return alert("A bio não pode estar vazia");

    const token = localStorage.getItem("token");

    const res = await fetch("/api/modelo/bio", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({ bio: novaBio })
    });

    if (res.ok) {
      bioText.textContent = novaBio;
      popupBio.classList.add("hidden");
    } else {
      alert("Erro ao salvar bio");
    }
  });
});
