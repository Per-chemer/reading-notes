const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const pool = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [normalizedEmail, passwordHash],
    );

    const user = created.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: "Register failed.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const result = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [
      normalizedEmail,
    ]);
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
});

router.get("/me", authRequired, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
