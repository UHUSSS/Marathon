const express = require('express');
const db = require('../db');
const router = express.Router();

const COMMISSION_RATE = 0.08; // comisión Marathon 8%

// Etapas de la línea de tiempo según método de entrega
const FLOW = {
  servientrega: ['confirmado', 'preparando', 'enviado', 'entregado'],
  retiro: ['confirmado', 'preparando', 'listo_retiro', 'retirado'],
};

// Checkout: crea el pedido, genera N° de orden + guía y registra la venta con comisión 8%
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { buyerId, buyerName, productIds, paymentMethod, deliveryMethod, address, storeId,
            cardNumber, cardName, cardExpiry, cardCvv } = req.body;
    if (!Array.isArray(productIds) || !productIds.length) return res.status(400).json({ error: 'El carrito está vacío.' });
    if (!['tarjeta', 'transferencia'].includes(paymentMethod)) return res.status(400).json({ error: 'Selecciona un método de pago.' });
    if (deliveryMethod === 'servientrega' && !address) return res.status(400).json({ error: 'Ingresa la dirección de envío.' });
    if (deliveryMethod === 'retiro' && !storeId) return res.status(400).json({ error: 'Selecciona la tienda de retiro.' });
    // Validación de datos de tarjeta (POC: no se almacenan)
    if (paymentMethod === 'tarjeta') {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv)
        return res.status(400).json({ error: 'Completa todos los datos de la tarjeta.' });
      const num = String(cardNumber).replace(/\D/g, '');
      if (num.length < 13 || num.length > 16)
        return res.status(400).json({ error: 'El número de tarjeta no es válido.' });
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry))
        return res.status(400).json({ error: 'La fecha de vencimiento no es válida (MM/AA).' });
      if (String(cardCvv).length < 3 || String(cardCvv).length > 4)
        return res.status(400).json({ error: 'El CVV no es válido.' });
    }

    await conn.beginTransaction();
    const [products] = await conn.query(
      `SELECT id, seller_id, price FROM products WHERE id IN (?) AND status = 'verificada' FOR UPDATE`, [productIds]);
    if (products.length !== productIds.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'Uno de los artículos ya no está disponible (cada publicación tiene 1 sola unidad).' });
    }

    const total = products.reduce((s, p) => s + Number(p.price), 0);
    // N° de orden secuencial único: MKT-2026-00XXX
    const [[{ maxId }]] = await conn.query('SELECT COALESCE(MAX(id),0) AS maxId FROM orders');
    const orderNumber = `MKT-${new Date().getFullYear()}-${String(maxId + 1 + 145).padStart(5, '0')}`;
    const trackingGuide = deliveryMethod === 'servientrega' ? 'SE-77' + String(Math.floor(1000000 + Math.random() * 9000000)) : null;

    const [result] = await conn.query(
      `INSERT INTO orders (order_number, buyer_id, buyer_name, total, payment_method, delivery_method,
                           delivery_address, store_id, tracking_guide, estimated_delivery, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE() + INTERVAL 3 DAY, 'confirmado')`,
      [orderNumber, buyerId || null, buyerName || 'Invitado', total, paymentMethod, deliveryMethod,
       address || null, storeId || null, trackingGuide]);

    for (const p of products) {
      const commission = Math.round(p.price * COMMISSION_RATE * 100) / 100;
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, price, commission, seller_amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [result.insertId, p.id, p.seller_id, p.price, commission, Math.round((p.price - commission) * 100) / 100]);
      await conn.query(`UPDATE products SET status = 'vendido' WHERE id = ?`, [p.id]);
    }
    await conn.commit();
    res.status(201).json({ orderNumber, trackingGuide, total,
      message: `¡Compra confirmada! Tu número de seguimiento es ${orderNumber}.` });
  } catch (e) { await conn.rollback(); next(e); }
  finally { conn.release(); }
});

// Mis compras recientes (usuario con sesión iniciada)
router.get('/mine', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT o.order_number, o.total, o.status, o.delivery_method, o.created_at,
              (SELECT p.name FROM order_items oi JOIN products p ON p.id = oi.product_id
               WHERE oi.order_id = o.id LIMIT 1) AS product_name,
              (SELECT p.icon FROM order_items oi JOIN products p ON p.id = oi.product_id
               WHERE oi.order_id = o.id LIMIT 1) AS icon,
              (SELECT p.photos FROM order_items oi JOIN products p ON p.id = oi.product_id
               WHERE oi.order_id = o.id LIMIT 1) AS photos
       FROM orders o WHERE o.buyer_id = ? ORDER BY o.created_at DESC LIMIT 10`, [Number(req.query.userId || 1)]);
    res.json(rows.map(r => ({ ...r, photo: r.photos ? JSON.parse(r.photos)[0] : null, photos: undefined })));
  } catch (e) { next(e); }
});

// Seguimiento por número de orden
router.get('/track/:orderNumber', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, s.name AS store_name, s.address AS store_address, s.hours AS store_hours, s.maps_url AS store_maps
       FROM orders o LEFT JOIN stores s ON s.id = o.store_id
       WHERE o.order_number = ?`, [req.params.orderNumber.trim().toUpperCase()]);
    if (!rows.length) return res.status(404).json({ error: 'No encontramos un pedido con ese número. Verifica e intenta de nuevo.' });
    const order = rows[0];
    const [itemsRaw] = await db.query(
      `SELECT p.name, p.icon, p.size, p.photos, oi.price FROM order_items oi
       JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`, [order.id]);
    const items = itemsRaw.map(i => ({ ...i, photo: i.photos ? JSON.parse(i.photos)[0] : null, photos: undefined }));
    const flow = FLOW[order.delivery_method];
    res.json({ ...order, items, flow, currentStep: flow.indexOf(order.status) });
  } catch (e) { next(e); }
});

// [DEMO] Avanza el pedido a la siguiente etapa para mostrar la línea de tiempo en vivo
router.post('/track/:orderNumber/advance', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, status, delivery_method FROM orders WHERE order_number = ?',
      [req.params.orderNumber.trim().toUpperCase()]);
    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    const order = rows[0];
    const flow = FLOW[order.delivery_method];
    const idx = flow.indexOf(order.status);
    if (idx >= flow.length - 1) return res.status(400).json({ error: 'El pedido ya fue entregado.' });
    const nextStatus = flow[idx + 1];
    const delivered = idx + 1 === flow.length - 1;
    await db.query('UPDATE orders SET status = ?, delivered_at = IF(?, NOW(), delivered_at) WHERE id = ?',
      [nextStatus, delivered, order.id]);
    res.json({ status: nextStatus });
  } catch (e) { next(e); }
});

module.exports = router;
