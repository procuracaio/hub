/* Página interna de cada símbolo (#sNN) com GSAP. Estúdio Caio Pires, nov/2026.
   A página é uma janela (#sp) que rola por dentro: todo ScrollTrigger usa scroller: #sp.
   src/pagina.html chama window.cpSimbolo(i) depois de montar a página e window.cpSimboloSai(fechou) antes de trocar ou fechar.
   Tudo o que é criado aqui fica num gsap.context e é desfeito ao sair. Com movimento reduzido, nada roda.
   Depende de gsap, ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin e de S, N, sno, use, geo e openRoute (src/pagina.html). */
(function () {
  'use strict';
  if (!window.gsap || typeof S === 'undefined') return;
  var NS = 'http://www.w3.org/2000/svg';
  var MOVE = '(prefers-reduced-motion: no-preference)', MOUSE = '(hover: hover) and (pointer: fine)';
  var ctx = null, anterior = null, limpar = [];

  function caminho100(i) {
    var sym = document.getElementById('s' + i); if (!sym) return '';
    var vb = sym.getAttribute('viewBox').split(/\s+/).map(Number), k = 100 / vb[2];
    var raw = MotionPathPlugin.stringToRawPath(S[i].d.join(' '));
    MotionPathPlugin.transformRawPath(raw, k, 0, 0, k, -vb[0] * k, -vb[1] * k);
    return MotionPathPlugin.rawPathToString(raw);
  }
  // Conta de 0 até o número que está escrito (aceita "64%", "1 : 1,27").
  function conta(el, atraso, rolagem) {
    var orig = el.textContent, partes = orig.split(/(\d+(?:,\d+)?)/);
    if (partes.length < 2) return;
    var nums = partes.map(function (p, k) { return k % 2 ? { v: parseFloat(p.replace(',', '.')), d: (p.split(',')[1] || '').length } : null; });
    var o = { t: 0 };
    gsap.to(o, { t: 1, duration: 1.6, delay: atraso || 0, ease: 'power3.out', scrollTrigger: rolagem,
      onUpdate: function () { el.textContent = partes.map(function (p, k) { return k % 2 ? (nums[k].v * o.t).toFixed(nums[k].d).replace('.', ',') : p; }).join(''); },
      onComplete: function () { el.textContent = orig; } });
  }

  window.cpSimboloSai = function (fechou) {
    limpar.forEach(function (f) { try { f(); } catch (e) { /* já saiu */ } }); limpar = [];
    if (ctx) { ctx.revert(); ctx = null; }
    if (fechou) anterior = null;
  };

  window.cpSimbolo = function (i) {
    window.cpSimboloSai(false);
    var veio = anterior; anterior = i;
    if (!matchMedia(MOVE).matches) return;
    var sp = document.getElementById('sp'), body = document.getElementById('spBody');
    if (!sp || !body || sp.hidden) return;
    var mouse = matchMedia(MOUSE).matches;
    var R = function (trigger, extra) { var o = { trigger: trigger, scroller: sp, start: 'top 82%', once: true }; for (var k in extra) o[k] = extra[k]; return o; };
    var $ = function (s) { return body.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(body.querySelectorAll(s)); };

    ctx = gsap.context(function () {
      /* 0. Barra de leitura no topo da janela */
      var barra = document.createElement('i'); barra.className = 'sp-prog'; var topo = sp.querySelector('.sp-bar'); topo.appendChild(barra);
      limpar.push(function () { barra.remove(); });
      gsap.fromTo(barra, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { scroller: sp, start: 0, end: 'max', scrub: 0.3 } });

      /* 1. Palco: o contorno se desenha e se preenche; vindo de outro símbolo, a forma anterior vira a nova (morph) */
      var stage = $('.stage'), velho = stage.querySelector('svg');
      var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'sp-viva');
      var forma = document.createElementNS(NS, 'path'), traco = document.createElementNS(NS, 'path');
      var d = caminho100(i);
      forma.setAttribute('fill', 'currentColor'); forma.setAttribute('fill-rule', S[i].ev ? 'evenodd' : 'nonzero');
      traco.setAttribute('fill', 'none'); traco.setAttribute('stroke', 'currentColor'); traco.setAttribute('stroke-width', '.35'); traco.setAttribute('d', d);
      svg.appendChild(forma); svg.appendChild(traco); velho.style.visibility = 'hidden'; stage.appendChild(svg);
      limpar.push(function () { svg.remove(); velho.style.visibility = ''; });
      var ticks = $$('.tick');
      var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
      intro.from(stage, { scale: 0.9, opacity: 0, duration: 1 })
        .from(ticks, { x: function (k) { return k % 2 ? -40 : 40; }, y: function (k) { return k < 2 ? 40 : -40; }, opacity: 0, duration: 0.9, stagger: 0.06 }, 0.15);
      if (veio !== null && veio !== i) {
        forma.setAttribute('d', caminho100(veio)); gsap.set(traco, { opacity: 0 });
        intro.to(forma, { morphSVG: { shape: d, shapeIndex: 'auto' }, duration: 1.2, ease: 'expo.inOut' }, 0.1)
          .add(function () { forma.setAttribute('fill-rule', S[i].ev ? 'evenodd' : 'nonzero'); }, 0.7);
      } else {
        forma.setAttribute('d', d);
        intro.set(forma, { opacity: 0 }, 0)
          .fromTo(traco, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.6, ease: 'power2.inOut' }, 0.2)
          .to(forma, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.45)
          .to(traco, { opacity: 0, duration: 0.5 }, 1.6);
      }
      // O palco inclina em 3D seguindo o mouse
      if (mouse) {
        gsap.set(stage, { transformPerspective: 900 });
        var rx = gsap.quickTo(stage, 'rotationX', { duration: 0.6, ease: 'power3' }), ry = gsap.quickTo(stage, 'rotationY', { duration: 0.6, ease: 'power3' });
        var sx = gsap.quickTo(svg, 'x', { duration: 0.8, ease: 'power3' }), sy = gsap.quickTo(svg, 'y', { duration: 0.8, ease: 'power3' });
        var mov = function (e) { var r = stage.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5; rx(-py * 14); ry(px * 14); sx(px * 4); sy(py * 4); };
        var sai = function () { rx(0); ry(0); sx(0); sy(0); };
        stage.addEventListener('pointermove', mov); stage.addEventListener('pointerleave', sai);
        limpar.push(function () { stage.removeEventListener('pointermove', mov); stage.removeEventListener('pointerleave', sai); });
      }

      /* 2. Texto do topo: título palavra por palavra, frase em linhas, números contando */
      var h1 = $('#spT');
      if (h1) SplitText.create(h1, { type: 'words,lines', mask: 'lines', autoSplit: true, onSplit: function (s) { return gsap.from(s.words, { yPercent: 110, rotation: 4, duration: 0.9, stagger: 0.035, ease: 'expo.out', delay: 0.25 }); } });
      var rest = $('.sp-hero .rest');
      if (rest) SplitText.create(rest, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: function (s) { return gsap.from(s.lines, { yPercent: 105, duration: 0.9, stagger: 0.07, ease: 'expo.out', delay: 0.5 }); } });
      gsap.from($('.sp-hero .lbl'), { opacity: 0, x: -14, duration: 0.6, delay: 0.15 });
      var specs = $('.specs');
      if (specs) {
        specs.classList.add('sp-linha'); limpar.push(function () { specs.classList.remove('sp-linha'); });
        gsap.fromTo(specs, { '--linha': 0 }, { '--linha': 1, duration: 1.2, ease: 'expo.inOut', delay: 0.5 });
        $$('.specs div').forEach(function (dv, k) { gsap.from(dv, { y: 18, opacity: 0, duration: 0.7, delay: 0.6 + k * 0.08, ease: 'power3.out' }); });
        $$('.specs b').forEach(function (b, k) { conta(b, 0.65 + k * 0.08); });
      }

      /* 3. Títulos de cada bloco entram em linhas ao rolar */
      $$('.blk-h h2, .blk-h p, .spcta h2').forEach(function (el) {
        SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: function (s) { return gsap.from(s.lines, { yPercent: 110, duration: 0.95, stagger: 0.08, ease: 'expo.out', scrollTrigger: R(el) }); } });
      });
      $$('.blk-h .lbl').forEach(function (el) { gsap.from(el, { opacity: 0, x: -16, duration: 0.6, scrollTrigger: R(el) }); });

      /* 4. Construção: o quadro se inclina ao entrar e cada etapa ganha o seu movimento */
      var cv = $('#cv');
      if (cv) {
        gsap.fromTo(cv, { rotationX: 28, y: 60, transformPerspective: 1100, transformOrigin: '50% 100%' }, { rotationX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: cv, scroller: sp, start: 'top bottom', end: 'top 35%', scrub: 0.6 } });
        gsap.from($$('.sstep'), { x: 40, opacity: 0, duration: 0.8, stagger: 0.09, ease: 'expo.out', scrollTrigger: R($('.ssteps')) });
        // as linhas da malha são tracejadas: crescem do meio (attr), sem DrawSVG, para não perder o tracejado
        var linhas = $$('#cv .gridL line'), aneis = $$('#cv .gridL circle'), caixa = $$('#cv .boxL line, #cv .boxL rect');
        var cresce = function (els, o) { els.forEach(function (l, k) {
          var a = ['x1', 'y1', 'x2', 'y2'].map(function (n) { return +l.getAttribute(n); }), mx = (a[0] + a[2]) / 2, my = (a[1] + a[3]) / 2;
          gsap.fromTo(l, { attr: { x1: mx, y1: my, x2: mx, y2: my } }, { attr: { x1: a[0], y1: a[1], x2: a[2], y2: a[3] }, duration: o.duration, delay: (o.delay || 0) + Math.abs(k - els.length / 2) * o.passo, ease: o.ease, overwrite: true });
        }); };
        var pontos = $$('#cv .pts rect, #cv .pts circle'), alcas = $$('#cv .pts line'), fill = $('#cv .fillL');
        var etapa = function (s) {
          if (s === '1') { cresce(linhas, { duration: 1.1, passo: 0.05, ease: 'power3.out' });
            gsap.fromTo(aneis, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 1.3, stagger: 0.15, ease: 'expo.out', delay: 0.2, overwrite: true });
            gsap.fromTo(caixa, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, stagger: 0.05, ease: 'power2.inOut', delay: 0.3, overwrite: true }); }
          if (s === '3') { gsap.fromTo(pontos, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, stagger: { amount: 0.9, from: 'random' }, ease: 'back.out(3)', overwrite: true });
            gsap.fromTo(alcas, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, stagger: { amount: 0.8, from: 'random' }, overwrite: true }); }
          if (s === '4' && fill) gsap.fromTo(fill, { scale: 0.94, transformOrigin: '50% 50%' }, { scale: 1, duration: 1.1, ease: 'elastic.out(1, 0.45)', overwrite: true });
        };
        var mo = new MutationObserver(function () { etapa(cv.dataset.s); });
        mo.observe(cv, { attributes: true, attributeFilter: ['data-s'] }); limpar.push(function () { mo.disconnect(); });
        etapa(cv.dataset.s);
      }

      /* 5. Simetria: a cópia gira ou espelha até o lugar dela; percentuais contam e as barras enchem */
      var g = geo(i), origem = g.cx + ' ' + g.cy;
      var giros = [{ scaleX: -1 }, { scaleY: -1 }, { rotation: 90 }, { rotation: 180 }];
      $$('.sym4 .sc').forEach(function (card, k) {
        var copia = card.querySelectorAll('svg use')[1], eixo = card.querySelector('svg g line, svg g circle'), pc = card.querySelector('.pc'), barra = card.querySelector('.meter i');
        if (copia) copia.removeAttribute('transform');
        var tl = gsap.timeline({ paused: true });
        tl.fromTo(copia, { scaleX: 1, scaleY: 1, rotation: 0, svgOrigin: origem }, Object.assign({ duration: 1.4, ease: 'power3.inOut', svgOrigin: origem }, giros[k]), 0);
        if (eixo && eixo.tagName === 'line') { var e4 = ['x1', 'y1', 'x2', 'y2'].map(function (n) { return +eixo.getAttribute(n); });
          tl.fromTo(eixo, { attr: { x1: (e4[0] + e4[2]) / 2, y1: (e4[1] + e4[3]) / 2, x2: (e4[0] + e4[2]) / 2, y2: (e4[1] + e4[3]) / 2 } }, { attr: { x1: e4[0], y1: e4[1], x2: e4[2], y2: e4[3] }, duration: 0.8, ease: 'power2.out' }, 0); }
        else if (eixo) tl.fromTo(eixo, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }, 0);
        if (barra) tl.from(barra, { scaleX: 0, transformOrigin: '0 50%', duration: 1.3, ease: 'power3.out' }, 0.3);
        gsap.from(card, { y: 70, rotationX: -40, opacity: 0, transformPerspective: 900, transformOrigin: '50% 100%', duration: 1, delay: k * 0.1, ease: 'expo.out',
          scrollTrigger: R($('.sym4'), { onEnter: function () { gsap.delayedCall(0.25 + k * 0.12, function () { tl.play(0); }); } }) });
        if (pc) conta(pc, 0.4 + k * 0.12, R($('.sym4')));
        // passar o mouse refaz o giro
        var refaz = function () { tl.play(0); }; card.addEventListener('pointerenter', refaz); limpar.push(function () { card.removeEventListener('pointerenter', refaz); });
      });

      /* 6. Redução: os tamanhos caem em cascata; a aba e os ícones aparecem */
      var srow = $$('.srow');
      srow.forEach(function (row, k) { gsap.from(row.querySelectorAll('.sz'), { y: k ? -50 : 50, scale: 0.4, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'back.out(1.8)', scrollTrigger: R(row) }); });
      var tab = $('.mock .tab');
      if (tab) {
        var tlTab = gsap.timeline({ scrollTrigger: R(tab) });
        tlTab.from(tab, { y: -30, opacity: 0, duration: 0.8, ease: 'expo.out' })
          .from(tab.querySelector('.tb svg'), { rotation: -360, scale: 0, transformOrigin: '50% 50%', duration: 1, ease: 'back.out(2)' }, 0.2)
          .from($$('.icons .app'), { y: 40, scale: 0.6, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'back.out(2.2)' }, 0.3);
      }

      /* 7. Padrão: as peças nascem do centro; trocar a regra ou a cor faz nascer de novo */
      var pv = $('#pv');
      var nasce = function () {
        var pecas = pv ? pv.querySelectorAll('use') : []; if (!pecas.length) return;
        // cada peça já tem o próprio transform (posição, giro, espelho): anima só a opacidade, em onda a partir do centro, e o quadro inteiro respira
        gsap.from(pecas, { opacity: 0, duration: 0.5, ease: 'power2.out', stagger: { amount: 0.9, grid: 'auto', from: 'center' } });
        gsap.fromTo(pv.firstElementChild, { scale: 1.12, rotation: -4, transformOrigin: '50% 50%' }, { scale: 1, rotation: 0, duration: 1.4, ease: 'expo.out' });
      };
      if (pv) {
        ScrollTrigger.create(R(pv, { onEnter: function () { requestAnimationFrame(nasce); } }));
        var clique = function (e) { if (e.target.closest('[data-m], [data-c]')) requestAnimationFrame(function () { requestAnimationFrame(nasce); }); };
        var ctl = $('.pctl'); ctl.addEventListener('click', clique); limpar.push(function () { ctl.removeEventListener('click', clique); });
        gsap.from($$('.pctl .field, .pctl .pnote'), { x: 30, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out', scrollTrigger: R($('.pctl')) });
      }

      /* 8. Faixa infinita com o acervo inteiro, que acelera com a rolagem; tocar abre o símbolo */
      var cta = $('.spcta .wrap'), nextp = $('.nextp');
      if (cta && nextp) {
        var faixa = document.createElement('div'); faixa.className = 'sp-marq';
        var linha = function (dir) {
          var trilho = document.createElement('div'); trilho.className = 'mq-t';
          var lista = []; for (var k = 0; k < N; k++) lista.push(k);
          if (dir < 0) lista.reverse();
          var html = lista.map(function (k) { return '<button type="button" class="mq" data-k="' + k + '" aria-label="Símbolo ' + sno(k) + '">' + use(k) + '</button>'; }).join('');
          trilho.innerHTML = html + html.replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ');
          return trilho;
        };
        var t1 = linha(1), t2 = linha(-1); faixa.appendChild(t1); faixa.appendChild(t2); cta.insertBefore(faixa, nextp);
        limpar.push(function () { faixa.remove(); });
        var a1 = gsap.fromTo(t1, { xPercent: 0 }, { xPercent: -50, duration: 70, ease: 'none', repeat: -1 });
        var a2 = gsap.fromTo(t2, { xPercent: -50 }, { xPercent: 0, duration: 70, ease: 'none', repeat: -1 });
        ScrollTrigger.create({ trigger: faixa, scroller: sp, start: 'top bottom', end: 'bottom top', onUpdate: function (s) {
          var v = Math.min(8, 1 + Math.abs(s.getVelocity()) / 220);
          gsap.to([a1, a2], { timeScale: v, duration: 0.2, overwrite: true, onComplete: function () { gsap.to([a1, a2], { timeScale: 1, duration: 1.2, ease: 'power2.out' }); } });
          gsap.to([t1, t2], { skewX: gsap.utils.clamp(-12, 12, s.getVelocity() / -160), duration: 0.3, overwrite: 'auto', onComplete: function () { gsap.to([t1, t2], { skewX: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' }); } });
        } });
        faixa.addEventListener('click', function (e) { var b = e.target.closest('.mq'); if (b) openRoute('#s' + sno(+b.dataset.k)); });
        if (mouse) {
          var para = function () { gsap.to([a1, a2], { timeScale: 0.15, duration: 0.6 }); }, volta = function () { gsap.to([a1, a2], { timeScale: 1, duration: 0.8 }); };
          faixa.addEventListener('pointerenter', para); faixa.addEventListener('pointerleave', volta);
        }
        gsap.from(faixa, { opacity: 0, y: 40, duration: 1, ease: 'expo.out', scrollTrigger: R(faixa) });
      }
      // Anterior e próximo: o mini símbolo gira ao passar o mouse
      $$('.nx').forEach(function (b) {
        var mini = b.querySelector('.mini svg');
        var entra = function () { gsap.to(mini, { rotation: b.classList.contains('r') ? 90 : -90, scale: 1.15, duration: 0.6, ease: 'back.out(2)' }); };
        var sai = function () { gsap.to(mini, { rotation: 0, scale: 1, duration: 0.6, ease: 'power3.out' }); };
        b.addEventListener('pointerenter', entra); b.addEventListener('pointerleave', sai);
      });
      gsap.from($$('.nextp .nx'), { y: 30, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'expo.out', scrollTrigger: R(nextp) });

      /* 9. Botões magnéticos e cursor que segue o mouse (só no computador) */
      if (mouse) {
        $$('.btn').forEach(function (b) {
          var xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
          b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.3); });
          b.addEventListener('pointerleave', function () { gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' }); });
        });
        var cur = document.createElement('i'); cur.className = 'sp-cur'; cur.setAttribute('aria-hidden', 'true'); sp.appendChild(cur);
        limpar.push(function () { cur.remove(); });
        gsap.set(cur, { xPercent: -50, yPercent: -50, scale: 0 });
        var cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
        var anda = function (e) { cx(e.clientX); cy(e.clientY); var alvo = e.target.closest && e.target.closest('a, button, input, .stage, .sc, .cv');
          gsap.to(cur, { scale: alvo ? (alvo.matches('.stage, .sc, .cv') ? 3.2 : 2) : 1, duration: 0.35, overwrite: 'auto' }); };
        var some = function () { gsap.to(cur, { scale: 0, duration: 0.3 }); };
        sp.addEventListener('pointermove', anda); sp.addEventListener('pointerleave', some);
        limpar.push(function () { sp.removeEventListener('pointermove', anda); sp.removeEventListener('pointerleave', some); });
      }
    }, body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  };

  // Se a página abriu direto num símbolo (#sNN), anima assim que os arquivos chegarem.
  try { var spEl = document.getElementById('sp'); if (spEl && !spEl.hidden && typeof cur_i !== 'undefined' && cur_i >= 0) window.cpSimbolo(cur_i); } catch (e) { /* segue sem animação */ }
})();
