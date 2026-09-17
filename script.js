document.addEventListener('DOMContentLoaded', () => {

  /* ===== Header scroll state ===== */
  const header = document.getElementById('header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ===== Mobile nav ===== */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ===== Scrollspy ===== */
  const navLinks = Array.from(document.querySelectorAll('.nav__link'));
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = '#' + entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === id);
        });
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  sections.forEach(section => spyObserver.observe(section));

  /* ===== Reveal on scroll ===== */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ===== Menu tabs ===== */
  const tabs = document.querySelectorAll('.menu-tab');
  const panels = document.querySelectorAll('.menu-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.querySelector(`.menu-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });

  /* ===== Gallery lightbox ===== */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('.gallery__item').forEach(item => {
    item.addEventListener('click', () => {
      lightboxImg.src = item.dataset.full;
      lightboxImg.alt = item.querySelector('img').alt;
      lightbox.classList.add('open');
    });
  });
  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightboxImg.src = '';
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ===== Testimonials carousel ===== */
  const track = document.getElementById('testiTrack');
  const dotsWrap = document.getElementById('testiDots');
  const cards = Array.from(track.children);

  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Avis ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      cards[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.children);
  const trackObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = cards.indexOf(entry.target);
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      }
    });
  }, { root: track, threshold: 0.6 });
  cards.forEach(card => trackObserver.observe(card));

  /* ===== Reservation form ===== */
  const form = document.getElementById('reservationForm');
  const successMsg = document.getElementById('formSuccess');
  const dateField = document.getElementById('date');
  const timeField = document.getElementById('time');
  const guestsField = document.getElementById('guests');
  const dateErrorEl = dateField.closest('.form-field').querySelector('.form-error');

  Reservations.seedIfEmpty();

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  dateField.min = todayStr;

  function populateTimeSlots() {
    const date = dateField.value;
    const requestedGuests = Number(guestsField.value) || 1;
    timeField.innerHTML = '';

    if (!date) {
      timeField.innerHTML = '<option value="" selected disabled>Choisissez d\'abord une date</option>';
      dateField.closest('.form-field').classList.remove('invalid');
      return;
    }

    if (!Reservations.isOpenOn(date)) {
      timeField.innerHTML = '<option value="" selected disabled>Fermé ce jour-là</option>';
      dateErrorEl.textContent = 'Nous sommes fermés à cette date (fermeture le lundi) — merci de choisir un autre jour.';
      dateField.closest('.form-field').classList.add('invalid');
      return;
    }

    dateField.closest('.form-field').classList.remove('invalid');

    const slots = Reservations.slotsWithAvailability(date);
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = 'Choisissez une heure';
    timeField.appendChild(placeholder);

    slots.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot.time;
      const full = slot.remaining < requestedGuests;
      opt.disabled = full;
      opt.textContent = full ? `${slot.time} — complet` : slot.time;
      timeField.appendChild(opt);
    });
  }

  dateField.addEventListener('change', populateTimeSlots);
  guestsField.addEventListener('change', populateTimeSlots);
  populateTimeSlots();

  const validators = {
    name: v => v.trim().length > 1,
    phone: v => v.replace(/[^\d+]/g, '').length >= 8,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    date: v => Reservations.isOpenOn(v),
    time: v => v.length > 0,
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    Object.keys(validators).forEach(name => {
      const field = form.elements[name];
      const wrapper = field.closest('.form-field');
      const ok = validators[name](field.value);
      wrapper.classList.toggle('invalid', !ok);
      if (!ok) valid = false;
    });

    const guests = Number(guestsField.value);
    if (valid && Reservations.isFull(dateField.value, timeField.value, guests)) {
      timeField.closest('.form-field').classList.add('invalid');
      populateTimeSlots();
      valid = false;
    }

    if (!valid) {
      successMsg.classList.remove('show');
      return;
    }

    const data = new FormData(form);
    Reservations.add({
      name: data.get('name').trim(),
      email: data.get('email').trim(),
      phone: data.get('phone').trim(),
      date: data.get('date'),
      time: data.get('time'),
      guests: Number(data.get('guests')),
      message: (data.get('message') || '').trim(),
    });

    successMsg.textContent = `Merci ${data.get('name')} ! Votre table pour ${data.get('guests')} le ` +
      `${data.get('date').split('-').reverse().join('/')} à ${data.get('time')} est confirmée. ` +
      `Nous vous appellerons au ${data.get('phone')} en cas de besoin.`;
    successMsg.classList.add('show');
    form.reset();
    dateField.min = todayStr;
    populateTimeSlots();
  });

  /* ===== Portfolio credit link (demo placeholder) ===== */
  const portfolioLink = document.getElementById('portfolioLink');
  if (portfolioLink) {
    portfolioLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Remplace ce lien par l\'URL de ton portfolio une fois en ligne.');
    });
  }

});
