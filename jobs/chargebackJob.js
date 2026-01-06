const cron = require("node-cron");
const db = require("../db");
const { calcularScoreRisco, nivelPorScore } = require("../services/riscoService");
const { dispararAlerta } = require("../services/emailService");

cron.schedule("0 4 * * *", async () => {
  console.log("🔍 Job de chargeback iniciado");

  const { rows } = await db.query(`
    SELECT
      cliente_id,
      COUNT(*) FILTER (WHERE chargeback_result='lost') AS lost,
      COUNT(*) FILTER (WHERE chargeback_result='won') AS won,
      SUM(valor_bruto) AS valor,
      COUNT(*) FILTER (
        WHERE created_at >= NOW() - INTERVAL '30 days'
      ) AS recentes
    FROM transacoes
    WHERE status='chargeback'
    GROUP BY cliente_id
  `);

  for (const c of rows) {
    const score = calcularScoreRisco({
      totalLost: c.lost,
      totalWon: c.won,
      valorTotal: Number(c.valor || 0),
      recentes30d: c.recentes > 0,
      reincidente: c.lost >= 3
    });

    const nivel = nivelPorScore(score);

    await db.query(
      `
      INSERT INTO cliente_risco (cliente_id, score, nivel)
      VALUES ($1,$2,$3)
      ON CONFLICT (cliente_id)
      DO UPDATE SET
        score = EXCLUDED.score,
        nivel = EXCLUDED.nivel,
        atualizado_em = NOW()
      `,
      [c.cliente_id, score, nivel]
    );

    if (nivel === "critico") {
      await dispararAlerta(c.cliente_id, score, nivel);
    }
  }

  console.log("✅ Job de chargeback finalizado");
});
