async function carregarGanhos() {
  const res = await fetch("/api/modelo/ganhos", {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token")
    }
  });

  const dados = await res.json();
  const container = document.getElementById("listaGanhos");

  dados.forEach(tx => {
    const div = document.createElement("div");
    div.className = "lineModelChatList mb-3";

    div.innerHTML = `
      <div class="mmCell mr-3">
        <div>#${tx.public_id.toUpperCase()}</div>
        <div>Usuário: ${tx.cliente_nome}</div>
        <div>Data: ${new Date(tx.created_at).toLocaleString()}</div>
        <div>Preço: $${tx.preco}</div>

        ${tx.chargeback_status ? `<div>Charge Back status: $${tx.chargeback_status}</div>` : ""}

        <div>Taxas do terminal: $${tx.taxa_terminal}</div>
        <div>Ganhos do Backstage: $${tx.ganho_backstage}</div>

        ${tx.ganho_agency ? `<div>Agency: $${tx.ganho_agency}</div>` : ""}

        <div>Ganhos do modelo: $${tx.ganho_modelo}</div>
      </div>
    `;

    container.appendChild(div);
  });
}

carregarGanhos();
