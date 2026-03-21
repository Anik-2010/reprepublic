// ═══════════════════════════════════════════════════
//  REP REPUBLIC — Backend Server
//  Node.js + Express + Fast2SMS
// ═══════════════════════════════════════════════════

require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const axios       = require('axios');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const app  = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Rate limiter: max 5 SMS requests per phone per 10 minutes ──
const smsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.phone || req.ip,
  message: { success: false, message: 'Too many requests. Please wait a few minutes.' }
});

// ═══════════════════════════════════════════════════
//  FAST2SMS HELPER — uses v3 Quick SMS (no DLT needed)
// ═══════════════════════════════════════════════════
async function sendSMS(phone, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey || apiKey === 'your_fast2sms_api_key_here') {
    console.warn('⚠️  FAST2SMS_API_KEY not set — SMS not sent (dev mode)');
    console.log(`📱 [SMS to ${phone}]: ${message}`);
    return { success: true, dev: true };
  }

  try {
    console.log(`📤 Sending SMS to ${phone}...`);

    const response = await axios.get(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        params: {
          authorization: apiKey,
          route: 'v3',
          message: message,
          language: 'english',
          flash: 0,
          numbers: phone,
        }
      }
    );

    console.log('Fast2SMS response:', JSON.stringify(response.data));

    if (response.data.return === true) {
      console.log(`✅ SMS sent successfully to ${phone}`);
      return { success: true };
    } else {
      console.error('❌ Fast2SMS error:', response.data);
      return { success: false, message: response.data.message || 'SMS failed' };
    }
  } catch (err) {
    console.error('❌ SMS request failed:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
    return { success: false, message: 'SMS service error' };
  }
}

// ═══════════════════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════════════════

// ── POST /api/register ──
app.post('/api/register', smsLimiter, async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required.' });
  }
  if (!/^[0-9]{7,15}$/.test(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number.' });
  }

  const message =
    `Welcome to REP REPUBLIC ${name}! Your account has been created successfully. Time to grind - track every rep, own every day!`;

  const result = await sendSMS(phone, message);

  if (result.success) {
    res.json({ success: true, message: 'Account created! Welcome SMS sent.' });
  } else {
    res.json({ success: true, smsFailed: true, message: 'Account created, but SMS could not be sent.' });
  }
});

// ── POST /api/login ──
app.post('/api/login', smsLimiter, async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required.' });
  }

  const now     = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const message =
    `Hey ${name}! You have logged in to REP REPUBLIC. Login time: ${timeStr}, ${dateStr}. Lets crush today's workout!`;

  const result = await sendSMS(phone, message);

  res.json({
    success: true,
    smsSent: result.success && !result.dev,
    message: result.success ? 'Login SMS sent.' : 'Login ok, SMS not sent.'
  });
});

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'REP REPUBLIC', time: new Date().toISOString() });
});

// ── Catch-all: serve the frontend ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n REP REPUBLIC server running on port ${PORT}`);
  console.log(`   Local:  http://localhost:${PORT}`);
  console.log(`   SMS:    ${process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_API_KEY !== 'your_fast2sms_api_key_here' ? 'Fast2SMS configured' : 'Dev mode (no SMS key)'}\n`);
});
