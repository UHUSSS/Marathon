-- =====================================================
-- MARATHON CYCLEBACK — Datos demo (POC)
-- =====================================================
SET NAMES utf8mb4;
USE marathon_cycleback;

-- ---------- Usuarios ----------
INSERT INTO users (id, name, email, password, initials, is_verified_seller, bank_account_last4) VALUES
(1, 'Anahy Herrera',  'anahy@marathon.ec',  'marathon123', 'AH', 1, '4321'),
(2, 'Carlos Mendoza', 'carlos@marathon.ec', 'marathon123', 'CM', 1, '8810'),
(3, 'María Paredes',  'maria@marathon.ec',  'marathon123', 'MP', 1, '2245');

-- ---------- Tiendas físicas Marathon ----------
INSERT INTO stores (id, name, city, address, hours, maps_url) VALUES
(1, 'Marathon Quicentro Shopping', 'Quito',     'Av. Naciones Unidas y Av. 6 de Diciembre, Quicentro Shopping, planta baja', 'Lun–Dom 10:00–20:00', 'https://www.google.com/maps/search/?api=1&query=Marathon+Sports+Quicentro+Shopping+Quito'),
(2, 'Marathon Mall del Sol',       'Guayaquil', 'Av. Juan Tanca Marengo y Joaquín Orrantia, Mall del Sol, planta alta',       'Lun–Dom 10:00–21:00', 'https://www.google.com/maps/search/?api=1&query=Marathon+Sports+Mall+del+Sol+Guayaquil'),
(3, 'Marathon San Marino',         'Guayaquil', 'Av. Francisco de Orellana, C.C. San Marino Shopping, piso 1',                'Lun–Dom 10:00–20:30', 'https://www.google.com/maps/search/?api=1&query=Marathon+Sports+San+Marino+Guayaquil'),
(4, 'Marathon El Jardín',          'Quito',     'Av. Amazonas y Av. República, C.C. El Jardín, piso 2',                        'Lun–Sáb 10:00–20:00 · Dom 10:00–19:00', 'https://www.google.com/maps/search/?api=1&query=Marathon+Sports+El+Jardin+Quito'),
(5, 'Marathon Mall de los Andes',  'Ambato',    'Av. Atahualpa y Víctor Hugo, Mall de los Andes, planta baja',                 'Lun–Dom 10:00–20:00', 'https://www.google.com/maps/search/?api=1&query=Marathon+Sports+Mall+de+los+Andes+Ambato');

-- ---------- Productos en catálogo (verificados, con fotos reales) ----------
INSERT INTO products (id, seller_id, name, category, size, condition_state, description, price, invoice_number, status, verification_code, verified_at, featured, icon, photos, views_today) VALUES
(1,  2, 'Camiseta Nike Dri-FIT blanca',        'camisetas',  'M',  'Muy bueno', 'Camiseta técnica Nike Dri-FIT blanca comprada en Marathon Sports. Usada pocas veces, sin manchas ni desgaste visible.',   24.90, 'MS-2024-118273', 'verificada', 'MV-2026-0181', NOW() - INTERVAL 12 DAY, 1, '👕', '["img/products/tee-white.jpg","img/products/tee-model.jpg"]', 45),
(2,  2, 'Zapatillas Nike Air rojas',           'calzado',    '42', 'Muy bueno', 'Zapatillas Nike Air rojas compradas en Marathon Sports. Suela con 90% de vida útil, amortiguación intacta.',              78.50, 'MS-2024-104551', 'verificada', 'MV-2026-0164', NOW() - INTERVAL 20 DAY, 1, '👟', '["img/products/shoe-red.jpg","img/products/shoe-pair.jpg"]', 62),
(3,  3, 'Licra deportiva negra',               'shorts',     'S',  'Excelente', 'Licra de entrenamiento negra tiro alto. Prácticamente nueva, usada una sola vez en el gimnasio.',                         18.90, 'MS-2025-002317', 'verificada', 'MV-2026-0190', NOW() - INTERVAL 9 DAY,  0, '🩳', '["img/products/shorts-3.jpg","img/products/leggings-1.jpg"]', 23),
(4,  3, 'Mochila Nike Brasilia',               'accesorios', 'Única', 'Muy bueno', 'Mochila deportiva Nike Brasilia de 24L. Cierres en perfecto estado, ideal para gimnasio.',                             24.50, 'MS-2024-097022', 'verificada', 'MV-2026-0157', NOW() - INTERVAL 25 DAY, 0, '🎒', '["img/products/backpack-1.jpg"]', 18),
(5,  2, 'Camiseta estampada Original',         'camisetas',  'L',  'Bueno',     'Camiseta beige con estampado azul edición Original. Con uso, pero en buen estado general.',                               29.90, 'MS-2023-211940', 'verificada', 'MV-2026-0142', NOW() - INTERVAL 30 DAY, 0, '👕', '["img/products/tee-black.jpg","img/products/tee-gray.jpg"]', 31),
(6,  3, 'Zapatillas Puma Smash blancas',       'calzado',    '39', 'Excelente', 'Zapatillas Puma Smash v2 de cuero blanco. Como nuevas, apenas 2 salidas.',                                                55.00, 'MS-2025-014208', 'verificada', 'MV-2026-0195', NOW() - INTERVAL 7 DAY,  1, '👟', '["img/products/gym-shoe.jpg","img/products/shoe-white.jpg"]', 54),
(7,  2, 'Sneakers Retro multicolor',           'calzado',    '40', 'Muy bueno', 'Sneakers retro multicolor edición limitada. Tela y suela en excelente estado.',                                           65.00, 'MS-2024-155830', 'verificada', 'MV-2026-0170', NOW() - INTERVAL 15 DAY, 0, '👟', '["img/products/shoe-yellow.jpg","img/products/shoe-pair.jpg"]', 12),
(8,  3, 'Gorra deportiva vintage',             'accesorios', 'Única', 'Excelente', 'Gorra deportiva gris lavado estilo vintage. Sin uso prácticamente.',                                                    14.90, 'MS-2025-020114', 'verificada', 'MV-2026-0198', NOW() - INTERVAL 5 DAY,  0, '🧢', '["img/products/cap-1.jpg"]', 9),
(9,  2, 'Camiseta negra minimalista',          'camisetas',  'S',  'Excelente', 'Camiseta negra de algodón con estampado minimalista. Sin detalles de uso.',                                               21.90, 'MS-2025-008841', 'verificada', 'MV-2026-0187', NOW() - INTERVAL 10 DAY, 0, '👕', '["img/products/tee-gray.jpg","img/products/tee-white.jpg"]', 27),
(10, 3, 'Zapatillas Nike Air Max naranja',     'calzado',    '41', 'Muy bueno', 'Zapatillas Nike Air Max blancas con naranja para running en asfalto. Amortiguación intacta.',                             69.90, 'MS-2024-132675', 'verificada', 'MV-2026-0175', NOW() - INTERVAL 14 DAY, 0, '👟', '["img/products/shoe-street.jpg","img/products/shoe-red.jpg"]', 38),
(11, 2, 'Medias estampadas Fun Run (x2)',      'accesorios', 'M',  'Excelente', 'Pack de 2 pares de medias deportivas con estampado divertido. Un par sin estrenar.',                                      12.50, 'MS-2025-017429', 'verificada', 'MV-2026-0196', NOW() - INTERVAL 6 DAY,  0, '🧦', '["img/products/socks-1.jpg"]', 15),
(12, 3, 'Licra estampada fitness',             'shorts',     'L',  'Muy bueno', 'Licra estampada de alto rendimiento para fitness. Excelente elasticidad y estado.',                                       26.50, 'MS-2024-171203', 'verificada', 'MV-2026-0179', NOW() - INTERVAL 11 DAY, 0, '🩳', '["img/products/leggings-1.jpg","img/products/shorts-3.jpg"]', 8),

-- ---------- Publicaciones activas de Anahy (vendedora demo) ----------
(13, 1, 'Camiseta estampada Urban negra',      'camisetas',  'M',  'Excelente', 'Camiseta negra con estampado urbano, tela suave de algodón. Usada 3 veces, como nueva.',                                  24.90, 'MS-2025-031870', 'verificada', 'MV-2026-0201', NOW() - INTERVAL 4 DAY,  1, '👕', '["img/products/tee-model.jpg","img/products/tee-white.jpg"]', 34),
(14, 1, 'Zapatillas Court blancas',            'calzado',    '38', 'Muy bueno', 'Zapatillas court de cuero blanco, compradas en Marathon Quicentro. Suela impecable.',                                     49.90, 'MS-2024-129483', 'verificada', 'MV-2026-0168', NOW() - INTERVAL 18 DAY, 0, '👟', '["img/products/shoe-white.jpg","img/products/shoe-pair.jpg"]', 51),
(15, 1, 'Licra Adidas Techfit 7/8',            'shorts',     'S',  'Excelente', 'Licra de entrenamiento Adidas Techfit largo 7/8, tiro alto. Sin transparencias, perfecto estado.',                        26.50, 'MS-2025-029741', 'verificada', 'MV-2026-0199', NOW() - INTERVAL 5 DAY,  0, '🩳', '["img/products/leggings-1.jpg","img/products/shorts-3.jpg"]', 22),
(16, 1, 'Bolso deportivo outdoor',             'accesorios', 'Única', 'Muy bueno', 'Bolso deportivo outdoor azul con correas ajustables. Ideal para entrenar al aire libre.',                              13.90, 'MS-2025-033012', 'en_revision', NULL, NULL, 0, '👜', '["img/products/waistbag-1.jpg","img/products/backpack-1.jpg"]', 6),

-- ---------- Productos ya vendidos de Anahy (historial de ventas) ----------
(17, 1, 'Camiseta Training Dry-Fit',           'camisetas',  'M',  'Muy bueno', 'Camiseta de entrenamiento blanca.', 28.00, 'MS-2024-144302', 'vendido', 'MV-2026-0135', NOW() - INTERVAL 45 DAY, 0, '👕', '["img/products/tee-white.jpg"]', 0),
(18, 1, 'Zapatillas Runner Pro',               'calzado',    '38', 'Muy bueno', 'Zapatillas de running.',     95.00, 'MS-2024-101877', 'vendido', 'MV-2026-0128', NOW() - INTERVAL 50 DAY, 0, '👟', '["img/products/shoe-blue.jpg"]', 0),
(19, 1, 'Licra Running Flex',                  'shorts',     'S',  'Excelente', 'Licra de competencia.',      22.00, 'MS-2025-004190', 'vendido', 'MV-2026-0148', NOW() - INTERVAL 35 DAY, 0, '🩳', '["img/products/shorts-3.jpg"]', 0),
(20, 1, 'Camiseta gráfica beige',              'camisetas',  'M',  'Muy bueno', 'Camiseta beige con estampado.', 54.00, 'MS-2024-167534', 'vendido', 'MV-2026-0151', NOW() - INTERVAL 33 DAY, 0, '👕', '["img/products/tee-black.jpg"]', 0),
(21, 1, 'Camiseta casual negra',               'camisetas',  'L',  'Bueno',     'Camiseta casual de algodón.', 35.00, 'MS-2023-198265', 'vendido', 'MV-2026-0139', NOW() - INTERVAL 40 DAY, 0, '👕', '["img/products/tee-gray.jpg"]', 0),
(22, 1, 'Mochila deportiva Pro',               'accesorios', 'Única', 'Excelente', 'Mochila outdoor 30L.',    90.00, 'MS-2025-011098', 'vendido', 'MV-2026-0154', NOW() - INTERVAL 31 DAY, 0, '🎒', '["img/products/waistbag-1.jpg"]', 0),
-- Ventas del mes anterior (para la comparación de KPIs)
(23, 1, 'Camiseta urbana negra',               'camisetas',  'M',  'Bueno',     'Camiseta urbana estampada.', 30.00, 'MS-2023-220481', 'vendido', 'MV-2026-0101', NOW() - INTERVAL 70 DAY, 0, '👕', '["img/products/tee-model.jpg"]', 0),
(24, 1, 'Zapatillas Running blancas',          'calzado',    '38', 'Muy bueno', 'Zapatillas de running blancas.', 80.00, 'MS-2024-092216', 'vendido', 'MV-2026-0097', NOW() - INTERVAL 75 DAY, 0, '👟', '["img/products/shoe-pair.jpg"]', 0),
(25, 1, 'Licra CrossTraining',                 'shorts',     'S',  'Muy bueno', 'Licra de crossfit.',         25.00, 'MS-2024-160092', 'vendido', 'MV-2026-0104', NOW() - INTERVAL 72 DAY, 0, '🩳', '["img/products/leggings-1.jpg"]', 0),
(26, 1, 'Gorra Running UV',                    'accesorios', 'Única', 'Excelente', 'Gorra con protección UV.', 15.00, 'MS-2025-001764', 'vendido', 'MV-2026-0110', NOW() - INTERVAL 68 DAY, 0, '🧢', '["img/products/cap-1.jpg"]', 0);

-- ---------- Pedidos demo (compras de Anahy como compradora) ----------
INSERT INTO orders (id, order_number, buyer_id, buyer_name, total, payment_method, delivery_method, delivery_address, store_id, tracking_guide, estimated_delivery, status, delivered_at, created_at) VALUES
(1, 'MKT-2026-00145', 1, 'Anahy Herrera', 78.50, 'tarjeta',       'servientrega', 'Av. de los Shyris N34-120 y Holanda, Quito', NULL, 'SE-778812345', CURDATE() + INTERVAL 2 DAY, 'enviado',      NULL,                     NOW() - INTERVAL 3 DAY),
(2, 'MKT-2026-00132', 1, 'Anahy Herrera', 18.90, 'transferencia', 'retiro',       NULL, 1, NULL, NULL,                                                                              'listo_retiro', NULL,                     NOW() - INTERVAL 5 DAY),
(3, 'MKT-2026-00118', 1, 'Anahy Herrera', 24.50, 'tarjeta',       'servientrega', 'Av. de los Shyris N34-120 y Holanda, Quito', NULL, 'SE-771198022', NULL,                        'entregado',    NOW() - INTERVAL 8 DAY,   NOW() - INTERVAL 12 DAY);

INSERT INTO order_items (order_id, product_id, seller_id, price, commission, seller_amount, payout_status, sold_at) VALUES
(1, 2, 2, 78.50, 6.28, 72.22, 'pendiente', NOW() - INTERVAL 3 DAY),
(2, 3, 3, 18.90, 1.51, 17.39, 'pendiente', NOW() - INTERVAL 5 DAY),
(3, 4, 3, 24.50, 1.96, 22.54, 'cobrado',   NOW() - INTERVAL 12 DAY);

-- ---------- Ventas de Anahy (este mes: 6 ventas, $324 brutos → 5 pendientes = $296.00) ----------
INSERT INTO orders (id, order_number, buyer_id, buyer_name, total, payment_method, delivery_method, delivery_address, store_id, tracking_guide, status, delivered_at, created_at) VALUES
(4, 'MKT-2026-00098', 2, 'Carlos Mendoza', 28.00, 'tarjeta',       'servientrega', 'Av. República del Salvador, Quito',  NULL, 'SE-770045611', 'entregado', DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 4 DAY, DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 1 DAY),
(5, 'MKT-2026-00104', 3, 'María Paredes',  95.00, 'tarjeta',       'servientrega', 'Cdla. Kennedy Norte, Guayaquil',     NULL, 'SE-770098123', 'entregado', DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 6 DAY, DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 3 DAY),
(6, 'MKT-2026-00107', 2, 'Carlos Mendoza', 22.00, 'transferencia', 'retiro',       NULL, 2, NULL,                        'retirado',  DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 7 DAY, DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 4 DAY),
(7, 'MKT-2026-00110', 3, 'María Paredes',  54.00, 'tarjeta',       'servientrega', 'Av. 9 de Octubre, Guayaquil',        NULL, 'SE-770112894', 'entregado', DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 9 DAY, DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 6 DAY),
(8, 'MKT-2026-00114', 2, 'Carlos Mendoza', 35.00, 'tarjeta',       'retiro',       NULL, 4, NULL,                        'retirado',  DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 10 DAY, DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 8 DAY),
(9, 'MKT-2026-00121', 3, 'María Paredes',  90.00, 'transferencia', 'servientrega', 'Urdesa Central, Guayaquil',          NULL, 'SE-770156730', 'entregado', DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 12 DAY, DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 9 DAY),
-- Ventas de Anahy el mes anterior (4 ventas, $150 brutos, ya cobradas)
(10, 'MKT-2026-00061', 2, 'Carlos Mendoza', 30.00, 'tarjeta',       'servientrega', 'Av. República del Salvador, Quito', NULL, 'SE-769871002', 'entregado', DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 20 DAY), DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 24 DAY)),
(11, 'MKT-2026-00064', 3, 'María Paredes',  80.00, 'tarjeta',       'retiro',       NULL, 3, NULL,                       'retirado',  DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 18 DAY), DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 21 DAY)),
(12, 'MKT-2026-00070', 2, 'Carlos Mendoza', 25.00, 'transferencia', 'servientrega', 'La Carolina, Quito',                NULL, 'SE-769910453', 'entregado', DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 14 DAY), DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 17 DAY)),
(13, 'MKT-2026-00075', 3, 'María Paredes',  15.00, 'tarjeta',       'retiro',       NULL, 1, NULL,                       'retirado',  DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 10 DAY), DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 12 DAY));

INSERT INTO order_items (order_id, product_id, seller_id, price, commission, seller_amount, payout_status, sold_at) VALUES
-- Este mes: 1 cobrada + 5 pendientes ($296.00 → saldo $272.32 tras comisión 8%)
(4,  17, 1, 28.00, 2.24, 25.76, 'cobrado',   DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 1 DAY),
(5,  18, 1, 95.00, 7.60, 87.40, 'pendiente', DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 3 DAY),
(6,  19, 1, 22.00, 1.76, 20.24, 'pendiente', DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 4 DAY),
(7,  20, 1, 54.00, 4.32, 49.68, 'pendiente', DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 6 DAY),
(8,  21, 1, 35.00, 2.80, 32.20, 'pendiente', DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 8 DAY),
(9,  22, 1, 90.00, 7.20, 82.80, 'pendiente', DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 9 DAY),
-- Mes anterior (todas cobradas)
(10, 23, 1, 30.00, 2.40, 27.60, 'cobrado', DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 24 DAY)),
(11, 24, 1, 80.00, 6.40, 73.60, 'cobrado', DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 21 DAY)),
(12, 25, 1, 25.00, 2.00, 23.00, 'cobrado', DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 17 DAY)),
(13, 26, 1, 15.00, 1.20, 13.80, 'cobrado', DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 12 DAY));

-- Cobro anterior de Anahy (mes pasado)
INSERT INTO payouts (seller_id, amount, method, coupon_code, status, created_at) VALUES
(1, 138.00, 'deposito', NULL, 'procesado', DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 8 DAY)),
(1, 25.76,  'cupon', 'MCB-CUP-88213', 'procesado', DATE_FORMAT(NOW(),'%Y-%m-01') + INTERVAL 2 DAY);

-- ---------- Reseñas de Anahy (24 reseñas, promedio 4.8) ----------
INSERT INTO reviews (seller_id, rating, tag) VALUES
(1,5,'Entrega rápida'),(1,5,'Producto como descrito'),(1,5,'Buen empaque'),(1,5,'Entrega rápida'),
(1,5,'Producto como descrito'),(1,5,'Producto como descrito'),(1,5,'Entrega rápida'),(1,5,'Buen empaque'),
(1,5,'Producto como descrito'),(1,5,'Entrega rápida'),(1,5,'Producto como descrito'),(1,5,'Buen empaque'),
(1,5,'Entrega rápida'),(1,5,'Producto como descrito'),(1,5,'Entrega rápida'),(1,5,'Producto como descrito'),
(1,5,'Buen empaque'),(1,5,'Producto como descrito'),(1,5,'Entrega rápida'),(1,5,'Producto como descrito'),
(1,4,'Entrega rápida'),(1,4,'Buen empaque'),(1,4,'Producto como descrito'),(1,3,'Entrega rápida');

-- ---------- FAQs del chatbot (textos exactos de la guía) ----------
INSERT INTO faqs (question, keywords, answer) VALUES
('¿Cómo vendo mi producto?', 'vender,vendo,publicar,publico,como vendo', 'Ve a la sección ''Vender'', pulsa ''+ Publicar nuevo artículo'' y completa el formulario con fotos, talla, estado y el número de tu factura original Marathon. Nuestro equipo valida la autenticidad en menos de 24 horas.'),
('¿Cuál es la comisión de Marathon?', 'comision,comisión,porcentaje,cobran,8%', 'Marathon cobra una comisión del 8% sobre el precio de venta. Tú recibes el 92% restante en cupón de descuento o depósito bancario, como prefieras.'),
('¿Cómo verifican la autenticidad?', 'autenticidad,verifican,verificacion,verificación,original,factura,certificado', 'Cada artículo se valida con el número de factura original de Marathon Sports antes de publicarse. Solo los artículos aprobados muestran el sello ''✅ Autenticidad verificada'' en el catálogo.'),
('¿Cómo funciona el envío?', 'envio,envío,servientrega,entrega,domicilio,enviar', 'Puedes elegir envío a domicilio con Servientrega a nivel nacional, o retirar tu compra sin costo en cualquier tienda física Marathon.'),
('¿Cómo hago seguimiento de mi pedido?', 'seguimiento,rastrear,pedido,orden,donde esta,dónde está,track', 'Ingresa a la sección ''Seguimiento'', escribe tu número de orden o revisa ''Mis compras recientes'' para ver en qué etapa está tu artículo.'),
('¿Cómo cobro el dinero de mi venta?', 'cobro,cobrar,dinero,pago,saldo,deposito,depósito,cupon,cupón', 'En tu panel ''Vender'', en la sección ''Cobrar saldo'', elige si quieres un cupón de descuento Marathon (disponible al instante) o un depósito bancario (3 a 5 días hábiles).'),
('¿Cuánto tiempo tarda la verificación?', 'cuanto tarda,cuánto tarda,tiempo,demora,24 horas,validacion,validación', 'La validación de la factura toma normalmente menos de 24 horas hábiles.'),
('¿Puedo vender ropa que no sea de Marathon?', 'otra marca,no sea de marathon,otras marcas,nike,adidas comprada afuera', 'No. La plataforma solo acepta artículos deportivos originales de Marathon Sports respaldados por su factura de compra.');

-- ---------- Contenido editable (modales del footer, textos exactos) ----------
INSERT INTO content (content_key, title, body) VALUES
('terminos', 'Términos y condiciones', 'Al usar Marathon CycleBack Verificados, aceptas que todos los productos deben contar con factura original de Marathon Sports. La comisión del 8% se descuenta automáticamente de cada venta completada.'),
('privacidad', 'Política de privacidad', 'Tu información personal es protegida y usada únicamente para procesar ventas y pagos. No compartimos tus datos con terceros sin tu consentimiento.'),
('contacto', 'Contacto', 'Escríbenos en Instagram @MarathonCycleBackc o al cycleback@marathonsports.com.ec. Tiempo de respuesta: máximo 24 horas hábiles.'),
('instagram', 'Instagram', 'Síguenos en @MarathonCycleBackc para ver los productos más recientes y novedades de la plataforma.');
