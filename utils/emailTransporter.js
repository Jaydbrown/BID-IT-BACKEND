import nodemailer from 'nodemailer';

// Create transporter with env config
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true if using port 465; otherwise false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Reusable function to send a welcome email
export const sendWelcomeEmail = async (to, username) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="color: #007BFF;">Welcome to BID IT, ${username}!</h1>
      <p>We’re excited to have you join our marketplace for Nigerian university students.</p>
      <p>Start exploring now and enjoy bidding, buying, and selling on campus!</p>
      <p style="margin-top: 30px;">
        <a href="${process.env.BASE_URL}" style="
          background-color: #007BFF;
          color: #ffffff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
        ">Visit BID IT</a>
      </p>
      <p style="margin-top: 40px; font-size: 12px; color: #777;">
        If you did not sign up, please ignore this email or contact us.
      </p>
    </div>
  `;

  const plainText = `Welcome to BID IT, ${username}!\n\nWe’re excited to have you join our marketplace for Nigerian university students.\n\nVisit us at: ${process.env.BASE_URL}\n\nIf you did not sign up, please ignore this email.`;

  try {
    await transporter.sendMail({
      from: `"BID IT" <${process.env.SMTP_USER}>`, // Uses your authenticated email
      to,
      subject: 'Welcome to BID IT!',
      text: plainText,
      html: htmlContent,
    });
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

export default transporter; // still export transporter if needed elsewhere
