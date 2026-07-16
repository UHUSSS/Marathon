-- =====================================================
-- MARATHON CYCLEBACK — Esquema de base de datos (MySQL/MariaDB)
-- =====================================================
SET NAMES utf8mb4;
DROP DATABASE IF EXISTS marathon_cycleback;
CREATE DATABASE marathon_cycleback CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE marathon_cycleback;

-- Usuarios (vendedores / compradores)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(120) NOT NULL DEFAULT 'marathon123',
  initials VARCHAR(4) NOT NULL,
  is_verified_seller TINYINT(1) NOT NULL DEFAULT 0,
  bank_account_last4 VARCHAR(4) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Productos publicados
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  category ENUM('camisetas','calzado','shorts','accesorios') NOT NULL,
  size VARCHAR(20) NOT NULL,
  condition_state ENUM('Excelente','Muy bueno','Bueno') NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  invoice_number VARCHAR(40) NOT NULL,
  status ENUM('en_revision','verificada','vendido','rechazada') NOT NULL DEFAULT 'en_revision',
  verification_code VARCHAR(30) DEFAULT NULL,
  verified_at DATETIME DEFAULT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,          -- insignia 'Más buscado'
  icon VARCHAR(8) NOT NULL DEFAULT '👕',
  photos LONGTEXT,                                  -- JSON array de dataURLs (fotos del vendedor)
  views_today INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Tiendas físicas Marathon
CREATE TABLE stores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  address VARCHAR(220) NOT NULL,
  hours VARCHAR(120) NOT NULL,
  maps_url VARCHAR(300) NOT NULL
);

-- Pedidos (compras)
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,        -- Ej. MKT-2026-00145
  buyer_id INT DEFAULT NULL,
  buyer_name VARCHAR(120) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method ENUM('tarjeta','transferencia') NOT NULL,
  delivery_method ENUM('servientrega','retiro') NOT NULL,
  delivery_address VARCHAR(250) DEFAULT NULL,
  store_id INT DEFAULT NULL,
  tracking_guide VARCHAR(30) DEFAULT NULL,         -- N° de guía Servientrega
  estimated_delivery DATE DEFAULT NULL,
  status ENUM('confirmado','preparando','enviado','listo_retiro','entregado','retirado') NOT NULL DEFAULT 'confirmado',
  delivered_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Ítems del pedido → generan la venta del vendedor con comisión 8%
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  seller_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,               -- 8% del precio
  seller_amount DECIMAL(10,2) NOT NULL,            -- 92% del precio
  payout_status ENUM('pendiente','cobrado') NOT NULL DEFAULT 'pendiente',
  sold_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Cobros del vendedor (cupón o depósito)
CREATE TABLE payouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('cupon','deposito') NOT NULL,
  coupon_code VARCHAR(30) DEFAULT NULL,
  status ENUM('procesado','en_proceso') NOT NULL DEFAULT 'procesado',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Reseñas de compradores → reputación del vendedor
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  rating TINYINT NOT NULL,
  tag VARCHAR(60) NOT NULL,                        -- palabra clave contada para las 'pills'
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Preguntas frecuentes del chatbot
CREATE TABLE faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(200) NOT NULL,
  keywords VARCHAR(300) NOT NULL,                  -- palabras clave separadas por coma para el matching
  answer TEXT NOT NULL
);

-- Contenido editable (textos legales del footer) — editable desde backend sin tocar código
CREATE TABLE content (
  content_key VARCHAR(40) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  body TEXT NOT NULL
);
