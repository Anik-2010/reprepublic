const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// EMAIL SETUP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// LOGIN ROUTE
app.post("/login", async (req, res) => {
  const { name, phone, email } = req.body;

  if (!name || !phone || !email) {
    return res.json({ success: false, message: "Missing fields" });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to REP REPUBLIC 💪",
      text: `Hi ${name},

Your account has been successfully created!

Welcome to REP REPUBLIC 🔥
Stay consistent and keep grinding 💪

- Team REP REPUBLIC`
    });

    res.json({ success: true });

  } catch (error) {
    console.log("EMAIL ERROR:", error);
    res.json({ success: false });
  }
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
