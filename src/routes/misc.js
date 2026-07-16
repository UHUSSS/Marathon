const express = require('express');
const db = require('../db');
const router = express.Router();

// Login simple del POC
router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query(
      'SELECT id, name, email, initials, is_verified_seller, bank_account_last4 FROM users WHERE email = ? AND password = ?',
      [email, password]);
    if (!rows.length) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// Chatbot: matching por palabras clave contra las FAQs almacenadas
router.post('/chat', async (req, res, next) => {
  try {
    const message = String(req.body.message || '').toLowerCase().trim();
    const [faqs] = await db.query('SELECT question, keywords, answer FROM faqs');
    let best = null, bestScore = 0;
    for (const f of faqs) {
      const score = f.keywords.split(',').reduce((s, kw) => s + (message.includes(kw.trim().toLowerCase()) ? kw.trim().length : 0), 0);
      if (score > bestScore) { bestScore = score; best = f; }
    }
    if (best) return res.json({ matched: true, answer: best.answer });
    res.json({
      matched: false,
      answer: 'No tengo una respuesta exacta para eso, pero puedo conectarte con un asesor humano.',
      escalate: true,
    });
  } catch (e) { next(e); }
});

// Preguntas frecuentes (botones de respuesta rápida)
router.get('/faqs', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, question, answer FROM faqs');
    res.json(rows);
  } catch (e) { next(e); }
});

// Contenido editable del footer (Términos / Privacidad / Contacto / Instagram)
router.get('/content', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT content_key, title, body FROM content');
    res.json(Object.fromEntries(rows.map(r => [r.content_key, { title: r.title, body: r.body }])));
  } catch (e) { next(e); }
});

// Tiendas físicas Marathon
router.get('/stores', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM stores ORDER BY city, name');
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
