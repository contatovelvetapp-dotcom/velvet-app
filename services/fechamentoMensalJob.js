const cron = require("node-cron");
const { calcularFechamentoMensal } = require("../services/fechamentoService");

// roda TODO DIA 1 às 02:00
cron.schedule("0 2 1 * *", async () => {
  const agora = new Date();

  const ano = agora.getMonth() === 0
    ? agora.getFullYear() - 1
    : agora.getFullYear();

  const mes = agora.getMonth() === 0
    ? 12
    : agora.getMonth();

  console.log(`🔒 Fechando mês ${mes}/${ano}`);

  await calcularFechamentoMensal(ano, mes);

  console.log("✅ Fechamento mensal concluído");
});
