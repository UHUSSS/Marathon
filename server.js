// =====================================================
// MARATHON CYCLEBACK — Servidor (POC Node.js + Express + MySQL)
// =====================================================
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' })); // fotos del artículo en base64
app.use(express.static(path.join(__dirname, 'public')));

// API
app.use('/api/products', require('./src/routes/products'));
app.use('/api/seller', require('./src/routes/seller'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api', require('./src/routes/misc'));

// SPA: cualquier otra ruta sirve el index
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✔ Marathon CycleBack corriendo en http://localhost:${PORT}`);
});
