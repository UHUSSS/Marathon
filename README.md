# 🏆 Marathon CycleBack — POC

Tienda virtual donde los clientes de Marathon venden artículos deportivos originales de la marca que ya no usan. Cada artículo se valida contra el **número de factura original de Marathon Sports** y se publica con **certificado de autenticidad visible**. Marathon retiene una **comisión del 8%**; el vendedor recibe el **92%** en cupón de descuento o depósito bancario.

> POC construido con **Node.js + Express + MySQL** (sin Odoo), siguiendo página por página la *Guía Marathon CycleBack*.

## 🐳 Puesta en marcha con Docker (recomendado)

Con Docker Desktop corriendo:

```bash
docker compose up -d --build
```

Abrir **http://localhost:3000**. Eso levanta:
- `cycleback-db` — MySQL 8 con el esquema y los datos demo cargados automáticamente.
- `cycleback-app` — la aplicación Node.js.

Comandos útiles:

```bash
docker compose logs -f app     # ver logs de la aplicación
docker compose down            # detener todo (los datos persisten)
docker compose down -v         # detener y BORRAR la BD (re-seed en el próximo up)
```

> El seed solo corre en el primer arranque del volumen. Si cambias `db/seed.sql`, ejecuta `docker compose down -v && docker compose up -d --build`.

## Puesta en marcha local (alternativa sin Docker)

Requiere Node.js 18+ y MySQL/MariaDB corriendo (XAMPP: iniciar el módulo **MySQL**):

```bash
npm install        # dependencias
npm run setup      # crea la BD marathon_cycleback + datos demo
npm start          # levanta el servidor
```

> Si tu MySQL tiene contraseña u otro puerto: `DB_PASSWORD=xxx DB_PORT=3307 npm start` (variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`).

## Cuenta demo (vendedora)

| Campo | Valor |
|---|---|
| Correo | `anahy@marathon.ec` |
| Contraseña | `marathon123` |

## Las 4 páginas

1. **Inicio** — hero con propuesta de valor, barra de 4 pasos, catálogo embebido con filtros y banner CTA para vender.
2. **Catálogo** — grilla de artículos verificados con sello ✅, filtros por categoría + búsqueda, ficha con certificado de autenticidad, carrito y checkout (Servientrega o retiro en tienda).
3. **Vender** — panel del vendedor (requiere sesión): KPIs del mes, ventas recientes, publicaciones activas, publicar nuevo artículo (queda *En revisión*), cobrar saldo (cupón o depósito) y reputación.
4. **Seguimiento** — búsqueda por N° de orden (`MKT-2026-00145`), compras recientes, línea de tiempo según método de entrega, rastreo Servientrega y ubicación de tienda.

**Chatbot** flotante en todas las páginas con respuestas automáticas (FAQs en BD) y escalamiento a asesor.

## Botones "solo demo"

- **✓ Simular verificación** (panel → publicaciones en revisión): simula la validación de factura del equipo Marathon.
- **⏩ Simular siguiente etapa** (seguimiento): avanza el pedido por la línea de tiempo.

## Estructura

```
├── server.js              # Servidor Express
├── src/
│   ├── db.js              # Pool MySQL
│   └── routes/            # API: products, seller, orders, misc (auth/chat/content/stores)
├── db/
│   ├── schema.sql         # Esquema (8 tablas)
│   └── seed.sql           # Datos demo
├── scripts/setup-db.js    # npm run setup
└── public/                # SPA (HTML + CSS + JS vanilla)
```

## Datos demo destacados

- Panel de Anahy con el ejemplo exacto de la guía: **$296,00 ventas − $23,68 comisión (8%) = $272,32 de saldo**.
- Pedidos de ejemplo: `MKT-2026-00145` (Servientrega, enviado) · `MKT-2026-00132` (retiro, listo) · `MKT-2026-00118` (entregado).
- Los textos legales del footer se editan en la tabla `content` sin tocar código.

Para restaurar los datos demo en cualquier momento: `npm run setup`.
