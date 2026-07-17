/* =====================================================
   MARATHON CYCLEBACK — SPA (POC)
   4 páginas: Inicio · Catálogo · Vender · Seguimiento
   ===================================================== */
'use strict';

// ---------------- Estado global ----------------
const state = {
  session: JSON.parse(localStorage.getItem('mcb_session') || 'null'),
  cart: JSON.parse(localStorage.getItem('mcb_cart') || '[]'),
  content: null,          // textos legales (editables desde la BD)
  stores: [],
  payoutMethod: 'cupon',
  chatFirstOpen: true,
  searchQuery: '',
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const money = n => '$' + Number(n).toFixed(2).replace('.', ',');
// Miniatura: foto real si existe, si no el ícono de la categoría
const thumb = (photo, icon) => photo
  ? `<span class="sale-icon"><img src="${photo}" alt="" loading="lazy"></span>`
  : `<span class="sale-icon">${icon || '📦'}</span>`;
const IMG_BG = ['img-c0', 'img-c1', 'img-c2', 'img-c3'];
const CAT_BG = { camisetas: 0, calzado: 1, shorts: 2, accesorios: 3 };

async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error de conexión');
  return data;
}

// ---------------- Toast ----------------
let toastTimer;
function toast(msg, green = false) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast' + (green ? ' toast-green' : '');
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

// ---------------- Modal genérico ----------------
function openModal(html) {
  $('#modalBox').innerHTML = html;
  $('#modalOverlay').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  $('#modalOverlay').hidden = true;
  document.body.style.overflow = '';
}
$('#modalOverlay').addEventListener('click', e => { if (e.target.id === 'modalOverlay') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeChat(); } });

// ---------------- Router ----------------
const VIEWS = ['inicio', 'catalogo', 'vender', 'seguimiento'];
function currentRoute() {
  const h = location.hash.replace('#/', '') || 'inicio';
  return VIEWS.includes(h.split('?')[0]) ? h.split('?')[0] : 'inicio';
}
function navigate(route) { location.hash = '#/' + route; }

// Área de cuenta en la navbar: separada del carrito para no confundir comprar con iniciar sesión
function renderAccountArea() {
  const box = $('#accountArea');
  if (!box) return;
  if (!state.session) {
    box.innerHTML = `<button class="btn btn-outline btn-sm" data-action="account">👤 Iniciar sesión</button>`;
    return;
  }
  const firstName = state.session.name.split(' ')[0];
  box.innerHTML = `
    <button class="user-block" data-action="acct-menu">
      <span class="avatar">${state.session.initials}</span>
      <span class="acct-name">${firstName}</span>
      <span class="acct-caret">▾</span>
    </button>
    <div class="user-menu" id="acctMenu" hidden>
      <a href="#/vender">📊 Mi panel de vendedor</a>
      <a href="#/seguimiento">📦 Mis pedidos</a>
      <a href="#" data-action="logout">Cerrar sesión</a>
    </div>`;
}

async function render() {
  const route = currentRoute();
  renderAccountArea();
  closeMobileMenu();

  // Página 3 exige sesión iniciada
  if (route === 'vender' && !state.session) { openLoginModal('vender'); navigate('inicio'); return; }

  VIEWS.forEach(v => { $('#view-' + v).hidden = v !== route; });
  $$('.nav-links a[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === route));

  // El panel del vendedor reemplaza topbar/navbar públicas por su propia barra
  const isPanel = route === 'vender';
  $('#topbar').hidden = isPanel;
  $('#navbar').hidden = isPanel;
  $('#footer').hidden = isPanel;
  $('#panelbar').hidden = !isPanel;

  if (route === 'inicio') loadCatalog('home');
  if (route === 'catalogo') loadCatalog('full');
  if (route === 'vender') renderSellerPanel();
  if (route === 'seguimiento') renderTrackingPage();
  window.scrollTo({ top: 0 });
}
window.addEventListener('hashchange', render);

// ---------------- Menú móvil (hamburguesa) ----------------
function closeMobileMenu() {
  $('.nav-links').classList.remove('open');
  $('#navToggle').setAttribute('aria-expanded', 'false');
}
$('#navToggle').addEventListener('click', () => {
  const open = $('.nav-links').classList.toggle('open');
  $('#navToggle').setAttribute('aria-expanded', open);
});
$$('.nav-links a').forEach(a => a.addEventListener('click', closeMobileMenu));
document.addEventListener('click', e => {
  if (!e.target.closest('.navbar')) closeMobileMenu();
}, true);

// =====================================================
//  CATÁLOGO (Páginas 1 y 2)
// =====================================================
const activeCategory = { home: 'todo', full: 'todo' };

async function loadCatalog(which) {
  const grid = which === 'home' ? $('#homeGrid') : $('#catalogGrid');
  const cat = activeCategory[which];
  const params = new URLSearchParams();
  if (cat !== 'todo') params.set('category', cat);
  if (state.searchQuery) params.set('q', state.searchQuery);
  try {
    const products = await api('/products?' + params);
    if (which === 'full') $('#catalogCount').textContent = `· ${products.length} resultado${products.length === 1 ? '' : 's'}`;
    if (!products.length) {
      grid.innerHTML = '<p class="empty-msg">No hay productos en esta categoría todavía.</p>';
      return;
    }
    grid.innerHTML = products.map(p => {
      const inCart = state.cart.some(c => c.id === p.id);
      return `
      <article class="product-card" data-id="${p.id}">
        ${p.featured ? '<span class="card-flag">Más buscado</span>' : ''}
        ${inCart ? '<span class="card-incart">🛒 1</span>' : ''}
        <div class="card-img ${IMG_BG[CAT_BG[p.category] ?? 0]}">
          ${p.photos?.length ? `<img src="${p.photos[0]}" alt="${p.name}" loading="lazy">` : p.icon}
        </div>
        <div class="card-body">
          <span class="card-verified">✅ Autenticidad verificada</span>
          <span class="card-name">${p.name}</span>
          <span class="card-meta">Talla ${p.size} · Estado: ${p.condition_state}</span>
          <div class="card-foot">
            <span class="card-price">${money(p.price)}</span>
            <button class="btn btn-sm ${inCart ? 'btn-added' : 'btn-blue'}" data-buy="${p.id}">${inCart ? '✓ En el carrito' : 'Comprar'}</button>
          </div>
        </div>
      </article>`;
    }).join('');

    $$('.product-card', grid).forEach(card => {
      card.addEventListener('click', e => {
        const buyId = e.target.closest('[data-buy]')?.dataset.buy;
        if (buyId) { addToCart(Number(buyId), products); return; }  // 'Comprar' → directo al carrito
        openProductDetail(card.dataset.id);                         // resto de la tarjeta → ficha con fotos reales
      });
    });
  } catch (err) {
    grid.innerHTML = `<p class="empty-msg">⚠️ ${err.message}</p>`;
  }
}

$$('.category-tabs').forEach(tabs => {
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.cat-tab');
    if (!btn) return;
    $$('.cat-tab', tabs).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const which = tabs.dataset.catalog;
    activeCategory[which] = btn.dataset.category;
    loadCatalog(which);
  });
});

// Búsqueda de la navbar: filtra la grilla del catálogo
$('#navSearch').addEventListener('input', e => {
  state.searchQuery = e.target.value.trim();
  if (currentRoute() === 'inicio') loadCatalog('home');
  else { if (currentRoute() !== 'catalogo') navigate('catalogo'); loadCatalog('full'); }
});

// ---------------- Ficha con certificado de autenticidad (6.3) ----------------
// sellMode = true cuando el vendedor revisa su propia publicación desde el panel
async function openProductDetail(id, sellMode = false) {
  try {
    const p = await api('/products/' + id);
    const verifiedDate = p.verified_at ? new Date(p.verified_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
    // Galería: foto principal grande + miniaturas para cambiar de vista
    const gallery = p.photos.length ? `
      <img class="gallery-main" id="galleryMain" src="${p.photos[0]}" alt="${p.name}">
      ${p.photos.length > 1 ? `<div class="gallery-thumbs">
        ${p.photos.map((src, i) => `<img src="${src}" data-photo="${src}" class="${i === 0 ? 'active' : ''}" alt="Foto ${i + 1}">`).join('')}
      </div>` : ''}` : '';
    openModal(`
      ${gallery}
      <div class="product-hero" ${p.photos.length ? 'style="margin-top:4px"' : ''}>
        ${p.photos.length ? '' : `<div class="card-img ${IMG_BG[CAT_BG[p.category] ?? 0]}">${p.icon}</div>`}
        <div>
          <h3 style="margin-bottom:4px">${p.name}</h3>
          <span class="card-meta">Talla ${p.size} · Estado: ${p.condition_state} · ${p.category[0].toUpperCase() + p.category.slice(1)} · Publicado por ${p.seller_name}</span><br>
          <span class="detail-price">${money(p.price)}</span>
        </div>
      </div>
      ${p.status === 'en_revision' ? `
      <div class="cert-box cert-pending">
        <strong style="color:var(--ambar-texto)">🕐 En revisión por Marathon</strong>
        <div class="cert-line"><span>Factura declarada</span><b>${p.invoice_number}</b></div>
        <div class="cert-line"><span>Estado</span><b>Validación en menos de 24h hábiles</b></div>
      </div>` : `
      <div class="cert-box">
        <strong>✅ Verificado por Marathon</strong>
        <div class="cert-line"><span>N° de verificación</span><b>${p.verification_code || '—'}</b></div>
        <div class="cert-line"><span>Fecha de validación</span><b>${verifiedDate}</b></div>
        <div class="cert-line"><span>Factura original</span><b>Validada contra Marathon Sports</b></div>
        <div class="cert-line"><span>Vendedor</span><b>${p.seller_name}</b></div>
      </div>`}
      <p>${p.description || ''}</p>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
        ${sellMode ? '' : `<button class="btn btn-blue" onclick='addToCart(${p.id}, [${JSON.stringify({ id: p.id, name: p.name, price: p.price, icon: p.icon, photo: p.photos?.[0] || null })}]); closeModal()'>Comprar</button>`}
      </div>`);
    // Cambiar la foto principal al hacer clic en una miniatura
    $$('#modalBox .gallery-thumbs img').forEach(t => t.addEventListener('click', () => {
      $('#galleryMain').src = t.dataset.photo;
      $$('#modalBox .gallery-thumbs img').forEach(x => x.classList.toggle('active', x === t));
    }));
  } catch (err) { toast('⚠️ ' + err.message); }
}

// =====================================================
//  CARRITO + CHECKOUT
// =====================================================
function saveCart() {
  localStorage.setItem('mcb_cart', JSON.stringify(state.cart));
  $('#cartCount').textContent = state.cart.length;
}

// Refleja en las tarjetas visibles si el artículo ya está en el carrito
function syncCardCartState(id, inCart) {
  $$(`.product-card[data-id="${id}"]`).forEach(card => {
    const btn = $('[data-buy]', card);
    if (btn) { btn.textContent = inCart ? '✓ En el carrito' : 'Comprar'; btn.className = `btn btn-sm ${inCart ? 'btn-added' : 'btn-blue'}`; }
    let flag = $('.card-incart', card);
    if (inCart && !flag) { flag = document.createElement('span'); flag.className = 'card-incart'; flag.textContent = '🛒 1'; card.prepend(flag); }
    if (!inCart && flag) flag.remove();
  });
}

function addToCart(id, products) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (state.cart.some(x => x.id === id)) { toast('Este artículo ya está en tu carrito (cada publicación tiene 1 sola unidad).'); return; }
  state.cart.push({ id: p.id, name: p.name, price: p.price, icon: p.icon, photo: p.photos?.[0] || p.photo || null });
  saveCart();
  syncCardCartState(id, true);
  toast(`🛒 ${p.name} agregado — ${money(p.price)}`);
}
window.addToCart = addToCart;
window.closeModal = closeModal;

function openCart() {
  if (!state.cart.length) {
    openModal(`<h3>🛒 Tu carrito</h3><p>Tu carrito está vacío. Explora el catálogo verificado y encuentra tu próximo artículo Marathon.</p>
      <div class="modal-actions"><button class="btn btn-blue" onclick="closeModal(); location.hash='#/catalogo'">Ver catálogo</button></div>`);
    return;
  }
  const total = state.cart.reduce((s, i) => s + Number(i.price), 0);
  openModal(`
    <h3>🛒 Tu carrito</h3>
    ${state.cart.map(i => `
      <div class="cart-line">
        ${thumb(i.photo, i.icon)}
        <div class="sale-info"><strong>${i.name}</strong><span>1 unidad · artículo verificado</span></div>
        <strong>${money(i.price)}</strong>
        <button class="cart-remove" data-remove="${i.id}" aria-label="Quitar">✕</button>
      </div>`).join('')}
    <div class="cart-total"><span>Total</span><span>${money(total)}</span></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Seguir comprando</button>
      <button class="btn btn-red" id="goCheckout">Finalizar compra</button>
    </div>`);
  $$('#modalBox [data-remove]').forEach(b => b.addEventListener('click', () => {
    const id = Number(b.dataset.remove);
    state.cart = state.cart.filter(i => i.id !== id);
    saveCart(); syncCardCartState(id, false); openCart();
  }));
  $('#goCheckout').addEventListener('click', openCheckout);
}

async function openCheckout() {
  if (!state.stores.length) state.stores = await api('/stores').catch(() => []);
  const total = state.cart.reduce((s, i) => s + Number(i.price), 0);
  openModal(`
    <h3>Finalizar compra</h3>
    <p style="margin-bottom:6px"><strong style="color:var(--texto)">${state.cart.length} artículo(s) · Total ${money(total)}</strong></p>
    <label style="margin-top:8px">Método de entrega</label>
    <div class="delivery-choice">
      <label class="payout-option selected" id="optServi">
        <input type="radio" name="delivery" value="servientrega" checked>
        <span><strong>📦 Envío por Servientrega</strong><span class="opt-sub">Entrega a domicilio en todo Ecuador</span></span>
      </label>
      <label class="payout-option" id="optRetiro">
        <input type="radio" name="delivery" value="retiro">
        <span><strong>🏬 Retiro en tienda física Marathon</strong><span class="opt-sub">Sin costo, en la tienda que elijas</span></span>
      </label>
    </div>
    <div id="addressField">
      <label>Dirección de envío</label>
      <input type="text" id="ckAddress" placeholder="Ej. Av. de los Shyris N34-120 y Holanda, Quito">
    </div>
    <div id="storeField" hidden>
      <label>Tienda de retiro</label>
      <select id="ckStore">${state.stores.map(s => `<option value="${s.id}">${s.name} — ${s.city}</option>`).join('')}</select>
    </div>
    <label style="margin-top:12px">Método de pago</label>
    <select id="ckPayment">
      <option value="tarjeta">💳 Tarjeta de crédito / débito</option>
      <option value="transferencia">🏦 Transferencia bancaria</option>
    </select>
    <p class="form-error" id="ckError"></p>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Volver</button>
      <button class="btn btn-red" id="ckConfirm">Confirmar compra</button>
    </div>`);

  const sync = () => {
    const isServi = $('input[name=delivery]:checked').value === 'servientrega';
    $('#addressField').hidden = !isServi;
    $('#storeField').hidden = isServi;
    $('#optServi').classList.toggle('selected', isServi);
    $('#optRetiro').classList.toggle('selected', !isServi);
  };
  $$('input[name=delivery]').forEach(r => r.addEventListener('change', sync));

  $('#ckConfirm').addEventListener('click', async () => {
    const delivery = $('input[name=delivery]:checked').value;
    const btn = $('#ckConfirm');
    btn.disabled = true;
    try {
      const result = await api('/orders', {
        method: 'POST',
        body: {
          buyerId: state.session?.id || null,
          buyerName: state.session?.name || 'Invitado',
          productIds: state.cart.map(i => i.id),
          paymentMethod: $('#ckPayment').value,
          deliveryMethod: delivery,
          address: delivery === 'servientrega' ? $('#ckAddress').value.trim() : null,
          storeId: delivery === 'retiro' ? Number($('#ckStore').value) : null,
        },
      });
      state.cart = []; saveCart();
      // Refresca la grilla visible: los artículos comprados salen del catálogo (1 unidad c/u)
      if (currentRoute() === 'inicio') loadCatalog('home');
      if (currentRoute() === 'catalogo') loadCatalog('full');
      openModal(`
        <h3 style="color:var(--verde)">✅ ¡Compra confirmada!</h3>
        <p>Tu pedido fue registrado con éxito. Guarda tu número de seguimiento:</p>
        <div class="cert-box"><strong>N° de seguimiento: ${result.orderNumber}</strong>
          ${result.trackingGuide ? `<div class="cert-line"><span>Guía Servientrega</span><b>${result.trackingGuide}</b></div>` : ''}
          <div class="cert-line"><span>Total pagado</span><b>${money(result.total)}</b></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
          <button class="btn btn-blue" onclick="closeModal(); trackOrder('${result.orderNumber}'); location.hash='#/seguimiento'">Seguir mi pedido</button>
        </div>`);
    } catch (err) {
      $('#ckError').textContent = err.message;
      $('#ckError').classList.add('show');
      btn.disabled = false;
    }
  });
}

// =====================================================
//  PÁGINA 3 — PANEL DEL VENDEDOR
// =====================================================
let sellerData = null;
let activePanelTab = 'panel';

async function renderSellerPanel() {
  const box = $('#sellerContent');
  box.innerHTML = '<p style="padding:40px;color:var(--texto-sec)">Cargando tu panel…</p>';
  try {
    sellerData = await api('/seller/dashboard?userId=' + state.session.id);
  } catch (err) {
    box.innerHTML = `<p class="empty-msg">⚠️ ${err.message}</p>`;
    return;
  }
  $('#panelAvatar').textContent = sellerData.user.initials;
  $('#panelName').textContent = sellerData.user.name;
  buildNotifications();
  renderPanelTab();
}

// Notificaciones de la campanita, generadas desde la actividad real del vendedor
function buildNotifications() {
  const d = sellerData;
  const items = [];
  d.publications.filter(p => p.status === 'en_revision').forEach(p =>
    items.push({ icon: '🕐', title: `"${p.name}" está en revisión`, text: 'Marathon validará tu factura en menos de 24 horas hábiles.', time: 'Hoy' }));
  d.recentSales.slice(0, 3).forEach(s =>
    items.push({
      icon: s.payout_status === 'pendiente' ? '💰' : '✅',
      title: `Vendiste ${s.name} — ${money(s.price)}`,
      text: s.payout_status === 'pendiente' ? 'El 92% ya está en tu saldo disponible para cobrar.' : 'Pago cobrado.',
      time: new Date(s.sold_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }),
    }));
  if (d.reputation.total > 0) items.push({
    icon: '⭐', title: `Tu calificación: ${d.reputation.average} / 5`,
    text: `Basado en ${d.reputation.total} reseñas de compradores.`, time: '',
  });
  $('#notifMenu').innerHTML = `<div class="notif-head">🔔 Notificaciones</div>` + items.map(n => `
    <div class="notif-item">
      <span class="n-icon">${n.icon}</span>
      <div class="n-text"><strong>${n.title}</strong>${n.text} <span class="n-time">${n.time}</span></div>
    </div>`).join('');
  const dot = $('#bellDot');
  dot.textContent = items.length;
  dot.hidden = !items.length;
}

function kpiDelta(cur, prev, isMoney = false) {
  if (!prev) return '<span class="kpi-delta delta-up">— sin datos del mes anterior</span>';
  const diff = cur - prev;
  const pct = Math.abs(Math.round((diff / prev) * 100));
  const cls = diff >= 0 ? 'delta-up' : 'delta-down';
  const arrow = diff >= 0 ? '▲' : '▼';
  return `<span class="kpi-delta ${cls}">${arrow} ${pct}% vs. mes anterior (${isMoney ? money(prev) : prev})</span>`;
}

function renderPanelTab() {
  const d = sellerData;
  const box = $('#sellerContent');
  const monthLabel = new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });

  if (activePanelTab === 'publicaciones') { box.innerHTML = panelHeadHtml(monthLabel) + `<div class="panel-card">${publicationsHtml(d, true)}</div>`; bindPanelEvents(); return; }
  if (activePanelTab === 'historial') { box.innerHTML = panelHeadHtml(monthLabel) + `<div class="panel-card"><h3>🕐 Historial completo de ventas</h3>${salesHtml(d.recentSales)}</div>`; bindPanelEvents(); return; }
  if (activePanelTab === 'configuracion') {
    box.innerHTML = panelHeadHtml(monthLabel) + `
      <div class="panel-card"><h3>⚙️ Configuración de la cuenta</h3>
        <div class="info-row"><span>Nombre</span><strong>${d.user.name}</strong></div>
        <div class="info-row"><span>Vendedor verificado</span><strong style="color:var(--verde)">✅ Sí</strong></div>
        <div class="info-row"><span>Cuenta bancaria registrada</span><strong>•••• ${d.user.bank_account_last4}</strong></div>
        <div class="info-row"><span>Método de cobro preferido</span><strong>Cupón Marathon</strong></div>
      </div>`;
    bindPanelEvents(); return;
  }

  // --- Pestaña Panel (por defecto) ---
  const k = d.kpis, b = d.balance;
  box.innerHTML = `
    ${panelHeadHtml(monthLabel)}
    <div class="kpi-row">
      <div class="kpi-card"><span class="kpi-label">📦 Ventas este mes</span>
        <span class="kpi-value">${k.salesMonth}</span>${kpiDelta(k.salesMonth, k.salesPrevMonth)}</div>
      <div class="kpi-card"><span class="kpi-label">💰 Ingresos brutos</span>
        <span class="kpi-value">${money(k.grossMonth)}</span>${kpiDelta(k.grossMonth, k.grossPrevMonth, true)}</div>
      <div class="kpi-card"><span class="kpi-label">％ Comisión Marathon (8%)</span>
        <span class="kpi-value kpi-negative">–${money(k.commissionMonth)}</span>
        <span class="kpi-delta" style="color:var(--texto-sec)">Se recalcula con cada venta</span></div>
      <div class="kpi-card kpi-highlight"><span class="kpi-label">🏦 Saldo disponible</span>
        <span class="kpi-value">${money(b.available)}</span>
        <span class="badge badge-green">Listo para cobrar</span></div>
    </div>
    <div class="seller-grid">
      <div>
        <div class="panel-card">
          <h3>Ventas recientes <a href="#" data-goto-tab="historial">Ver todas →</a></h3>
          ${salesHtml(d.recentSales.slice(0, 6))}
        </div>
        <div class="panel-card">
          <h3>Mis publicaciones activas</h3>
          ${publicationsHtml(d)}
        </div>
      </div>
      <div>
        <div class="panel-card">
          <h3>Saldo disponible para cobrar</h3>
          <div class="balance-amount">${money(b.available)}</div>
          <div class="balance-detail">${money(b.gross)} ventas − ${money(b.commission)} comisión Marathon (8%)</div>
          <div class="verified-note">✅ ${b.pending_sales} venta${b.pending_sales === 1 ? '' : 's'} verificada${b.pending_sales === 1 ? '' : 's'} · Factura validada por Marathon Sports</div>
          <div class="payout-title">¿Cómo deseas cobrar?</div>
          <div class="payout-sub">(Elige una modalidad para recibir tus ${money(b.available)})</div>
          <label class="payout-option ${state.payoutMethod === 'cupon' ? 'selected' : ''}" data-payout="cupon">
            <input type="radio" name="payout" value="cupon" ${state.payoutMethod === 'cupon' ? 'checked' : ''}>
            <span><strong>🎟️ Cupón de descuento Marathon</strong>
              <span class="opt-sub">Usar en tiendas físicas u online · Valor del cupón: ${money(b.available)} · Vigencia: 3 meses</span>
              <span class="opt-note">⚡ Disponible inmediatamente al confirmar</span></span>
          </label>
          <label class="payout-option ${state.payoutMethod === 'deposito' ? 'selected' : ''}" data-payout="deposito">
            <input type="radio" name="payout" value="deposito" ${state.payoutMethod === 'deposito' ? 'checked' : ''}>
            <span><strong>🏦 Depósito bancario</strong>
              <span class="opt-sub">Transferencia a tu cuenta registrada · Monto a transferir: ${money(b.available)} · Plazo: 3–5 días hábiles</span>
              <span class="opt-note">🏛️ Cuenta registrada terminada en •••• ${d.user.bank_account_last4}</span></span>
          </label>
          <button class="btn btn-blue btn-block" id="payoutBtn" ${b.available <= 0 ? 'disabled' : ''} style="margin-top:8px">
            ${state.payoutMethod === 'cupon' ? 'Confirmar cobro con cupón' : 'Solicitar depósito bancario'}
          </button>
        </div>
        <div class="panel-card">
          <h3>Tu reputación como vendedor</h3>
          <div class="rep-score"><strong>${d.reputation.average}</strong><span>Basado en ${d.reputation.total} reseñas</span></div>
          <div class="stars">${'★'.repeat(Math.round(d.reputation.average))}${'☆'.repeat(5 - Math.round(d.reputation.average))}</div>
          <div class="rep-pills">
            ${d.reputation.tags.map(t => `<span class="rep-pill">${t.tag} ×${t.count}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  bindPanelEvents();
}

function panelHeadHtml(monthLabel) {
  return `
    <div class="seller-head">
      <div>
        <h2>Bienvenida/o, ${sellerData.user.name}</h2>
        <p>Resumen de tu actividad · ${monthLabel[0].toUpperCase() + monthLabel.slice(1)}</p>
      </div>
      <button class="btn btn-blue" data-action="new-article">+ Publicar nuevo artículo</button>
    </div>`;
}

function salesHtml(sales) {
  if (!sales.length) return '<p class="empty-msg">Aún no registras ventas.</p>';
  const badge = s => s === 'cobrado'
    ? '<span class="badge badge-green">Cobrado</span>'
    : '<span class="badge badge-amber">Pendiente</span>';
  return sales.map(s => `
    <div class="sale-row">
      ${thumb(s.photo, s.icon)}
      <div class="sale-info"><strong>${s.name}</strong>
        <span>Talla ${s.size} · ${new Date(s.sold_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
      <div class="sale-right"><span class="sale-price">${money(s.price)}</span>${badge(s.payout_status)}</div>
    </div>`).join('');
}

function publicationsHtml(d, extended = false) {
  if (!d.publications.length) return '<p class="empty-msg">No tienes publicaciones activas. ¡Publica tu primer artículo!</p>';
  const badge = p => p.status === 'verificada'
    ? '<span class="badge badge-green">Verificada</span>'
    : '<span class="badge badge-blue">En revisión</span>';
  return (extended ? '<h3>📋 Mis publicaciones</h3>' : '') + d.publications.map(p => `
    <div class="sale-row sale-row-click" data-open-product="${p.id}" title="Ver mi publicación">
      ${thumb(p.photo, p.icon)}
      <div class="sale-info"><strong>${p.name}</strong>
        <span>Talla ${p.size} · 👁 ${p.views_today} vistas hoy</span></div>
      <div class="sale-right"><span class="sale-price">${money(p.price)}</span>
        ${badge(p)}
        ${p.status === 'en_revision' ? `<button class="btn btn-outline btn-sm" data-verify="${p.id}" title="Solo demo: simula la validación del equipo Marathon">✓ Simular verificación</button>` : ''}
      </div>
    </div>`).join('');
}

function bindPanelEvents() {
  $('#sellerContent [data-action="new-article"]')?.addEventListener('click', openPublishIntro);
  $$('#sellerContent [data-goto-tab]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); switchPanelTab(a.dataset.gotoTab);
  }));
  $$('#sellerContent [data-payout]').forEach(opt => opt.addEventListener('click', () => {
    state.payoutMethod = opt.dataset.payout;
    $$('#sellerContent .payout-option').forEach(o => o.classList.toggle('selected', o.dataset.payout === state.payoutMethod));
    const btn = $('#payoutBtn');
    if (btn) btn.textContent = state.payoutMethod === 'cupon' ? 'Confirmar cobro con cupón' : 'Solicitar depósito bancario';
  }));
  $('#payoutBtn')?.addEventListener('click', doPayout);
  $$('#sellerContent [data-verify]').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation(); // no abrir la ficha al pulsar el botón de verificación
    try {
      const r = await api('/products/' + b.dataset.verify + '/verify', { method: 'POST' });
      toast('✅ ' + r.message, true);
      renderSellerPanel();
    } catch (err) { toast('⚠️ ' + err.message); }
  }));
  // Clic en una publicación → abre la ficha del artículo que estoy vendiendo (con sus fotos)
  $$('#sellerContent [data-open-product]').forEach(row => row.addEventListener('click', () => {
    openProductDetail(row.dataset.openProduct, true);
  }));
}

function switchPanelTab(tab) {
  activePanelTab = tab;
  $$('.panel-tabs a').forEach(a => a.classList.toggle('active', a.dataset.paneltab === tab));
  renderPanelTab();
}
$$('.panel-tabs a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); switchPanelTab(a.dataset.paneltab); }));

async function doPayout() {
  const method = state.payoutMethod;
  const btn = $('#payoutBtn');
  btn.disabled = true;
  try {
    const r = await api('/seller/payout', { method: 'POST', body: { userId: state.session.id, method } });
    openModal(`
      <h3 style="color:var(--verde)">${method === 'cupon' ? '🎟️ ¡Cupón generado!' : '🏦 Solicitud enviada'}</h3>
      <p>${r.message}</p>
      ${r.couponCode ? `<div class="cert-box"><strong>Código de tu cupón</strong>
        <div class="cert-line"><span>Código</span><b>${r.couponCode}</b></div>
        <div class="cert-line"><span>Valor</span><b>${money(r.amount)}</b></div>
        <div class="cert-line"><span>Vigencia</span><b>3 meses</b></div></div>` : ''}
      <div class="modal-actions"><button class="btn btn-blue" onclick="closeModal()">Entendido</button></div>`);
    renderSellerPanel();
  } catch (err) {
    toast('⚠️ ' + err.message);
    btn.disabled = false;
  }
}

// ---------------- Publicar nuevo artículo (7.5) ----------------
function openPublishIntro() {
  openModal(`
    <h3>🏷️ Publicar nuevo artículo</h3>
    <p>Para publicar, necesitas: fotografías del producto, número de factura original Marathon Sports, descripción detallada y precio sugerido. Recuerda que Marathon valida la autenticidad antes de publicar.</p>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-blue" id="startPublish">Comenzar</button>
    </div>`);
  $('#startPublish').addEventListener('click', openPublishForm);
}

const publishPhotos = [];
function openPublishForm() {
  publishPhotos.length = 0;
  openModal(`
    <h3>🏷️ Publicar nuevo artículo</h3>
    <div class="form-grid">
      <div class="field-full">
        <label>Fotografías del artículo (mínimo 2, máximo 6) *</label>
        <div class="photo-drop" id="photoDrop">📷 Haz clic para subir tus fotos</div>
        <input type="file" id="photoInput" accept="image/*" multiple hidden>
        <div class="photo-previews" id="photoPreviews"></div>
      </div>
      <div class="field-full"><label>Nombre del artículo *</label>
        <input type="text" id="pfName" placeholder="Ej. Camiseta Nike Dri-FIT Run talla M"></div>
      <div><label>Categoría *</label>
        <select id="pfCategory">
          <option value="camisetas">Camisetas</option><option value="calzado">Calzado</option>
          <option value="shorts">Shorts</option><option value="accesorios">Accesorios</option>
        </select></div>
      <div><label>Talla *</label><input type="text" id="pfSize" placeholder="Ej. M, 40, Única"></div>
      <div><label>Estado de conservación *</label>
        <select id="pfCondition"><option>Excelente</option><option>Muy bueno</option><option>Bueno</option></select></div>
      <div><label>Precio sugerido de venta (USD) *</label><input type="number" id="pfPrice" min="1" step="0.01" placeholder="Ej. 25.00"></div>
      <div class="field-full"><label>Descripción del artículo *</label>
        <textarea id="pfDescription" placeholder="Describe el artículo: uso, detalles, motivo de venta…"></textarea></div>
      <div><label>N° de factura original Marathon Sports *</label><input type="text" id="pfInvoice" placeholder="Ej. MS-2025-031870"></div>
      <div><label>Foto / adjunto de la factura *</label><input type="file" id="pfInvoiceFile" accept="image/*,.pdf"></div>
    </div>
    <p class="form-error" id="pfError"></p>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-red" id="pfSubmit">Enviar a revisión</button>
    </div>`);

  $('#photoDrop').addEventListener('click', () => $('#photoInput').click());
  $('#photoInput').addEventListener('change', async e => {
    for (const file of [...e.target.files].slice(0, 6 - publishPhotos.length)) {
      publishPhotos.push(await compressImage(file));
    }
    $('#photoPreviews').innerHTML = publishPhotos.map(src => `<img src="${src}" alt="Foto">`).join('');
  });

  $('#pfSubmit').addEventListener('click', async () => {
    const err = $('#pfError');
    err.classList.remove('show');
    const body = {
      sellerId: state.session.id,
      name: $('#pfName').value.trim(),
      category: $('#pfCategory').value,
      size: $('#pfSize').value.trim(),
      condition: $('#pfCondition').value,
      description: $('#pfDescription').value.trim(),
      price: Number($('#pfPrice').value),
      invoice: $('#pfInvoice').value.trim(),
      photos: publishPhotos,
    };
    if (!body.name || !body.size || !body.price || !body.invoice || !body.description) {
      err.textContent = 'Completa todos los campos obligatorios, incluido el N° de factura Marathon.'; err.classList.add('show'); return;
    }
    if (publishPhotos.length < 2) { err.textContent = 'Debes subir mínimo 2 fotografías del artículo.'; err.classList.add('show'); return; }
    if (!$('#pfInvoiceFile').files.length) { err.textContent = 'Adjunta la foto o archivo de tu factura Marathon.'; err.classList.add('show'); return; }
    try {
      const r = await api('/products', { method: 'POST', body });
      openModal(`
        <h3 style="color:var(--azul)">📋 Artículo en revisión</h3>
        <p>${r.message}</p>
        <p>Cuando se apruebe, aparecerá automáticamente en el catálogo con el sello <strong style="color:var(--verde)">✅ Autenticidad verificada</strong>. Si se rechaza, recibirás una notificación con el motivo.</p>
        <div class="modal-actions"><button class="btn btn-blue" onclick="closeModal()">Entendido</button></div>`);
      renderSellerPanel();
    } catch (e2) { err.textContent = e2.message; err.classList.add('show'); }
  });
}

function compressImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 700 / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale; canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = URL.createObjectURL(file);
  });
}

// =====================================================
//  PÁGINA 4 — SEGUIMIENTO DE PEDIDO
// =====================================================
const STEP_LABELS = {
  servientrega: [
    ['Pedido confirmado', 'Pago recibido y orden generada'],
    ['Preparando tu pedido', 'Marathon empaca el artículo verificado'],
    ['Enviado con Servientrega', ''],
    ['Entregado', ''],
  ],
  retiro: [
    ['Pedido confirmado', 'Pago recibido y orden generada'],
    ['Preparando tu pedido', 'Marathon empaca el artículo verificado'],
    ['Listo para retirar', ''],
    ['Retirado', ''],
  ],
};
const ORDER_STATUS_LABEL = {
  confirmado: 'Confirmado', preparando: 'En preparación', enviado: 'En camino',
  listo_retiro: 'Listo para retiro', entregado: 'Entregado', retirado: 'Entregado',
};

async function renderTrackingPage() {
  const box = $('#myOrders');
  box.innerHTML = '';
  if (state.session) {
    try {
      const orders = await api('/orders/mine?userId=' + state.session.id);
      if (orders.length) {
        box.innerHTML = `<h3 style="font-weight:800;margin-bottom:12px">Mis compras recientes</h3>
          <div class="orders-list">
            ${orders.map(o => `
              <div class="order-card" data-order="${o.order_number}">
                ${thumb(o.photo, o.icon)}
                <div class="sale-info"><strong>${o.product_name || 'Pedido'}</strong>
                  <span>${o.order_number} · ${new Date(o.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}</span></div>
                <span class="badge badge-blue">${ORDER_STATUS_LABEL[o.status] || o.status}</span>
              </div>`).join('')}
          </div>`;
        $$('.order-card', box).forEach(c => c.addEventListener('click', () => trackOrder(c.dataset.order)));
      }
    } catch { /* silencioso */ }
  }
}

$('#trackingForm').addEventListener('submit', e => {
  e.preventDefault();
  const num = $('#trackingInput').value.trim();
  if (num) trackOrder(num);
});

async function trackOrder(orderNumber) {
  const box = $('#trackingResult');
  box.innerHTML = '<p style="color:var(--texto-sec);padding:16px 0">Buscando pedido…</p>';
  try {
    const o = await api('/orders/track/' + encodeURIComponent(orderNumber));
    const labels = STEP_LABELS[o.delivery_method].map((l, i) => [...l]);
    if (o.delivery_method === 'servientrega') {
      labels[2][1] = o.tracking_guide ? `Número de guía: ${o.tracking_guide}` : 'Número de guía por asignar';
      labels[3][1] = o.delivered_at ? `Recibido el ${fmtDate(o.delivered_at)}` : 'Pendiente de entrega';
    } else {
      labels[2][1] = `Disponible en tienda ${o.store_name || 'Marathon'}`;
      labels[3][1] = o.delivered_at ? `Entregado el ${fmtDate(o.delivered_at)}` : 'Pendiente de retiro';
    }
    const stepsHtml = labels.map((l, i) => {
      const doneCls = i < o.currentStep ? 'done' : i === o.currentStep ? '' : 'pending';
      const content = i < o.currentStep ? '✓' : i + 1;
      return `<div class="step"><span class="step-num ${doneCls}">${content}</span>
        <div><strong>${l[0]}</strong><span>${l[1]}</span></div></div>` + (i < 3 ? '<span class="step-arrow">→</span>' : '');
    }).join('');

    const isLastStep = o.currentStep >= 3;
    let extraCard = '';
    if (o.delivery_method === 'servientrega' && o.status === 'enviado') {
      extraCard = `
        <div class="info-card">
          <h4>📦 Detalles del envío</h4>
          <div class="info-row"><span>Transportadora</span><strong>Servientrega</strong></div>
          <div class="info-row"><span>Número de guía</span><strong>${o.tracking_guide}</strong></div>
          <div class="info-row"><span>Fecha estimada de entrega</span><strong>${o.estimated_delivery ? fmtDate(o.estimated_delivery) : 'Por confirmar'}</strong></div>
          <div class="modal-actions" style="justify-content:flex-start;align-items:center;gap:12px">
            <button class="btn btn-blue btn-sm" id="serviBtn" data-guide="${o.tracking_guide}">Rastrear con Servientrega</button>
            <span style="font-size:12px;color:var(--texto-sec)">Copia tu guía y pégala en el rastreador oficial</span>
          </div>
        </div>`;
    }
    if (o.delivery_method === 'retiro' && o.store_name) {
      extraCard = `
        <div class="info-card">
          <h4>🏬 Retiro en tienda</h4>
          <div class="info-row"><span>Tienda</span><strong>${o.store_name}</strong></div>
          <div class="info-row"><span>Dirección</span><strong>${o.store_address}</strong></div>
          <div class="info-row"><span>Horario de atención</span><strong>${o.store_hours}</strong></div>
          <div class="modal-actions" style="justify-content:flex-start">
            <a class="btn btn-blue btn-sm" target="_blank" rel="noopener" href="${o.store_maps}">Ver ubicación en el mapa</a>
          </div>
        </div>`;
    }

    box.innerHTML = `
      <div class="timeline-card">
        <h3>Pedido ${o.order_number} <span class="badge badge-blue" style="margin-left:6px">${ORDER_STATUS_LABEL[o.status]}</span></h3>
        <div class="stepper">${stepsHtml}</div>
        ${!isLastStep ? `<div class="modal-actions" style="justify-content:flex-start;margin-top:20px">
          <button class="btn btn-outline btn-sm" id="advanceBtn" title="Solo demo: simula el avance logístico">⏩ Simular siguiente etapa (demo)</button>
        </div>` : ''}
      </div>
      ${extraCard}
      <div class="info-card">
        <h4>Resumen de tu compra</h4>
        ${o.items.map(i => `
          <div class="sale-row">
            ${i.photo ? `<img class="order-photo" src="${i.photo}" alt="${i.name}">` : `<span class="sale-icon">${i.icon}</span>`}
            <div class="sale-info"><strong>${i.name}</strong><span>Talla ${i.size}</span></div>
            <strong>${money(i.price)}</strong>
          </div>`).join('')}
        <div class="info-row"><span>Total pagado</span><strong>${money(o.total)}</strong></div>
        <div class="info-row"><span>Método de pago</span><strong>${o.payment_method === 'tarjeta' ? '💳 Tarjeta' : '🏦 Transferencia'}</strong></div>
        <div class="modal-actions" style="justify-content:flex-start">
          <button class="btn btn-outline btn-sm" id="orderHelpBtn">💬 ¿Necesitas ayuda con este pedido?</button>
        </div>
      </div>`;
    $('#advanceBtn')?.addEventListener('click', async () => {
      await api('/orders/track/' + o.order_number + '/advance', { method: 'POST' });
      trackOrder(o.order_number);
    });
    // Copia la guía al portapapeles y abre el rastreador oficial de Servientrega
    $('#serviBtn')?.addEventListener('click', async e => {
      const guide = e.currentTarget.dataset.guide;
      try { await navigator.clipboard.writeText(guide); toast(`📋 Guía ${guide} copiada al portapapeles`, true); } catch { /* sin permiso */ }
      window.open('https://www.servientrega.com.ec/', '_blank', 'noopener');
    });
    $('#orderHelpBtn').addEventListener('click', () => openChat(o.order_number));
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    box.innerHTML = `<div class="info-card"><p style="color:var(--rojo);font-weight:700">⚠️ ${err.message}</p></div>`;
  }
}
window.trackOrder = trackOrder;
const fmtDate = d => new Date(d).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

// =====================================================
//  CHATBOT (sección 9)
// =====================================================
const QUICK_REPLIES = [
  '🏷️ ¿Cómo vendo mi producto?',
  '💰 ¿Cuál es la comisión de Marathon?',
  '✅ ¿Cómo verifican la autenticidad?',
  '🚚 ¿Cómo funciona el envío?',
  '📦 Seguimiento de mi pedido',
  '🎟️ ¿Cómo cobro mi venta?',
  '🗣️ Hablar con un asesor',
];

function toggleQuickPanel(force) {
  const panel = $('#chatQuick');
  const show = force !== undefined ? force : panel.hidden;
  panel.hidden = !show;
  $('#quickChev').classList.toggle('open', show);
}

function openChat(orderContext = null) {
  const win = $('#chatWindow');
  win.hidden = false;
  $('#chatFab').classList.remove('bounce');
  if (state.chatFirstOpen) {
    state.chatFirstOpen = false;
    botSay('¡Hola! 👋 Soy el asistente de Marathon CycleBack. Toca una de las <strong>preguntas frecuentes</strong> de abajo y te respondo al instante.');
    $('#chatQuick').innerHTML = QUICK_REPLIES.map(q => `<button class="quick-btn" type="button">${q}</button>`).join('');
    $$('#chatQuick .quick-btn').forEach(b => b.addEventListener('click', () => {
      toggleQuickPanel(false);                          // colapsa el panel para dejar la conversación limpia
      sendChat(b.textContent.replace(/^\S+\s/, ''));
    }));
    $('#quickToggle').addEventListener('click', () => toggleQuickPanel());
    toggleQuickPanel(true);                             // sin campo de texto: las preguntas son la única entrada
  }
  if (orderContext) {
    botSay(`Veo que necesitas ayuda con tu pedido <strong>${orderContext}</strong>. Elige una de las preguntas frecuentes o habla directamente con un asesor, que ya tendrá tu número de orden a la vista.<br><button class="btn btn-blue btn-sm" onclick="escalateChat()">🗣️ Hablar con un asesor</button>`);
    toggleQuickPanel(true);
  }
}
function closeChat() { $('#chatWindow').hidden = true; }
$('#chatFab').addEventListener('click', () => $('#chatWindow').hidden ? openChat() : closeChat());

function botSay(html) {
  const div = document.createElement('div');
  div.className = 'msg msg-bot';
  div.innerHTML = html;
  $('#chatBody').appendChild(div);
  $('#chatBody').scrollTop = $('#chatBody').scrollHeight;
}
function userSay(text) {
  const div = document.createElement('div');
  div.className = 'msg msg-user';
  div.textContent = text;
  $('#chatBody').appendChild(div);
  $('#chatBody').scrollTop = $('#chatBody').scrollHeight;
}

// El chat es guiado: solo se envían las preguntas predefinidas (no hay entrada libre)
async function sendChat(text) {
  if (!text) return;
  userSay(text);
  if (/hablar con un asesor/i.test(text)) { escalateChat(); return; }
  try {
    const r = await api('/chat', { method: 'POST', body: { message: text } });
    botSay(r.answer + (r.escalate ? '<br><button class="btn btn-blue btn-sm" onclick="escalateChat()">Hablar con un asesor</button>' : ''));
  } catch {
    botSay('Ups, tuve un problema de conexión. Intenta de nuevo en unos segundos.');
  }
  toggleQuickPanel(true); // vuelve a mostrar las preguntas para continuar la conversación
}
function escalateChat() {
  botSay('🗣️ Te estamos conectando con un asesor del equipo de atención al cliente de Marathon. Tiempo estimado de espera: <strong>2 minutos</strong>. Un agente continuará esta conversación.');
}
window.escalateChat = escalateChat;

// =====================================================
//  MODALES: cómo funciona, vender, tiendas, contenido legal, login
// =====================================================
function openHowItWorks() {
  openModal(`
    <h3>¿Cómo funciona?</h3>
    <ol>
      <li>Publica tu producto con fotos y número de factura.</li>
      <li>Marathon verifica la autenticidad en menos de 24h.</li>
      <li>Se publica con sello certificado digital.</li>
      <li>Cuando se venda, recibes cupón Marathon o depósito bancario.</li>
    </ol>
    <div class="modal-actions"><button class="btn btn-blue" onclick="closeModal()">Entendido</button></div>`);
}

function openWantToSell() {
  openModal(`
    <h3>🏷️ Vende tu ropa Marathon</h3>
    <p>Publica tu artículo con el número de factura original de Marathon Sports. Nuestro equipo valida la autenticidad en menos de 24 horas y recibirás el <strong style="color:var(--rojo)">92% del precio de venta</strong>.</p>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
      <button class="btn btn-red" onclick="closeModal(); location.hash='#/vender'">Ir al panel</button>
    </div>`);
}

async function openStoresModal() {
  if (!state.stores.length) state.stores = await api('/stores').catch(() => []);
  openModal(`
    <h3>📍 Tiendas Marathon</h3>
    <p>Retira tus compras o visita cualquiera de nuestras tiendas físicas:</p>
    ${state.stores.map(s => `
      <div class="store-item">
        <strong>${s.name} · ${s.city}</strong>
        <span>${s.address}</span>
        <span>🕐 ${s.hours}</span>
        <a href="${s.maps_url}" target="_blank" rel="noopener">Ver en Google Maps →</a>
      </div>`).join('')}
    <div class="modal-actions"><button class="btn btn-blue" onclick="closeModal()">Cerrar</button></div>`);
}

async function openContentModal(key) {
  if (!state.content) state.content = await api('/content').catch(() => null);
  const c = state.content?.[key];
  if (!c) return;
  openModal(`
    <h3>${c.title}</h3>
    <p>${c.body}</p>
    <div class="modal-actions"><button class="btn btn-blue" onclick="closeModal()">Entendido</button></div>`);
}

function openLoginModal(redirect = null) {
  openModal(`
    <h3>Mi cuenta</h3>
    <p>Inicia sesión con tu cuenta de cliente Marathon para vender artículos y ver tus pedidos.</p>
    <div class="form-grid">
      <div class="field-full"><label>Correo electrónico</label>
        <input type="email" id="loginEmail" value="anahy@marathon.ec"></div>
      <div class="field-full"><label>Contraseña</label>
        <input type="password" id="loginPass" value="marathon123"></div>
    </div>
    <p style="font-size:12px">💡 Demo: <strong>anahy@marathon.ec</strong> / <strong>marathon123</strong></p>
    <p class="form-error" id="loginError"></p>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-blue" id="loginBtn">Iniciar sesión</button>
    </div>`);
  $('#loginBtn').addEventListener('click', async () => {
    try {
      const user = await api('/auth/login', {
        method: 'POST',
        body: { email: $('#loginEmail').value.trim(), password: $('#loginPass').value },
      });
      state.session = user;
      localStorage.setItem('mcb_session', JSON.stringify(user));
      closeModal();
      toast(`¡Bienvenida/o, ${user.name}!`, true);
      navigate(redirect || 'vender');
      render();
    } catch (err) {
      $('#loginError').textContent = err.message;
      $('#loginError').classList.add('show');
    }
  });
}

function logout() {
  state.session = null;
  localStorage.removeItem('mcb_session');
  toast('Sesión cerrada. ¡Vuelve pronto!');
  navigate('inicio');
  render();
}

// =====================================================
//  Delegación global de acciones
// =====================================================
document.addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  const content = e.target.closest('[data-content]')?.dataset.content;
  if (content) { e.preventDefault(); openContentModal(content); return; }
  if (!action) return;
  e.preventDefault();
  switch (action) {
    case 'open-chat': openChat(); break;
    case 'close-chat': closeChat(); break;
    case 'open-stores': openStoresModal(); break;
    case 'how-it-works': openHowItWorks(); break;
    case 'want-to-sell': openWantToSell(); break;
    case 'go-sell': navigate('vender'); break;
    case 'scroll-catalog': $('#homeCatalog').scrollIntoView({ behavior: 'smooth' }); break;
    case 'open-cart': openCart(); break;
    case 'account': state.session ? navigate('vender') : openLoginModal(); break;
    case 'acct-menu': { const m = $('#acctMenu'); if (m) m.hidden = !m.hidden; break; }
    case 'notifications': { const n = $('#notifMenu'); n.hidden = !n.hidden; $('#userMenu').hidden = true; break; }
    case 'user-menu': $('#userMenu').hidden = !$('#userMenu').hidden; $('#notifMenu').hidden = true; break;
    case 'logout': { const um = $('#userMenu'); if (um) um.hidden = true; logout(); break; }
  }
});
// Cierra los menús desplegables al hacer clic fuera de ellos
document.addEventListener('click', e => {
  if (!e.target.closest('.account-area')) { const m = $('#acctMenu'); if (m) m.hidden = true; }
  if (!e.target.closest('.panel-user')) {
    const m = $('#userMenu'); if (m) m.hidden = true;
    const n = $('#notifMenu'); if (n) n.hidden = true;
  }
}, true);
// El enlace 'Vender' del menú exige sesión (el router redirige al login si no la hay)

// =====================================================
//  Init
// =====================================================
saveCart();
render();
