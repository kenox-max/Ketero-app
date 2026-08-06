const nodemailer = require('nodemailer');

const sendOTPCode = async (toEmail, otpCode) => {
  const user = process.env.SMTP_USER || process.env.BREVO_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.BREVO_PASS || process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST || (process.env.BREVO_USER || process.env.BREVO_PASS ? 'smtp-relay.brevo.com' : 'smtp.gmail.com');
  const port = parseInt(process.env.SMTP_PORT || (host.includes('brevo') ? '587' : '465'), 10);
  const secure = port === 465;
  const senderEmail = process.env.EMAIL_FROM || user;

  if (!user || !pass) {
    throw new Error('SMTP/Brevo credentials are missing in backend/.env');
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #0B0B0D; color: #ffffff; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #FFB800;">
      <h2 style="color: #FFB800; margin-top: 0;">Welcome to Ketero ቀጠሮ!</h2>
      <p style="color: #D1D5DB; font-size: 15px; line-height: 1.5;">Use the following 6-digit verification code to complete your security verification:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="background-color: #16141C; color: #FFB800; padding: 14px 28px; font-size: 28px; font-weight: bold; border-radius: 8px; letter-spacing: 6px; border: 1px solid rgba(255, 184, 0, 0.3); display: inline-block;">${otpCode}</span>
      </div>
      <p style="color: #9CA3AF; font-size: 13px;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
    tls: { rejectUnauthorized: false },
  });

  const mailOptions = {
    from: `"Ketero App ቀጠሮ" <${senderEmail}>`,
    to: toEmail,
    subject: 'Your Ketero Verification Code',
    html: htmlContent,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(`[BREVO SMTP SUCCESS] Delivered OTP code to ${toEmail}. Message ID: ${result.messageId}`);
  return result;
};

module.exports = sendOTPCode;


module.exports = sendOTPCode;



