function calcularScoreRisco({ totalLost, totalWon, valorTotal, recentes30d, reincidente }) {
  let score = 0;

  score += totalLost * 30;
  score += totalWon * 10;
  score += Math.floor(valorTotal / 5);

  if (recentes30d) score += 15;
  if (reincidente) score += 20;

  return Math.min(score, 100);
}

function nivelPorScore(score) {
  if (score >= 80) return "critico";
  if (score >= 50) return "alto";
  if (score >= 20) return "medio";
  return "baixo";
}

module.exports = { calcularScoreRisco, nivelPorScore };
