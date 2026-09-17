/**
 * Logique de réservation partagée entre le formulaire public (index.html)
 * et l'espace pro (admin.html). Persistance en localStorage : suffisant pour
 * une démo mono-navigateur, à remplacer par un vrai backend (voir README) en
 * production.
 */
const Reservations = (() => {

  const STORAGE_KEY = 'augustineReservations';
  const SEED_FLAG_KEY = 'augustineReservationsSeeded';

  // Horaires d'ouverture réels du restaurant (voir section #infos du site).
  // Index = Date.getDay() → 0 = dimanche ... 6 = samedi.
  const OPENING_HOURS = {
    0: [{ start: '12:00', end: '15:00' }],                                   // Dimanche
    1: [],                                                                    // Lundi : fermé
    2: [{ start: '12:00', end: '14:00' }, { start: '19:00', end: '22:30' }],  // Mardi
    3: [{ start: '12:00', end: '14:00' }, { start: '19:00', end: '22:30' }],  // Mercredi
    4: [{ start: '12:00', end: '14:00' }, { start: '19:00', end: '22:30' }],  // Jeudi
    5: [{ start: '12:00', end: '14:00' }, { start: '19:00', end: '22:30' }],  // Vendredi
    6: [{ start: '19:00', end: '23:00' }],                                    // Samedi
  };

  const SLOT_INTERVAL_MIN = 30;   // un créneau toutes les 30 minutes
  const LAST_SEATING_BUFFER = 30; // dernier service 30 min avant la fermeture
  const CAPACITY_PER_SLOT = 32;   // couverts max pouvant être servis sur un même créneau

  /* ---------- Aides date / heure ---------- */

  function parseLocalDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function toMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  function toHHMM(mins) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  function shiftsForDate(dateStr) {
    const dow = parseLocalDate(dateStr).getDay();
    return OPENING_HOURS[dow] || [];
  }

  function isOpenOn(dateStr) {
    return shiftsForDate(dateStr).length > 0;
  }

  /** Liste des heures de créneau possibles pour une date (sans le statut complet). */
  function slotsForDate(dateStr) {
    const slots = [];
    shiftsForDate(dateStr).forEach(shift => {
      const start = toMinutes(shift.start);
      const end = toMinutes(shift.end) - LAST_SEATING_BUFFER;
      for (let t = start; t <= end; t += SLOT_INTERVAL_MIN) {
        slots.push(toHHMM(t));
      }
    });
    return slots;
  }

  /* ---------- Persistance ---------- */

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function add(reservation) {
    const list = load();
    const record = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      status: 'confirmée',
      createdAt: new Date().toISOString(),
      ...reservation,
    };
    list.push(record);
    save(list);
    return record;
  }

  function update(id, changes) {
    const list = load();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...changes };
    save(list);
    return list[idx];
  }

  function remove(id) {
    save(load().filter(r => r.id !== id));
  }

  /* ---------- Capacité ---------- */

  function coversBooked(dateStr, time, excludeId) {
    return load()
      .filter(r => r.date === dateStr && r.time === time && r.status !== 'annulée' && r.id !== excludeId)
      .reduce((sum, r) => sum + Number(r.guests), 0);
  }

  function remainingCovers(dateStr, time, excludeId) {
    return Math.max(0, CAPACITY_PER_SLOT - coversBooked(dateStr, time, excludeId));
  }

  function isFull(dateStr, time, requestedGuests = 1) {
    return remainingCovers(dateStr, time) < requestedGuests;
  }

  /** Créneaux enrichis avec l'état de remplissage, pour affichage (form ou admin). */
  function slotsWithAvailability(dateStr) {
    return slotsForDate(dateStr).map(time => {
      const booked = coversBooked(dateStr, time);
      return {
        time,
        booked,
        capacity: CAPACITY_PER_SLOT,
        remaining: Math.max(0, CAPACITY_PER_SLOT - booked),
        full: booked >= CAPACITY_PER_SLOT,
      };
    });
  }

  /* ---------- Données de démonstration ---------- */

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function toDateStr(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function nextOpenDate(fromOffset) {
    let d = addDays(new Date(), fromOffset);
    while (!isOpenOn(toDateStr(d))) {
      d = addDays(d, 1);
    }
    return toDateStr(d);
  }

  function seedIfEmpty() {
    if (localStorage.getItem(SEED_FLAG_KEY)) return;
    localStorage.setItem(SEED_FLAG_KEY, '1');
    if (load().length > 0) return;

    const day1 = nextOpenDate(1);   // demain (ou prochain jour ouvert)
    const day2 = nextOpenDate(2);
    const day3 = nextOpenDate(4);

    const demo = [
      { name: 'Camille Roux', email: 'camille.roux@example.com', phone: '06 12 34 56 78', date: day1, time: '19:00', guests: 4, message: '', status: 'confirmée' },
      { name: 'Antoine Meunier', email: 'a.meunier@example.com', phone: '06 22 33 44 55', date: day1, time: '19:00', guests: 6, message: 'Anniversaire, une bougie sur le dessert svp', status: 'confirmée' },
      { name: 'Léa Fontaine', email: 'lea.fontaine@example.com', phone: '07 45 12 89 03', date: day1, time: '19:00', guests: 8, message: '', status: 'confirmée' },
      { name: 'Hugo Bernard', email: 'hugo.bernard@example.com', phone: '06 98 76 54 32', date: day1, time: '19:00', guests: 8, message: '', status: 'confirmée' },
      { name: 'Nadia Kaci', email: 'nadia.kaci@example.com', phone: '06 11 22 33 44', date: day1, time: '19:00', guests: 6, message: 'Allergie aux fruits de mer', status: 'confirmée' },
      { name: 'Paul Girard', email: 'paul.girard@example.com', phone: '07 60 50 40 30', date: day1, time: '12:30', guests: 2, message: '', status: 'confirmée' },
      { name: 'Sophie Marchand', email: 'sophie.marchand@example.com', phone: '06 55 66 77 88', date: day2, time: '20:00', guests: 3, message: '', status: 'confirmée' },
      { name: 'Yanis Belkacem', email: 'yanis.belkacem@example.com', phone: '06 33 22 11 00', date: day2, time: '20:00', guests: 2, message: '', status: 'annulée' },
      { name: 'Chloé Petit', email: 'chloe.petit@example.com', phone: '07 12 98 34 56', date: day3, time: '12:00', guests: 4, message: 'Table proche de la fenêtre si possible', status: 'confirmée' },
    ];

    demo.forEach(r => add(r));
  }

  function resetDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SEED_FLAG_KEY);
    seedIfEmpty();
  }

  return {
    CAPACITY_PER_SLOT,
    isOpenOn,
    slotsForDate,
    slotsWithAvailability,
    load,
    add,
    update,
    remove,
    remainingCovers,
    isFull,
    seedIfEmpty,
    resetDemoData,
    parseLocalDate,
  };
})();
