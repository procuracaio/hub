"""Gera o blog Radar de Marca a partir de radar/posts.json.

Saídas:
  radar/index.html          lista de posts
  radar/<slug>/index.html   uma página por post
  radar/feed.xml            feed RSS
  radar/simbolos.svg        símbolos usados nas capas de reserva
  bloco da página inicial   (devolvido para o build.py colocar no lugar de /*RADAR*/)

Cada post em posts.json tem: slug, data (AAAA-MM-DD), titulo, linha_fina, texto (lista de
parágrafos), por_que_importa, fonte, url, imagem (endereço da imagem de capa da matéria
original, ou "" quando não houver) e tags.
"""
import html, json, shutil
from datetime import date
from email.utils import format_datetime
from datetime import datetime, timezone
from pathlib import Path

MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
SITE = 'https://procuracaio.github.io/hub/'
e = lambda t: html.escape(str(t or ''), quote=True)


def data_longa(d):
    y, m, dd = map(int, d.split('-'))
    return f'{dd} de {MESES[m - 1]} de {y}'


def data_curta(d):
    y, m, dd = d.split('-')
    return f'{dd}.{m}.{y}'


def simbolo_do_post(slug, n):
    return sum(map(ord, slug)) % n


def sprite(syms):
    """Um <symbol> por símbolo, com caixa quadrada folgada (o símbolo ocupa ~46% da capa)."""
    out = ['<svg xmlns="http://www.w3.org/2000/svg">']
    for i, s in enumerate(syms):
        x, y, w, h = s['bb']; side = max(w, h) / .46; cx, cy = x + w / 2, y + h / 2
        fr = ' fill-rule="evenodd"' if s['ev'] else ''
        out.append(f'<symbol id="s{i + 1:02d}" viewBox="{cx - side / 2:.1f} {cy - side / 2:.1f} {side:.1f} {side:.1f}">' + ''.join(f'<path d="{d}"{fr}/>' for d in s['d']) + '</symbol>')
    out.append('</svg>')
    return '\n'.join(out)


def capa(p, base, n):
    k = simbolo_do_post(p['slug'], n) + 1
    img = (f'<img src="{e(p["imagem"])}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' if p.get('imagem') else '')
    return (f'<div class="rc-img"><svg class="cover" viewBox="0 0 100 100" aria-hidden="true"><use href="{base}simbolos.svg#s{k:02d}" width="100" height="100" fill="currentColor"/></svg>'
            f'<span class="cover-l">Radar de Marca</span>{img}</div>')


def cartao(p, base_link, base_sprite, n, tag='h3'):
    return (f'<a class="rc" href="{base_link}{e(p["slug"])}/">{capa(p, base_sprite, n)}'
            f'<div class="rc-b"><span class="lbl">{data_curta(p["data"])} · {e(p["fonte"])}</span><{tag}>{e(p["titulo"])}</{tag}><p>{e(p["linha_fina"])}</p></div></a>')


CSS = """
:root{--paper:#FAFAF8;--soft:#F1F1EE;--card:#FFFFFF;--line:#E6E6E3;--ink:#111111;--mute:#5C5C5A;
--display:'Inter Tight','Helvetica Neue',Arial,system-ui,sans-serif;--body:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--mono:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace;
--gut:max(clamp(16px,4vw,44px),env(safe-area-inset-left,0px));--gutr:max(clamp(16px,4vw,44px),env(safe-area-inset-right,0px))}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#111111;--soft:#1A1A19;--card:#161615;--line:#262624;--ink:#FAFAF8;--mute:#A3A3A0;color-scheme:dark}}
:root[data-theme="dark"]{--paper:#111111;--soft:#1A1A19;--card:#161615;--line:#262624;--ink:#FAFAF8;--mute:#A3A3A0;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:400 17px/1.6 var(--body);-webkit-font-smoothing:antialiased}
a{color:inherit}
:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.wrap{max-width:1200px;margin-inline:auto;padding-left:var(--gut);padding-right:var(--gutr)}
.lbl{font:500 12px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
h1,h2,h3{font-family:var(--display);font-weight:600;letter-spacing:-.03em;margin:0;text-wrap:balance}
.top{border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--paper) 92%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.bar{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:64px}
.wm{text-decoration:none;font:600 19px/1 var(--display);letter-spacing:-.02em;white-space:nowrap}
.nav{display:flex;align-items:center;gap:4px}
.nav a{text-decoration:none;font:500 14px/1 var(--body);padding:10px 12px;border-radius:999px;white-space:nowrap}
.nav a:hover{background:var(--soft)}
.nav a[aria-current]{background:var(--soft)}
.btn{display:inline-flex;align-items:center;gap:10px;padding:13px 20px;border-radius:999px;border:1.5px solid var(--ink);background:var(--ink);color:var(--paper);font:600 15px/1 var(--body);text-decoration:none}
.btn.ghost{background:transparent;color:var(--ink)}
.nav .btn{padding:10px 16px;font-size:14px;color:var(--paper)}
.nav .btn:hover{background:var(--ink);opacity:.88}
@media (max-width:640px){.nav .hide-s{display:none}.nav a{padding:10px 8px}.nav .btn{padding:10px 13px}}
@media (max-width:420px){.nav .lng{display:none}}
.head{padding-block:clamp(36px,6vw,80px) clamp(24px,4vw,48px)}
.head h1{font-size:clamp(44px,6.4vw,96px);line-height:.95;letter-spacing:-.045em;margin-top:14px}
.head p{color:var(--mute);font-size:clamp(17px,1.5vw,20px);max-width:34em;margin:22px 0 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:28px 22px;padding-bottom:80px}
.rc{text-decoration:none;display:flex;flex-direction:column;gap:14px}
.rc-img{position:relative;aspect-ratio:1200/630;background:#111111;color:#FAFAF8;overflow:hidden;border:1px solid var(--line)}
.rc-img .cover{position:absolute;inset:0;width:100%;height:100%}
.rc-img .cover-l{position:absolute;left:14px;bottom:12px;font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;opacity:.6}
.rc-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:var(--soft)}
.rc h3,.rc h2{font-size:22px;line-height:1.15;margin-top:8px}
.rc p{color:var(--mute);font-size:15px;line-height:1.5;margin:8px 0 0}
.rc:hover h3,.rc:hover h2{text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1.5px}
.empty{color:var(--mute);padding-bottom:80px}
.post{max-width:760px;margin-inline:auto;padding-block:clamp(28px,5vw,64px) 40px}
.back{text-decoration:none;font:500 14px/1 var(--body)}
.post h1{font-size:clamp(34px,4.6vw,58px);line-height:1.02;margin:18px 0 0}
.post .lf{font-size:clamp(19px,1.8vw,23px);color:var(--mute);margin:18px 0 0;line-height:1.45}
.meta{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:22px}
.post figure{margin:32px 0 0}
.post figcaption{margin-top:10px}
.corpo{margin-top:30px}
.corpo p{margin:0 0 18px;font-size:18px;line-height:1.7}
.pq{margin:34px 0 0;padding:22px 24px;border-left:3px solid var(--ink);background:var(--soft)}
.pq p{margin:8px 0 0;font-size:18px;line-height:1.6}
.fonte{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.tags{display:flex;flex-wrap:wrap;gap:8px}
.tags span{border:1px solid var(--line);border-radius:999px;padding:5px 10px;font:500 12px/1 var(--mono);color:var(--mute)}
.mais{border-top:1px solid var(--line);padding-block:40px 80px}
.mais .grid{padding-bottom:0;margin-top:22px}
.cta{background:#111111;color:#FAFAF8;padding-block:clamp(40px,6vw,72px);border-top:1px solid var(--line)}
.cta .lbl{color:#A3A3A0}
.cta h2{font-size:clamp(28px,3.6vw,46px);line-height:1.05;margin-top:12px;max-width:16em}
.cta .btn{background:#FAFAF8;color:#111111;border-color:#FAFAF8;margin-top:24px}
.foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding-block:26px;color:var(--mute);font-size:14px}
"""


def pagina(titulo, desc, raiz, corpo, canonical, ativo=True):
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(titulo)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(canonical)}">
<link rel="alternate" type="application/rss+xml" title="Radar de Marca" href="{raiz}radar/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="{raiz}radar/radar.css">
</head>
<body>
<header class="top"><div class="wrap bar">
  <a class="wm" href="{raiz}">Estúdio Caio Pires</a>
  <nav class="nav" aria-label="Seções">
    <a class="hide-s" href="{raiz}#projetos">Projetos</a>
    <a class="hide-s" href="{raiz}#simbolos">Símbolos</a>
    <a href="{raiz}radar/"{' aria-current="page"' if ativo else ''}>Blog</a>
    <a class="btn" href="{raiz}comecar/">Começar<span class="lng"> um projeto</span></a>
  </nav>
</div></header>
{corpo}
<section class="cta"><div class="wrap">
  <span class="lbl">Estúdio Caio Pires</span>
  <h2>Tem um negócio que precisa de marca?</h2>
  <a class="btn" href="{raiz}comecar/">Começar um projeto <span aria-hidden="true">→</span></a>
</div></section>
<footer class="wrap foot"><span>© {date.today().year} Estúdio Caio Pires</span><span>Resumos escritos pelo estúdio. Imagens e matérias completas pertencem às fontes citadas.</span></footer>
</body>
</html>
"""


def gerar(root, syms):
    root = Path(root); rd = root / 'radar'
    posts = json.loads((rd / 'posts.json').read_text(encoding='utf-8'))
    posts.sort(key=lambda p: (p['data'], p['slug']), reverse=True)
    n = len(syms)
    (rd / 'simbolos.svg').write_text(sprite(syms), encoding='utf-8')
    (rd / 'radar.css').write_text(CSS.strip() + '\n', encoding='utf-8')

    # páginas de post (apaga as que não existem mais em posts.json)
    slugs = {p['slug'] for p in posts}
    for d in rd.iterdir():
        if d.is_dir() and d.name not in slugs:
            shutil.rmtree(d)
    for i, p in enumerate(posts):
        outros = [q for q in posts if q['slug'] != p['slug']][:3]
        fig = (f'<figure>{capa(p, "../", n).replace("rc-img", "rc-img big", 1)}'
               f'<figcaption class="lbl">{"Imagem: " + e(p["fonte"]) if p.get("imagem") else "Capa: grafismo do Estúdio Caio Pires"}</figcaption></figure>')
        corpo = f"""<main class="wrap">
<article class="post">
  <a class="back" href="../">← Radar de Marca</a>
  <h1>{e(p['titulo'])}</h1>
  <p class="lf">{e(p['linha_fina'])}</p>
  <div class="meta"><span class="lbl">{data_longa(p['data'])}</span><span class="lbl">Fonte: {e(p['fonte'])}</span></div>
  {fig}
  <div class="corpo">{''.join(f'<p>{e(t)}</p>' for t in p['texto'])}</div>
  <div class="pq"><span class="lbl">Por que importa</span><p>{e(p['por_que_importa'])}</p></div>
  <div class="fonte"><a class="btn" href="{e(p['url'])}" target="_blank" rel="noopener">Ler a matéria completa em {e(p['fonte'])} <span aria-hidden="true">↗</span></a></div>
  <div class="tags" style="margin-top:24px">{''.join(f'<span>{e(t)}</span>' for t in p.get('tags', []))}</div>
</article>
{f'<section class="mais"><span class="lbl">Mais do Radar</span><div class="grid">{"".join(cartao(q, "../", "../", n) for q in outros)}</div></section>' if outros else ''}
</main>"""
        dest = rd / p['slug']; dest.mkdir(exist_ok=True)
        (dest / 'index.html').write_text(pagina(f"{p['titulo']} · Radar de Marca", p['linha_fina'], '../../', corpo, f"{SITE}radar/{p['slug']}/"), encoding='utf-8')

    lista = ''.join(cartao(p, '', '', n, 'h2') for p in posts) or ''
    corpo = f"""<main class="wrap">
<section class="head"><span class="lbl">Blog · Radar de Marca</span><h1>O que está mudando nas marcas.</h1>
<p>Notícias de logo, branding e design gráfico, resumidas em português pelo estúdio, com o link para a matéria original. Atualizado de segunda a sexta.</p></section>
{f'<div class="grid">{lista}</div>' if posts else '<p class="empty">Os primeiros posts chegam em breve.</p>'}
</main>"""
    (rd / 'index.html').write_text(pagina('Radar de Marca · Estúdio Caio Pires', 'Notícias de logo, branding e design gráfico, resumidas em português pelo Estúdio Caio Pires.', '../', corpo, f'{SITE}radar/'), encoding='utf-8')

    itens = ''.join(f"""<item><title>{e(p['titulo'])}</title><link>{SITE}radar/{e(p['slug'])}/</link><guid>{SITE}radar/{e(p['slug'])}/</guid><pubDate>{format_datetime(datetime.fromisoformat(p['data']).replace(hour=10, tzinfo=timezone.utc))}</pubDate><description>{e(p['linha_fina'])}</description></item>""" for p in posts[:30])
    (rd / 'feed.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Radar de Marca</title><link>{SITE}radar/</link><description>Notícias de logo, branding e design gráfico, resumidas pelo Estúdio Caio Pires.</description><language>pt-BR</language>{itens}</channel></rss>\n', encoding='utf-8')

    # bloco da página inicial: os 3 posts mais recentes
    if not posts:
        return ''
    cards = ''.join(cartao(p, 'radar/', 'radar/', n) for p in posts[:3])
    return f"""<section id="radar" class="sec" aria-labelledby="h-radar">
<style>
#radar .rgrid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}}
@media (max-width:900px){{#radar .rgrid{{grid-template-columns:1fr}}}}
#radar .rc{{text-decoration:none;display:flex;flex-direction:column;gap:14px}}
#radar .rc-img{{position:relative;aspect-ratio:1200/630;background:#111111;color:#FAFAF8;overflow:hidden;border:1px solid var(--line)}}
#radar .rc-img .cover{{position:absolute;inset:0;width:100%;height:100%}}
#radar .rc-img .cover-l{{position:absolute;left:14px;bottom:12px;font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;opacity:.6}}
#radar .rc-img img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:var(--soft)}}
#radar .rc h3{{font-size:21px;line-height:1.15;margin-top:8px}}
#radar .rc p{{color:var(--mute);font-size:15px;line-height:1.5;margin:8px 0 0}}
#radar .rc:hover h3{{text-decoration:underline;text-underline-offset:4px}}
</style>
<div class="wrap">
  <div class="sec-head"><div><span class="lbl">Blog · Radar de Marca</span><h2 id="h-radar">O que está mudando nas marcas</h2>
  <p class="muted">Notícias de logo, branding e design gráfico, resumidas em português pelo estúdio.</p></div>
  <a class="btn ghost" href="radar/">Ver todas <span aria-hidden="true">→</span></a></div>
  <div class="rgrid">{cards}</div>
</div>
</section>
"""
