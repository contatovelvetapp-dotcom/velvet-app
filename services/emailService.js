const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function dispararAlerta(clienteId, score, nivel) {
  await transporter.sendMail({
    from: '"Velvet Alerts" <alerts@velvet.lat>',
    to: "admin@velvet.lat",
    subject: "🚨 Cliente com risco CRÍTICO",
    html: `
      <h2>Alerta de Risco</h2>
      <p><strong>Cliente:</strong> ${clienteId}</p>
      <p><strong>Score:</strong> ${score}</p>
      <p><strong>Nível:</strong> ${nivel.toUpperCase()}</p>
    `
  });
}

module.exports = { dispararAlerta };
