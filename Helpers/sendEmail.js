const nodemailer = require("nodemailer");

// Reusable transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // or your SMTP service
  port: 587,
  secure: false,
  auth: {
    user: "amanrajput79654@gmail.com", // your email
    pass: "fkqt ertz xcxs nayp", // your app password or SMTP password
  },
});

async function sendEmail(to, subject, html) {
  const mailOptions = {
    from: `"Your App Name" <${"amanrajput79644@gmail.com"}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;
