const express = require('express');
const db = require('../db');
const router = express.Router();

// Panel del vendedor: KPIs, ventas recientes, publicaciones, saldo y reputación
router.get('/dashboard', async (req, res, next) => {
  try {
    const sellerId = Number(req.query.userId || 1);

    const [[user]] = await db.query(
      'SELECT id, name, initials, is_verified_seller, bank_account_last4 FROM users WHERE id = ?', [sellerId]);
    if (!user) return res.status(404).json({ error: 'Vendedor no encontrado' });

    // KPIs del mes en curso vs mes anterior
    const [[cur]] = await db.query(
      `SELECT COUNT(*) AS sales, COALESCE(SUM(price),0) AS gross, COALESCE(SUM(commission),0) AS commission
       FROM order_items WHERE seller_id = ?
         AND YEAR(sold_at) = YEAR(NOW()) AND MONTH(sold_at) = MONTH(NOW())`, [sellerId]);
    const [[prev]] = await db.query(
      `SELECT COUNT(*) AS sales, COALESCE(SUM(price),0) AS gross
       FROM order_items WHERE seller_id = ?
         AND YEAR(sold_at) = YEAR(NOW() - INTERVAL 1 MONTH) AND MONTH(sold_at) = MONTH(NOW() - INTERVAL 1 MONTH)`, [sellerId]);

    // Saldo disponible = ventas pendientes de cobro (92% ya descontada la comisión)
    const [[balance]] = await db.query(
      `SELECT COALESCE(SUM(price),0) AS gross, COALESCE(SUM(commission),0) AS commission,
              COALESCE(SUM(seller_amount),0) AS available, COUNT(*) AS pending_sales
       FROM order_items WHERE seller_id = ? AND payout_status = 'pendiente'`, [sellerId]);

    // Ventas recientes (con estado de cobro)
    const [recentSalesRaw] = await db.query(
      `SELECT oi.id, p.name, p.size, p.icon, p.photos, oi.price, oi.payout_status, oi.sold_at
       FROM order_items oi JOIN products p ON p.id = oi.product_id
       WHERE oi.seller_id = ? ORDER BY oi.sold_at DESC LIMIT 20`, [sellerId]);
    const recentSales = recentSalesRaw.map(r => ({ ...r, photo: r.photos ? JSON.parse(r.photos)[0] : null, photos: undefined }));

    // Publicaciones activas (verificadas o en revisión)
    const [publicationsRaw] = await db.query(
      `SELECT id, name, size, price, icon, photos, status, views_today
       FROM products WHERE seller_id = ? AND status IN ('verificada','en_revision')
       ORDER BY created_at DESC`, [sellerId]);
    const publications = publicationsRaw.map(r => ({ ...r, photo: r.photos ? JSON.parse(r.photos)[0] : null, photos: undefined }));

    // Reputación: promedio + pills generadas contando las etiquetas de las reseñas
    const [[rep]] = await db.query(
      'SELECT COALESCE(AVG(rating),0) AS avg_rating, COUNT(*) AS total FROM reviews WHERE seller_id = ?', [sellerId]);
    const [tags] = await db.query(
      `SELECT tag, COUNT(*) AS count FROM reviews WHERE seller_id = ?
       GROUP BY tag ORDER BY count DESC`, [sellerId]);

    res.json({
      user,
      kpis: {
        salesMonth: cur.sales, salesPrevMonth: prev.sales,
        grossMonth: cur.gross, grossPrevMonth: prev.gross,
        commissionMonth: cur.commission,
      },
      balance,
      recentSales,
      publications,
      reputation: { average: Number(rep.avg_rating).toFixed(1), total: rep.total, tags },
    });
  } catch (e) { next(e); }
});

// Cobrar saldo: cupón Marathon (inmediato) o depósito bancario (3–5 días hábiles)
router.post('/payout', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { userId, method } = req.body; // method: 'cupon' | 'deposito'
    if (!['cupon', 'deposito'].includes(method)) return res.status(400).json({ error: 'Método de cobro inválido.' });
    await conn.beginTransaction();
    const [[bal]] = await conn.query(
      `SELECT COALESCE(SUM(seller_amount),0) AS available FROM order_items
       WHERE seller_id = ? AND payout_status = 'pendiente' FOR UPDATE`, [userId]);
    if (bal.available <= 0) { await conn.rollback(); return res.status(400).json({ error: 'No tienes saldo disponible para cobrar.' }); }

    const couponCode = method === 'cupon' ? 'MCB-CUP-' + String(Math.floor(10000 + Math.random() * 90000)) : null;
    await conn.query(
      `INSERT INTO payouts (seller_id, amount, method, coupon_code, status) VALUES (?, ?, ?, ?, ?)`,
      [userId, bal.available, method, couponCode, method === 'cupon' ? 'procesado' : 'en_proceso']);
    await conn.query(
      `UPDATE order_items SET payout_status = 'cobrado' WHERE seller_id = ? AND payout_status = 'pendiente'`, [userId]);
    await conn.commit();

    const amount = bal.available.toFixed(2);
    res.json({
      amount, method, couponCode,
      message: method === 'cupon'
        ? `🎟️ ¡Cupón de $${amount.replace('.', ',')} generado! Revisa tu correo.`
        : '🏦 Solicitud enviada. Recibirás tu depósito en 3–5 días hábiles.',
    });
  } catch (e) { await conn.rollback(); next(e); }
  finally { conn.release(); }
});

module.exports = router;
