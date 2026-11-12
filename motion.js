/* Movimentos do site com GSAP (Estúdio Caio Pires, nov/2026).
   Cada bloco tem a demo do GSAP que serviu de referência. O código é do estúdio.
   Nada roda para quem pediu menos movimento; o que depende de mouse não roda no celular.
   Depende de: gsap, ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin e Flip
   (em /vendor/gsap-3.15.1/), e de S, N, sno e use, definidos em src/pagina.html. */
(function () {
  'use strict';
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, Flip);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var mm = gsap.matchMedia();
  var COND = { mover: '(prefers-reduced-motion: no-preference)', calmo: '(prefers-reduced-motion: reduce)', mouse: '(hover: hover) and (pointer: fine)', largo: '(min-width: 721px)' };

  /* Um símbolo do acervo como um só caminho, numa caixa de 100 x 100 (para o morph). */
  function caminho100(i) {
    var sym = document.getElementById('s' + i); if (!sym) return '';
    var vb = sym.getAttribute('viewBox').split(/\s+/).map(Number), k = 100 / vb[2];
    var raw = MotionPathPlugin.stringToRawPath(S[i].d.join(' '));
    MotionPathPlugin.transformRawPath(raw, k, 0, 0, k, -vb[0] * k, -vb[1] * k);
    return MotionPathPlugin.rawPathToString(raw);
  }

  /* ---------- 1. Símbolo que vira o próximo (Morph between SVG shapes + Shape index) ---------- */
  var morph = $('#morphB');
  if (morph && typeof S !== 'undefined' && S.length) {
    var LISTA = [6, 22, 27, 7, 37, 11, 30, 43, 2, 18, 33, 48].filter(function (i) { return i < S.length; });
    var pf = $('#morphP'), traco = $('#morphT'), no = $('#morphNo'), ir = $('#morphGo');
    var formas = LISTA.map(caminho100);
    var marca = function (k) {
      var i = LISTA[k]; no.textContent = 'Nº ' + sno(i); ir.href = '#s' + sno(i);
      ir.querySelector('span').textContent = 'Ver o símbolo ' + sno(i);
      pf.setAttribute('fill-rule', S[i].ev ? 'evenodd' : 'nonzero');
    };
    pf.setAttribute('d', formas[0]); traco.setAttribute('d', formas[0]); marca(0); morph.hidden = false;
    mm.add(COND.mover, function () {
      // Primeira vez: o contorno se desenha (Draw a path) e o preenchimento entra depois.
      var tl = gsap.timeline({ scrollTrigger: { trigger: morph, start: 'top 75%', once: true } });
      tl.set(pf, { opacity: 0 }).set(traco, { opacity: 1 })
        .fromTo(traco, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, ease: 'power2.inOut' })
        .to(pf, { opacity: 1, duration: 0.5 }, '-=0.3')
        .to(traco, { opacity: 0, duration: 0.4 }, '<');
      var k = 0, loop = gsap.timeline({ repeat: -1, paused: true });
      LISTA.forEach(function (_, j) {
        var prox = (j + 1) % LISTA.length;
        loop.to(pf, { morphSVG: { shape: formas[prox], shapeIndex: 'auto' }, duration: 1.1, ease: 'expo.inOut',
          onStart: function () { k = prox; }, onComplete: function () { marca(prox); } }, '+=1.6');
      });
      tl.add(function () { loop.play(); });
      var st = ScrollTrigger.create({ trigger: morph, start: 'top bottom', end: 'bottom top', onToggle: function (s) { if (tl.progress() === 1) s.isActive ? loop.play() : loop.pause(); } });
      return function () { loop.kill(); st.kill(); gsap.set([pf, traco], { clearProps: 'all' }); pf.setAttribute('d', formas[0]); marca(0); };
    });
  }

  /* ---------- 2. Títulos que entram linha por linha (Responsive line splits on scroll) ---------- */
  mm.add(COND.mover, function () {
    var alvos = $$('.sec-head h2, .sec-head > div > p, .faq-side h2, .about h2, .contact h2, .contact .cl, #h-ig, .ig-side p');
    var splits = alvos.map(function (el) {
      return SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'ln',
        onSplit: function (self) { return gsap.from(self.lines, { yPercent: 110, duration: 0.95, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }); } });
    });
    var h1 = $('#h1');
    if (h1) splits.push(SplitText.create(h1, { type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: function (self) { return gsap.from(self.lines, { yPercent: 105, duration: 1.1, stagger: 0.1, ease: 'expo.out', delay: 0.35 }); } }));
    return function () { splits.forEach(function (s) { s.revert(); }); };
  });

  /* ---------- 3. Botões magnéticos (Magnetic button, overwrite: 'auto') ---------- */
  mm.add(COND.mover + ' and ' + COND.mouse, function () {
    var fns = [];
    $$('.btn, .tema').forEach(function (b) {
      var forca = b.classList.contains('tema') ? 0.4 : 0.32;
      var xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      var mov = function (e) { var r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * forca); yTo((e.clientY - r.top - r.height / 2) * forca); };
      var sai = function () { gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' }); };
      b.addEventListener('pointermove', mov); b.addEventListener('pointerleave', sai);
      fns.push(function () { b.removeEventListener('pointermove', mov); b.removeEventListener('pointerleave', sai); gsap.set(b, { clearProps: 'x,y' }); });
    });
    return function () { fns.forEach(function (f) { f(); }); };
  });

  /* ---------- 4. Grade de símbolos: escala por proximidade (Proximity scale grid) ---------- */
  var grade = $('#sgrid');
  if (grade) mm.add(COND.mover + ' and ' + COND.mouse, function () {
    grade.classList.add('prox');
    var RAIO = 260, MAX = 0.32, cache = null;
    var montar = function () { cache = $$('.stile', grade).map(function (t) { var svg = t.querySelector('svg'), sx = gsap.quickTo(svg, 'scaleX', { duration: 0.45, ease: 'power3' }), sy = gsap.quickTo(svg, 'scaleY', { duration: 0.45, ease: 'power3' }); return { t: t, s: function (v) { sx(v); sy(v); } }; }); };
    var mov = function (e) {
      if (!cache || cache.length !== grade.children.length) montar();
      cache.forEach(function (c) {
        var r = c.t.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        c.s(1 + MAX * Math.max(0, 1 - d / RAIO) * Math.max(0, 1 - d / RAIO));
      });
    };
    var sai = function () { if (cache) cache.forEach(function (c) { c.s(1); }); };
    grade.addEventListener('pointermove', mov); grade.addEventListener('pointerleave', sai);
    window.cpGradeMudou = function () { cache = null; };
    return function () { grade.classList.remove('prox'); grade.removeEventListener('pointermove', mov); grade.removeEventListener('pointerleave', sai); window.cpGradeMudou = null; gsap.set($$('.stile svg', grade), { clearProps: 'transform' }); };
  });

  /* ---------- 5. Grade que se reorganiza com animação (Animate CSS grid positions, Flip) ---------- */
  var estado = null;
  window.cpFlip = {
    antes: function () { if (!window.matchMedia(COND.mover).matches || !grade) return; estado = Flip.getState($$('.stile', grade)); },
    depois: function () {
      if (window.cpGradeMudou) window.cpGradeMudou();
      if (!estado) return;
      Flip.from(estado, { targets: $$('.stile', grade), duration: 0.75, ease: 'power3.inOut', stagger: { amount: 0.25, from: 'random' }, absolute: false, scale: true,
        onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.012, ease: 'power2.out' }); } });
      estado = null;
    }
  };

  /* ---------- 6. Pilha de cartões 50 → 15 → 3 → 1 (Card stack) ---------- */
  var met = $('.met');
  if (met) mm.add(COND.mover, function () {
    met.classList.add('pilha');
    var cards = $$(':scope > div', met), n = cards.length;
    var tl = gsap.timeline({ defaults: { ease: 'none' } });
    cards.forEach(function (c, i) {
      if (!i) return;
      tl.fromTo(c, { yPercent: 112 }, { yPercent: 0, duration: 1 }, i - 1);
      for (var j = 0; j < i; j++) {
        tl.to(cards[j], { scale: 1 - 0.05 * (i - j), yPercent: -7 * (i - j), duration: 1 }, i - 1)
          .to(cards[j].children, { opacity: Math.max(0.15, 1 - 0.45 * (i - j)), duration: 1 }, i - 1);   // o fundo continua cobrindo; só o texto de trás apaga
      }
    });
    var st = ScrollTrigger.create({ trigger: met, start: 'top 16%', end: function () { return '+=' + Math.round(innerHeight * 0.55 * (n - 1)); }, pin: true, scrub: 0.6, animation: tl, anticipatePin: 1 });
    return function () { st.kill(); tl.kill(); met.classList.remove('pilha'); gsap.set(cards, { clearProps: 'all' }); cards.forEach(function (c) { gsap.set(c.children, { clearProps: 'opacity' }); }); };
  });

  /* ---------- 7. Etapas ligadas por uma linha que se desenha, com um ponto andando nela (Draw a path + Animate along a path) ---------- */
  var flow = $('.flow');
  if (flow) mm.add(COND.mover, function () {
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'flow-linha'); svg.setAttribute('aria-hidden', 'true');
    var linha = document.createElementNS(NS, 'path'), ponto = document.createElementNS(NS, 'circle');
    linha.setAttribute('class', 'fl'); ponto.setAttribute('r', '6'); ponto.setAttribute('class', 'fp');
    svg.appendChild(linha); svg.appendChild(ponto); flow.prepend(svg); flow.classList.add('vivo');
    var itens = $$(':scope > li', flow), marcos = [], tl = null, st = null;
    var monta = function () {
      var fr = flow.getBoundingClientRect(); svg.setAttribute('viewBox', '0 0 ' + fr.width + ' ' + fr.height);
      svg.style.width = fr.width + 'px'; svg.style.height = fr.height + 'px';
      var pts = itens.map(function (li) { var k = li.querySelector('.k').getBoundingClientRect(), lr = li.getBoundingClientRect(); return { x: k.left - fr.left - 12, y: k.top - fr.top + k.height / 2, topo: lr.top - fr.top }; });
      var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1), parcial = [0], medidor = document.createElementNS(NS, 'path');
      svg.appendChild(medidor);
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i];
        if (Math.abs(b.y - a.y) < 8) d += ' L' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
        else { // muda de linha: desce até a divisa das linhas, anda por ela e desce até a próxima etapa
          var meio = b.topo - 1, r = 14, dirX = b.x < a.x ? -1 : 1;
          d += ' L' + a.x.toFixed(1) + ' ' + (meio - r).toFixed(1) + ' Q' + a.x.toFixed(1) + ' ' + meio.toFixed(1) + ' ' + (a.x + dirX * r).toFixed(1) + ' ' + meio.toFixed(1);
          if (Math.abs(b.x - a.x) > 2 * r) d += ' L' + (b.x - dirX * r).toFixed(1) + ' ' + meio.toFixed(1) + ' Q' + b.x.toFixed(1) + ' ' + meio.toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + (meio + r).toFixed(1);
          d += ' L' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
        }
        medidor.setAttribute('d', d); parcial.push(medidor.getTotalLength());
      }
      medidor.remove(); linha.setAttribute('d', d);
      var total = parcial[parcial.length - 1] || 1; marcos = parcial.map(function (p) { return p / total; });
    };
    var acende = function (p) { itens.forEach(function (li, i) { li.classList.toggle('on', p >= marcos[i] - 0.002); }); };
    var cria = function () {
      if (st) st.kill(); if (tl) tl.kill();
      monta();
      tl = gsap.timeline({ defaults: { ease: 'none' } })
        .fromTo(linha, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1 }, 0)
        .to(ponto, { motionPath: { path: linha, align: linha, alignOrigin: [0.5, 0.5] }, duration: 1 }, 0);
      st = ScrollTrigger.create({ trigger: flow, start: 'top 72%', end: 'bottom 55%', scrub: 0.8, animation: tl, onUpdate: function (s) { acende(s.progress); } });
      acende(st.progress);
    };
    cria();
    // Depois que a página recalcula as posições (fontes, tamanho da janela, pilha fixada), só redesenha a linha.
    var refaz = function () { if (!st) return; monta(); var pr = st.progress; tl.invalidate(); tl.progress(pr); acende(pr); };
    ScrollTrigger.addEventListener('refresh', refaz);
    return function () { ScrollTrigger.removeEventListener('refresh', refaz); if (st) st.kill(); if (tl) tl.kill(); svg.remove(); flow.classList.remove('vivo'); itens.forEach(function (li) { li.classList.remove('on'); }); };
  });

  /* ---------- 8. Rastro de símbolos atrás do cursor no contato (Cursor trail) ---------- */
  var contato = $('#contato');
  if (contato && typeof S !== 'undefined') mm.add(COND.mover + ' and ' + COND.mouse, function () {
    var camada = document.createElement('div'); camada.className = 'rastro'; camada.setAttribute('aria-hidden', 'true'); contato.prepend(camada);
    var ultimo = null, k = 0, PASSO = 70;
    var mov = function (e) {
      var r = contato.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (ultimo && Math.hypot(x - ultimo.x, y - ultimo.y) < PASSO) return;
      ultimo = { x: x, y: y };
      var el = document.createElement('div'); el.className = 'rs'; el.innerHTML = use(Math.floor(Math.random() * N)); camada.appendChild(el);
      gsap.set(el, { x: x, y: y, xPercent: -50, yPercent: -50, rotation: gsap.utils.random(-30, 30), scale: 0 });
      gsap.timeline({ onComplete: function () { el.remove(); } })
        .to(el, { scale: 1, duration: 0.35, ease: 'back.out(2)' })
        .to(el, { scale: 0, opacity: 0, rotation: '+=40', duration: 0.6, ease: 'power2.in' }, 0.55);
      if (camada.children.length > 28) camada.firstChild.remove();
      k++;
    };
    contato.addEventListener('pointermove', mov);
    return function () { contato.removeEventListener('pointermove', mov); camada.remove(); };
  });

  /* ---------- 9. Borda do contato que quica ao chegar no fim da página (Footer bounce) ---------- */
  if (contato) mm.add(COND.mover, function () {
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'quique'); svg.setAttribute('viewBox', '0 0 1000 200'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path'); svg.appendChild(p); contato.prepend(svg);
    var curva = { a: 0 }, desenha = function () { p.setAttribute('d', 'M0 100 Q500 ' + (100 - curva.a).toFixed(1) + ' 1000 100 L1000 200 L0 200 Z'); };
    desenha();
    var volta = null;
    var st = ScrollTrigger.create({ trigger: contato, start: 'top bottom', end: 'top 30%',
      onUpdate: function (s) {
        var alvo = gsap.utils.clamp(-80, 95, s.getVelocity() / 28);
        if (volta) volta.kill();
        gsap.to(curva, { a: alvo, duration: 0.25, ease: 'power2.out', overwrite: 'auto', onUpdate: desenha,
          onComplete: function () { volta = gsap.to(curva, { a: 0, duration: 1.5, ease: 'elastic.out(1, 0.28)', onUpdate: desenha }); } });
      } });
    return function () { st.kill(); svg.remove(); };
  });

  // As fontes mudam a altura das linhas: recalcula as posições quando terminarem de carregar.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
