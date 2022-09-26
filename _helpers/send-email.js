const nodemailer = require("nodemailer");
const config = require("config.js");

module.exports = sendEmail;

async function sendEmail({ to, subject, html, from = config.emailFrom }) {
  const transporter = nodemailer.createTransport(config.smtpOptions);
  await transporter.sendMail({ from, to, subject, html });
}

//To configure your email address, do it on config.js
