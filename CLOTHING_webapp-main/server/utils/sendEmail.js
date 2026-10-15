const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || apiKey.includes('your_') || !fromEmail) {
    console.warn(`[Email Service] SendGrid is not fully configured. Email "${options.subject}" to ${options.to} was not sent.`);
    return;
  }

  sgMail.setApiKey(apiKey);

  const msg = {
    to: options.to,
    from: fromEmail,
    subject: options.subject,
    html: options.html,
  };

  await sgMail.send(msg);
};

module.exports = sendEmail;
