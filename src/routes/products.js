const express = require('express');
const db = require('../db');
const router = express.Router();

// Catálogo público: solo artículos verificados
router.get('/', async (req, res, next) => {
  try {
    const { category, q } = req.query;
    let sql = `SELECT p.id, p.name, p.category, p.size, p.condition_state, p.price,
                      p.featured, p.icon, p.photos, p.verification_code, p.verified_at,
                      u.name AS seller_name
               FROM products p JOIN users u ON u.id = p.seller_id
               WHERE p.status = 'verificada'`;
    const params = [];
    if (category && category !== 'todo') { sql += ' AND p.category = ?'; params.push(category); }
    if (q) { sql += ' AND p.name LIKE ?'; params.push(`%${q}%`); }
    sql += ' ORDER BY p.featured DESC, p.verified_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows.map(r => ({ ...r, photos: r.photos ? JSON.parse(r.photos) : [] })));
  } catch (e) { next(e); }
});

// Ficha ampliada con certificado de autenticidad
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name AS seller_name FROM products p
       JOIN users u ON u.id = p.seller_id WHERE p.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    const p = rows[0];
    p.photos = p.photos ? JSON.parse(p.photos) : [];
    // contar la vista del día
    db.query('UPDATE products SET views_today = views_today + 1 WHERE id = ?', [p.id]).catch(() => {});
    res.json(p);
  } catch (e) { next(e); }
});

// Publicar nuevo artículo → queda 'En revisión' hasta validar la factura
router.post('/', async (req, res, next) => {
  try {
    const { sellerId, name, category, size, condition, description, price, invoice, photos } = req.body;
    if (!sellerId || !name || !category || !size || !condition || !price || !invoice) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios, incluido el N° de factura Marathon.' });
    }
    if (!Array.isArray(photos) || photos.length < 2 || photos.length > 6) {
      return res.status(400).json({ error: 'Debes subir mínimo 2 y máximo 6 fotografías del artículo.' });
    }
    const icons = { camisetas: '👕', calzado: '👟', shorts: '🩳', accesorios: '🎒' };
    const [result] = await db.query(
      `INSERT INTO products (seller_id, name, category, size, condition_state, description, price, invoice_number, status, icon, photos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en_revision', ?, ?)`,
      [sellerId, name, category, size, condition, description || '', price, invoice, icons[category] || '🏷️', JSON.stringify(photos)]);
    res.status(201).json({ id: result.insertId, status: 'en_revision',
      message: 'Tu artículo fue enviado a revisión. Marathon validará la factura en menos de 24 horas.' });
  } catch (e) { next(e); }
});

// [DEMO] Simula la aprobación del equipo Marathon: valida la factura y publica el artículo
router.post('/:id/verify', async (req, res, next) => {
  try {
    const code = 'MV-2026-' + String(Math.floor(1000 + Math.random() * 9000));
    const [r] = await db.query(
      `UPDATE products SET status = 'verificada', verification_code = ?, verified_at = NOW()
       WHERE id = ? AND status = 'en_revision'`, [code, req.params.id]);
    if (!r.affectedRows) return res.status(400).json({ error: 'El artículo no está en revisión.' });
    res.json({ verification_code: code, message: 'Artículo verificado y publicado en el catálogo con el sello ✅ Autenticidad verificada.' });
  } catch (e) { next(e); }
});

module.exports = router;
