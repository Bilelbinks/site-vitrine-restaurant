document.addEventListener('DOMContentLoaded', () => {

  Reservations.seedIfEmpty();

  const ADMIN_PASSWORD = 'admin1234'; // démo uniquement, voir README
  const AUTH_KEY = 'augustineAdminAuth';

  const loginGate = document.getElementById('loginGate');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');

  function showDashboard() {
    loginGate.hidden = true;
    dashboard.hidden = false;
    logoutBtn.hidden = false;
    renderAll();
  }

  if (sessionStorage.getItem(AUTH_KEY) === '1') {
    showDashboard();
  }

  const passwordField = document.getElementById('password');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (passwordField.value === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1');
      passwordField.closest('.form-field').classList.remove('invalid');
      loginForm.reset();
      showDashboard();
    } else {
      passwordField.closest('.form-field').classList.add('invalid');
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    dashboard.hidden = true;
    logoutBtn.hidden = true;
    loginGate.hidden = false;
  });

  /* ===== Dashboard ===== */
  const dashDate = document.getElementById('dashDate');
  const prevDay = document.getElementById('prevDay');
  const nextDay = document.getElementById('nextDay');
  const todayBtn = document.getElementById('todayBtn');
  const resetDemoBtn = document.getElementById('resetDemoBtn');

  const dayStatus = document.getElementById('dayStatus');
  const statsRow = document.getElementById('statsRow');
  const slotsGrid = document.getElementById('slotsGrid');
  const reservationsList = document.getElementById('reservationsList');

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  dashDate.value = todayStr();

  function shiftDate(days) {
    const d = Reservations.parseLocalDate(dashDate.value);
    d.setDate(d.getDate() + days);
    dashDate.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    renderAll();
  }

  prevDay.addEventListener('click', () => shiftDate(-1));
  nextDay.addEventListener('click', () => shiftDate(1));
  todayBtn.addEventListener('click', () => { dashDate.value = todayStr(); renderAll(); });
  dashDate.addEventListener('change', renderAll);

  resetDemoBtn.addEventListener('click', () => {
    if (confirm('Réinitialiser toutes les réservations de démonstration ? Cette action efface les données actuelles.')) {
      Reservations.resetDemoData();
      renderAll();
    }
  });

  function formatDateLong(dateStr) {
    return Reservations.parseLocalDate(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  function renderAll() {
    const date = dashDate.value;
    renderStatus(date);
    renderStats(date);
    renderSlots(date);
    renderReservations(date);
  }

  function renderStatus(date) {
    const label = formatDateLong(date).replace(/^\w/, c => c.toUpperCase());
    dayStatus.textContent = Reservations.isOpenOn(date)
      ? label
      : `${label} — Fermé ce jour-là`;
  }

  function renderStats(date) {
    const all = Reservations.load().filter(r => r.date === date);
    const active = all.filter(r => r.status !== 'annulée');
    const covers = active.reduce((sum, r) => sum + Number(r.guests), 0);
    const slots = Reservations.slotsWithAvailability(date);
    const totalCapacity = slots.reduce((sum, s) => sum + s.capacity, 0);
    const fullSlots = slots.filter(s => s.full).length;

    statsRow.innerHTML = `
      <div class="admin-stat"><strong>${active.length}</strong><span>Réservations actives</span></div>
      <div class="admin-stat"><strong>${covers}</strong><span>Couverts réservés</span></div>
      <div class="admin-stat"><strong>${totalCapacity ? Math.round((covers / totalCapacity) * 100) : 0}%</strong><span>Taux de remplissage du jour</span></div>
      <div class="admin-stat"><strong>${fullSlots}</strong><span>Créneau(x) complet(s)</span></div>
    `;
  }

  function renderSlots(date) {
    const slots = Reservations.slotsWithAvailability(date);
    if (slots.length === 0) {
      slotsGrid.innerHTML = '<p class="admin-empty">Le restaurant est fermé ce jour-là — aucun créneau à afficher.</p>';
      return;
    }
    slotsGrid.innerHTML = slots.map(s => `
      <div class="admin-slot ${s.full ? 'is-full' : ''}">
        <div class="admin-slot__head">
          <strong>${s.time}</strong>
          <span>${s.booked}/${s.capacity} ${s.full ? '· complet' : ''}</span>
        </div>
        <div class="admin-slot__bar">
          <div class="admin-slot__bar-fill" style="width:${Math.min(100, (s.booked / s.capacity) * 100)}%"></div>
        </div>
      </div>
    `).join('');
  }

  function renderReservations(date) {
    const list = Reservations.load()
      .filter(r => r.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));

    if (list.length === 0) {
      reservationsList.innerHTML = '<p class="admin-empty">Aucune réservation pour ce jour.</p>';
      return;
    }

    reservationsList.innerHTML = list.map(r => `
      <div class="admin-card ${r.status === 'annulée' ? 'is-cancelled' : ''}" data-id="${r.id}">
        <div class="admin-card__time">${r.time}</div>
        <div>
          <div class="admin-card__name">${escapeHtml(r.name)}</div>
          <div class="admin-card__meta">
            <span class="status-pill ${r.status === 'annulée' ? 'status-pill--cancelled' : 'status-pill--ok'}">${r.status}</span>
          </div>
        </div>
        <div class="admin-card__contact">
          <div><a href="tel:${escapeHtml(r.phone)}">${escapeHtml(r.phone)}</a></div>
          <div>${escapeHtml(r.email)}</div>
        </div>
        <div class="admin-card__guests">
          <strong>${r.guests}</strong>
          <span>couverts</span>
        </div>
        <div class="admin-card__actions">
          ${r.status === 'annulée'
            ? `<button class="action-confirm" data-action="confirm">Réactiver</button>`
            : `<button class="action-cancel" data-action="cancel">Annuler</button>`}
          <button class="action-delete" data-action="delete">Supprimer</button>
        </div>
        ${r.message ? `<div class="admin-card__msg">« ${escapeHtml(r.message)} »</div>` : ''}
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  reservationsList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const card = btn.closest('.admin-card');
    const id = card.dataset.id;

    if (btn.dataset.action === 'cancel') {
      Reservations.update(id, { status: 'annulée' });
    } else if (btn.dataset.action === 'confirm') {
      Reservations.update(id, { status: 'confirmée' });
    } else if (btn.dataset.action === 'delete') {
      if (confirm('Supprimer définitivement cette réservation ?')) {
        Reservations.remove(id);
      } else {
        return;
      }
    }
    renderAll();
  });

});
