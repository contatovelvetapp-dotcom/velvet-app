// jobs/fechamentoMensalJob.js
const cron = require("node-cron");

cron.schedule("0 2 1 * *", () => {
  console.log("🔒 Job de fechamento mensal (ativo)");
});
