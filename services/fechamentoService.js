const db = require("../db");

async function calcularFechamentoMensal(ano, mes) {
  const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const fim = mes === 12
    ? `${ano + 1}-01-01`
    : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;

  const { rows } = await db.query(
    `
    SELECT
      SUM(valor_bruto) AS total_bruto,
      SUM(taxa_gateway) AS total_taxas,
      SUM(agency_fee) AS total_agency,
      SUM(velvet_fee) AS total_velvet,
      SUM(valor_modelo) AS total_modelos,

      SUM(CASE WHEN tipo='assinatura' THEN valor_bruto ELSE 0 END) AS total_assinaturas,
      SUM(CASE WHEN tipo='midia' THEN valor_bruto ELSE 0 END) AS total_midias
    FROM transacoes
    WHERE status = 'normal'
      AND created_at >= $1
      AND created_at <  $2
    `,
    [inicio, fim]
  );

  const resumo = rows[0];

  await db.query(
    `
    INSERT INTO fechamento_mensal
      (ano, mes, total_bruto, total_taxas, total_agency,
       total_velvet, total_modelos, total_assinaturas, total_midias)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (ano, mes)
    DO NOTHING
    `,
    [
      ano,
      mes,
      resumo.total_bruto || 0,
      resumo.total_taxas || 0,
      resumo.total_agency || 0,
      resumo.total_velvet || 0,
      resumo.total_modelos || 0,
      resumo.total_assinaturas || 0,
      resumo.total_midias || 0
    ]
  );
}

module.exports = { calcularFechamentoMensal };
