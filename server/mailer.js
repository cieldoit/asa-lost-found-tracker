// mailer.js - Using Resend HTTP API (works on Render free tier)
require('dotenv').config();

const transporter = {
  sendMail: async (options) => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'ASA Lost and Found <onboarding@resend.dev>',
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html || options.text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return data;
  }
};

module.exports = transporter;
