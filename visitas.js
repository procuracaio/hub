// Contador de visitas do Estúdio Caio Pires (próprio, sem cookies e sem dado pessoal).
// Anota no Supabase só: a página, de onde a sessão veio, o tipo de aparelho e um código aleatório
// da aba (guardado no sessionStorage, some quando a aba fecha). Nada de IP, nome ou identificador fixo.
// Os números aparecem na tela Marketing do sistema (app.caiopires.com.br/#/marketing).
//
// Para não contar as suas próprias visitas: abra caiopires.com.br/?nao-contar uma vez em cada
// aparelho e navegador. Para voltar a contar: caiopires.com.br/?contar
(function () {
  'use strict';
  var URL_SUPA = 'https://ggbpjskoclyaecdpidvh.supabase.co';
  var CHAVE = 'sb_publishable_tzUjxvtzxlCf1cbZywaJZg_vSUzVht8'; // chave pública (só abre o que as regras do banco permitem)
  try {
    var q = new URLSearchParams(location.search);
    if (q.has('nao-contar')) { localStorage.setItem('cp_nao_contar', '1'); avisar('Pronto: as visitas deste navegador não entram mais na contagem do site.'); }
    if (q.has('contar')) { localStorage.removeItem('cp_nao_contar'); avisar('Pronto: as visitas deste navegador voltam a ser contadas.'); }
    if (localStorage.getItem('cp_nao_contar') === '1') return;
  } catch (e) { /* sem localStorage: segue contando */ }
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  if (/bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp/i.test(navigator.userAgent || '')) return;

  // De onde a sessão veio: marcação no link (?de=bio, utm_source), anúncio ou o site de origem.
  function origem() {
    var q = new URLSearchParams(location.search);
    var de = (q.get('de') || q.get('utm_source') || '').toLowerCase().trim();
    var meio = (q.get('utm_medium') || '').toLowerCase();
    if (de === 'bio') return 'Instagram (bio)';
    if (q.get('gclid')) return 'Anúncio Google';
    if (/cpc|paid|ads|anuncio/.test(meio)) return de ? 'Anúncio ' + cap(de) : 'Anúncio';
    if (de) return cap(de).slice(0, 40);
    var r = '';
    try { r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) { r = ''; }
    if (!r || r === location.hostname.replace(/^www\./, '')) return 'Direto';
    if (/(^|\.)instagram\.com$/.test(r)) return 'Instagram';
    if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(r)) return 'Facebook';
    if (/(^|\.)google\./.test(r)) return 'Google';
    if (/(^|\.)(bing\.com|duckduckgo\.com|yahoo\.com|ecosia\.org|search\.brave\.com)$/.test(r)) return 'Outras buscas';
    if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(r)) return 'WhatsApp';
    if (/(^|\.)linkedin\.com$|lnkd\.in$/.test(r)) return 'LinkedIn';
    if (/(^|\.)(t\.co|x\.com|twitter\.com)$/.test(r)) return 'X';
    if (/(^|\.)behance\.net$/.test(r)) return 'Behance';
    if (/(^|\.)pinterest\./.test(r)) return 'Pinterest';
    if (/caiopires\.com\.br$/.test(r)) return 'Sistema do estúdio';
    return r.slice(0, 40);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function aparelho() {
    var toque = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    var w = Math.min(screen.width || innerWidth, screen.height || innerHeight);
    return toque ? (w >= 600 ? 'tablet' : 'celular') : 'computador';
  }
  function aleatorio() {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', s = '';
    var n = new Uint32Array(16); (window.crypto || window.msCrypto).getRandomValues(n);
    for (var i = 0; i < n.length; i++) s += a[n[i] % a.length];
    return s;
  }
  function avisar(t) {
    var mostrar = function () { var d = document.createElement('div'); d.textContent = t; d.setAttribute('role', 'status');
      d.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;background:#111;color:#fff;padding:12px 18px;border-radius:999px;font:14px/1.4 system-ui,sans-serif;max-width:calc(100% - 32px);text-align:center';
      document.body.appendChild(d); setTimeout(function () { d.remove(); }, 5000); };
    if (document.body) mostrar(); else document.addEventListener('DOMContentLoaded', mostrar);
  }

  var sessao, nova = false, ori;
  try {
    sessao = sessionStorage.getItem('cp_s'); ori = sessionStorage.getItem('cp_o');
    if (!sessao) { sessao = aleatorio(); nova = true; ori = origem(); sessionStorage.setItem('cp_s', sessao); sessionStorage.setItem('cp_o', ori); }
  } catch (e) { sessao = aleatorio(); nova = true; ori = origem(); }

  var ultima = '';
  function anotar(pagina) {
    if (pagina === ultima) return; ultima = pagina;
    var corpo = JSON.stringify({ p_pagina: pagina, p_origem: ori, p_dispositivo: aparelho(), p_sessao: sessao, p_nova: nova });
    nova = false;
    try {
      fetch(URL_SUPA + '/rest/v1/rpc/registrar_visita', { method: 'POST', keepalive: true, headers: { apikey: CHAVE, 'Content-Type': 'application/json' }, body: corpo }).catch(function () {});
    } catch (e) { /* sem rede: não conta */ }
  }
  // A página inicial abre projetos (#jessica) e símbolos (#s07) sem trocar de endereço: cada um conta como página.
  function paginaAtual() {
    var p = location.pathname.replace(/index\.html$/, '') || '/';
    var h = location.hash;
    if (p === '/' && /^#(s\d{1,3}|[a-z][a-z0-9-]{1,40})$/.test(h)) return '/' + h;
    return p;
  }
  anotar(paginaAtual());
  window.addEventListener('hashchange', function () { anotar(paginaAtual()); });
})();
