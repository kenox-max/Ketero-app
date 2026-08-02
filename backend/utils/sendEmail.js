const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPCode = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"Ketero App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Ketero Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0B0B0D; color: #ffffff; border-radius: 10px;">
        <h2 style="color: #FFB800;">Welcome to Ketero!</h2>
        <p>Use the following 6-digit verification code to complete your registration:</p>
        <h1 style="background-color: #16141C; color: #FFB800; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 5px;">${otpCode}</h1>
        <p style="color: #888;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = sendOTPCode;
