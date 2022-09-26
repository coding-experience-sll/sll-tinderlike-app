module.exports = {
  connectionString: process.env.STAGING_DB_URI,
  secret: process.env.JWT_SECRET,
  emailFrom: process.env.EMAIL_FROM,
  smtpOptions: {
    host: process.env.SMTP_HOST,
    secureConnection: process.env.SMTP_SECURE_CONNECTION,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_AUTH_USER,
      pass: process.env.SMTP_AUTH_PASSWORD,
    },
  },
};
