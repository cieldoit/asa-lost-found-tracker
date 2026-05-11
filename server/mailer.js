// mailer.js - Using Brevo (Sendinblue) HTTP API
// Free: 300 emails/day, sends to ANY email, no domain needed
require('dotenv').config();

const transporter = {
  sendMail: async (options) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'ASA Lost and Found',
          email: process.env.BREVO_SENDER_EMAIL
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html || `<p>${options.text}</p>`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || JSON.stringify(data));
    }

    return data;
  }
};

module.exports = transporter;
