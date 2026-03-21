// REP REPUBLIC — Backend Server (Nodemailer / Gmail)
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const emailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 5,
  keyGenerator: (req) => req.body.email || req.ip,
  message: { success: false, message: 'Too many requests. Please wait.' }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendEmail(to, subject, html) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[DEV] Email skipped - no credentials set');
    return { success: true, dev: true };
  }
  try {
    await transporter.sendMail({ from: `"REP REPUBLIC" <${process.env.EMAIL_USER}>`, to, subject, html });
    console.log('Email sent to', to);
    return { success: true };
  } catch (err) {
    console.error('Email error:', err.message);
    return { success: false };
  }
}

app.post('/api/register', emailLimiter, async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email) return res.status(400).json({ success: false });
  const result = await sendEmail(email, 'Welcome to REP REPUBLIC!',
    `<div style="font-family:sans-serif;background:#0a0a0a;color:#f0f0f0;padding:40px;max-width:500px;margin:0 auto;border-radius:12px;">
      <h1 style="color:#e8ff3a;letter-spacing:3px;">REP REPUBLIC</h1>
      <p style="color:#555;font-size:0.8rem;letter-spacing:2px;">TRACK EVERY REP. OWN EVERY DAY.</p>
      <h2 style="color:#3aff8a;">Account Created Successfully!</h2>
      <p>Hey <strong>${name}</strong>, welcome to REP REPUBLIC!</p>
      <div style="background:#181818;border:1px solid #252525;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:4px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin:4px 0;"><strong>Phone:</strong> ${phone}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
      </div>
      <p style="color:#e8ff3a;font-size:1.2rem;font-weight:bold;">Time to grind! Let's go!</p>
    </div>`
  );
  res.json({ success: true, emailSent: result.success });
});

app.post('/api/login', emailLimiter, async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email) return res.status(400).json({ success: false });
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const result = await sendEmail(email, 'REP REPUBLIC - Login Alert',
    `<div style="font-family:sans-serif;background:#0a0a0a;color:#f0f0f0;padding:40px;max-width:500px;margin:0 auto;border-radius:12px;">
      <h1 style="color:#e8ff3a;letter-spacing:3px;">REP REPUBLIC</h1>
      <p style="color:#555;font-size:0.8rem;letter-spacing:2px;">TRACK EVERY REP. OWN EVERY DAY.</p>
      <h2 style="color:#3aff8a;">Login Successful!</h2>
      <p>Hey <strong>${name}</strong>, you just logged in!</p>
      <div style="background:#181818;border:1px solid #252525;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:4px 0;"><strong>Time:</strong> ${timeStr}</p>
        <p style="margin:4px 0;"><strong>Date:</strong> ${dateStr}</p>
      </div>
      <p style="color:#e8ff3a;font-size:1.2rem;font-weight:bold;">Crush today's workout!</p>
    </div>`
  );
  res.json({ success: true, emailSent: result.success });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'REP REPUBLIC' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`REP REPUBLIC running on port ${PORT} | Email: ${process.env.EMAIL_USER || 'NOT SET'}`));
