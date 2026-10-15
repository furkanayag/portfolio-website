(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;
  const loader = $('.loader');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  // CDN failed: show the page plainly
  if (!window.gsap || !window.ScrollTrigger) {
    body.classList.remove('is-loading'); loader.remove(); return;
  }
  gsap.registerPlugin(ScrollTrigger);

  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    return [...text].map((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c;
      el.appendChild(s); return s;
    });
  }

  /* ---------- clock ---------- */
  const clock = $('#clock');
  const tick = () => clock.textContent = 'Istanbul ' + new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Istanbul' });
  tick(); setInterval(tick, 1000);

  /* ---------- hero letters (variable font reacts to pointer) ---------- */
  const heroChars = $$('.name .row').flatMap(splitChars);
  const state = heroChars.map(() => ({ w: 75, t: 500 }));
  let mx = -9999, my = -9999, heroVisible = true;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
  ScrollTrigger.create({ trigger: '#top', start: 'top bottom', end: 'bottom top', onToggle: s => heroVisible = s.isActive });
  const t0 = performance.now();
  gsap.ticker.add(() => {
    if (!heroVisible || reduce) return;
    const time = (performance.now() - t0) / 1000;
    heroChars.forEach((c, i) => {
      let k;
      if (fine) {
        const r = c.getBoundingClientRect();
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        k = Math.max(0, 1 - d / (innerWidth * .22)); k *= k;
      } else {
        k = Math.max(0, Math.sin(time * 2.2 - i * .7)); // idle wave on touch screens
      }
      const s = state[i];
      s.w += ((75 + 25 * k) - s.w) * .14;
      s.t += ((420 + 380 * k) - s.t) * .14;
      c.style.fontVariationSettings = `"wdth" ${s.w.toFixed(1)}, "wght" ${s.t.toFixed(0)}`;
    });
  });

  /* ---------- intro ---------- */
  function intro() {
    body.classList.remove('is-loading');
    gsap.from(heroChars, { yPercent: 115, rotate: 10, duration: 1.2, ease: 'expo.out', stagger: .06 });
    gsap.from('.hero-top > *, .hero-bottom > *', { opacity: 0, y: 20, duration: .9, delay: .5, stagger: .08, ease: 'power3.out' });
    gsap.from('.bar', { yPercent: -100, duration: .8, delay: .6, ease: 'power3.out' });
  }
  if (reduce) { loader.remove(); body.classList.remove('is-loading'); }
  else {
    const n = { v: 0 }, count = $('#count');
    gsap.timeline()
      .to(n, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => count.textContent = Math.round(n.v) })
      .to(loader, { yPercent: -100, duration: .9, ease: 'power4.inOut', delay: .15, onStart: intro })
      .set(loader, { display: 'none' });
  }

  /* ---------- cursor ---------- */
  const cursor = $('.cursor'), label = $('.cursor-label'), peek = $('.peek'), peekImg = $('img', peek);
  if (fine) {
    const cx = gsap.quickTo(cursor, 'x', { duration: .25, ease: 'power3' }), cy = gsap.quickTo(cursor, 'y', { duration: .25, ease: 'power3' });
    const px = gsap.quickTo(peek, 'x', { duration: .7, ease: 'power3' }), py = gsap.quickTo(peek, 'y', { duration: .7, ease: 'power3' });
    const pr = gsap.quickTo(peek, 'rotation', { duration: .5, ease: 'power3' });
    let lastX = 0;
    addEventListener('pointermove', e => {
      cx(e.clientX); cy(e.clientY);
      px(e.clientX + 120); py(e.clientY);
      pr(Math.max(-12, Math.min(12, (e.clientX - lastX) * .5))); lastX = e.clientX;
    });
    const hover = (el, text, big) => {
      el.addEventListener('pointerenter', () => { label.textContent = text || ''; cursor.classList.toggle('big', !!text); cursor.classList.toggle('link', !text && big); });
      el.addEventListener('pointerleave', () => cursor.classList.remove('big', 'link'));
    };
    $$('a').forEach(a => hover(a, '', true));
    $$('.plist li').forEach(li => {
      hover(li, 'open');
      const src = li.dataset.img;
      if (src) {
        li.addEventListener('pointerenter', () => { peekImg.src = src; peek.classList.add('on'); });
        li.addEventListener('pointerleave', () => peek.classList.remove('on'));
      }
    });
    hover($('#box'), 'drag');
  }

  /* ---------- section code + rail ---------- */
  const sections = $$('main > section');
  const codeEl = $('#code'), railLis = $$('.rail li');
  sections.forEach((sec, i) => ScrollTrigger.create({
    trigger: sec, start: 'top 50%', end: 'bottom 50%',
    onToggle: s => { if (s.isActive) { codeEl.textContent = sec.dataset.code; railLis.forEach((l, j) => l.classList.toggle('on', j === i)); } }
  }));
  const rail = $('.rail'), packet = $('.packet'), fill = $('.rail-fill');
  railLis.forEach((l, i) => l.style.top = (i / (railLis.length - 1) * 100) + '%');
  function updateRail() {
    const vh = innerHeight;
    let idx = 0;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= vh * .5) idx = i; });
    const r = sections[idx].getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (vh * .5 - r.top) / r.height));
    const pos = Math.min(1, (idx + frac) / (sections.length - 1));
    packet.style.top = (pos * 100) + '%';
    fill.style.height = (pos * 100) + '%';
  }
  addEventListener('scroll', updateRail, { passive: true }); updateRail();

  /* ---------- manifesto: words fill in with scroll ---------- */
  const m = $('#manifesto');
  const words = m.textContent.trim().split(/\s+/);
  m.textContent = '';
  words.forEach(w => { const s = document.createElement('span'); s.className = 'wd'; s.textContent = w; m.appendChild(s); });
  if (!reduce) gsap.fromTo($$('.wd', m), { opacity: .14 }, { opacity: 1, ease: 'none', stagger: .12,
    scrollTrigger: { trigger: m, start: 'top 85%', end: 'bottom 50%', scrub: true } });

  /* ---------- work: pinned horizontal journey ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 801px) and (prefers-reduced-motion: no-preference)', () => {
    const track = $('.track'), fillW = $('.wire-fill'), pk = $('.wire-packet'), wire = $('.wire');
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: {
      trigger: '.work-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true,
      onUpdate: s => { fillW.style.transform = `scaleX(${s.progress})`; pk.style.left = (s.progress * wire.clientWidth) + 'px'; }
    } });
    $$('.panel h3, .panel.intro h2').forEach(h => gsap.fromTo(h, { xPercent: 22 }, { xPercent: -22, ease: 'none',
      scrollTrigger: { trigger: h.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } }));
  });

  /* ---------- stack: real physics ---------- */
  const box = $('#box');
  const names = ['Java 21', 'Spring Boot', 'PostgreSQL', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'Hibernate', 'SQS', 'EventBridge', 'Microservices', 'REST APIs', 'CI/CD', 'Linux', 'Git', 'System design', 'Deep learning', 'ElastiCache', 'Lambda'];
  const { Engine, Bodies, Composite, Mouse, MouseConstraint, Body } = Matter;
  const engine = Engine.create({ gravity: { y: 1.1 } });
  const pills = names.map((n, i) => {
    const el = document.createElement('span');
    el.className = 'pill ' + ['', 'k', 'b'][i % 3]; el.textContent = n; box.appendChild(el);
    return { el, body: null };
  });
  let walls = [], started = false;
  function buildWalls() {
    walls.forEach(w => Composite.remove(engine.world, w));
    const W = box.clientWidth, H = box.clientHeight, t = 200;
    walls = [Bodies.rectangle(W / 2, H + t / 2, W + 400, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, H / 2 - 600, t, H + 1400, { isStatic: true }),
      Bodies.rectangle(W + t / 2, H / 2 - 600, t, H + 1400, { isStatic: true })];
    Composite.add(engine.world, walls);
  }
  function drop() {
    if (started) return; started = true;
    const W = box.clientWidth;
    pills.forEach((p, i) => {
      const w = p.el.offsetWidth, h = p.el.offsetHeight;
      p.w = w; p.h = h;
      p.body = Bodies.rectangle(40 + Math.random() * (W - 80 - w) + w / 2, -80 - i * 70, w, h, {
        chamfer: { radius: h / 2 }, restitution: .45, friction: .08, frictionAir: .008, angle: (Math.random() - .5) * 1.2 });
      Composite.add(engine.world, p.body);
    });
  }
  buildWalls();
  const mouse = Mouse.create(box);
  ['mousewheel', 'DOMMouseScroll', 'wheel'].forEach(ev => box.removeEventListener(ev, mouse.mousewheel));
  // touch must keep scrolling the page
  ['touchstart', 'touchmove', 'touchend'].forEach(ev => box.removeEventListener(ev, mouse.mousedown));
  box.removeEventListener('touchmove', mouse.mousemove); box.removeEventListener('touchend', mouse.mouseup);
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: .25, render: { visible: false } } });
  Composite.add(engine.world, mc);
  let physicsOn = false;
  ScrollTrigger.create({ trigger: '#stack', start: 'top 70%', once: true, onEnter: drop });
  ScrollTrigger.create({ trigger: box, start: 'top bottom', end: 'bottom top', onToggle: s => physicsOn = s.isActive });
  gsap.ticker.add((_, dt) => {
    if (!started || !physicsOn) return;
    Engine.update(engine, Math.min(dt, 33));
    pills.forEach(p => {
      if (!p.body) return;
      const { x, y } = p.body.position;
      p.el.style.transform = `translate(${x - p.w / 2}px, ${y - p.h / 2}px) rotate(${p.body.angle}rad)`;
    });
  });
  addEventListener('resize', () => { if (started) buildWalls(); });

  /* ---------- contact: letters flip in, then dodge the pointer ---------- */
  const mail = $('#mail');
  const mailChars = splitChars(mail);
  if (!reduce) gsap.from(mailChars, { opacity: 0, rotationX: -100, transformOrigin: '50% 100%', y: 40, duration: .9, ease: 'back.out(1.6)', stagger: .03,
    scrollTrigger: { trigger: mail, start: 'top 85%' } });
  if (fine && !reduce) {
    mail.addEventListener('pointermove', e => {
      mailChars.forEach(c => {
        const r = c.getBoundingClientRect();
        const dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
        const d = Math.hypot(dx, dy), k = Math.max(0, 1 - d / 170);
        gsap.to(c, { x: dx / (d || 1) * k * 50, y: dy / (d || 1) * k * 50, rotate: dx / (d || 1) * k * 14, duration: .45, ease: 'power3.out', overwrite: 'auto' });
      });
    });
    mail.addEventListener('pointerleave', () => gsap.to(mailChars, { x: 0, y: 0, rotate: 0, duration: 1.1, ease: 'elastic.out(1,.4)', stagger: .01 }));
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
