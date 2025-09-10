import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import generateToken from '../utils/generateToken.js';
import {
  createUser,
  findUserByEmail,
  updateUserPasswordResetToken,
  findUserByResetToken,
  updateUserPassword,
} from '../models/usersModel.js';
import transporter from '../utils/emailTransporter.js';

// ---------------------------------------------------
// Signup Endpoint
// ---------------------------------------------------

export const signup = async (req, res, next) => {
  console.log('BODY:', req.body);
  try {
    const { username, email, password, institution } = req.body;

    if (!username || !email || !password || !institution) {
      res.status(400);
      throw new Error('Please fill in all fields');
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await createUser(username, email, passwordHash, institution);

    const token = generateToken(user);

    // Send Welcome Email
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Welcome to BID IT</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        body { margin:0; padding:0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; background-color:#f6f9fc; }
        .container { max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
        .header { background:#007BFF; color:white; text-align:center; padding:30px 20px; }
        .header h1 { margin:0; font-size:28px; }
        .body { padding:30px 20px; color:#333; text-align:left; }
        .body h2 { color:#007BFF; margin-top:0; }
        .body p { line-height:1.5; margin:15px 0; }
        .button-container { text-align:center; margin-top:30px; }
        .cta-button { background:#007BFF; color:white; padding:15px 30px; text-decoration:none; font-weight:bold; border-radius:4px; display:inline-block; }
        .footer { font-size:12px; color:#777; text-align:center; padding:20px; }
        @media only screen and (max-width:600px) { .header h1{font-size:24px;} .body h2{font-size:20px;} }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to BID IT!</h1>
        </div>
        <div class="body">
          <h2>Hello, ${user.username} 👋</h2>
          <p>We're thrilled to welcome you to <strong>BID IT</strong> — your ultimate marketplace for Nigerian university students.</p>
          <p>Start exploring the platform now to buy, sell, and bid on the best products on campus!</p>
          <div class="button-container">
            <a href="https://yourdomain.com" class="cta-button">Visit BID IT</a>
          </div>
          <p>Need help? Our <a href="https://yourdomain.com/help">Help Center</a> is always available.</p>
        </div>
        <div class="footer">
          &copy; 2025 BID IT. All rights reserved.
        </div>
      </div>
    </body>
    </html>`;

    await transporter.sendMail({
      from: '"BID IT" <no-reply@yourdomain.com>',
      to: user.email,
      subject: 'Welcome to BID IT!',
      html: htmlContent,
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      institution: user.institution,
      token,
      message: 'Signup successful, welcome email sent!',
    });
  } catch (error) {
    console.error('Signup error:', error);
    next(error);
  }
};

// ---------------------------------------------------
// Login Endpoint
// ---------------------------------------------------

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide both email and password');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      institution: user.institution,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// ---------------------------------------------------
// Forgot Password Endpoint
// ---------------------------------------------------

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404);
      throw new Error('No account found with this email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await updateUserPasswordResetToken(user.id, resetToken, tokenExpiry);

    const resetLink = `http://localhost:5000/reset-password/${resetToken}`;

    const htmlContent = `
    <h2>Reset your BID IT password</h2>
    <p>Hello ${user.username},</p>
    <p>You requested to reset your password. Click the link below or paste it into your browser:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>This link will expire in 1 hour. If you did not request a reset, please ignore this email.</p>`;

    await transporter.sendMail({
      from: '"BID IT" <no-reply@yourdomain.com>',
      to: user.email,
      subject: 'Password Reset Request',
      html: htmlContent,
    });

    res.json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Forgot Password error:', error);
    next(error);
  }
};

// ---------------------------------------------------
// Reset Password Endpoint
// ---------------------------------------------------

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      res.status(400);
      throw new Error('Password is required');
    }

    const user = await findUserByResetToken(token);
    if (!user || !user.reset_token_expiry || user.reset_token_expiry < new Date()) {
      res.status(400);
      throw new Error('Invalid or expired password reset token');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await updateUserPassword(user.id, passwordHash);

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset Password error:', error);
    next(error);
  }
};
