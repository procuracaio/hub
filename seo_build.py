"""Páginas próprias dos projetos e arquivos para o Google e para os assistentes de IA.

Chamado pelo build.py depois de montar o index.html. Gera:
  projetos/index.html          lista dos projetos (página "Projetos de identidade visual")
  projetos/<slug>/index.html   uma página por projeto, com o texto em HTML (lido sem JavaScript)
  sitemap.xml, robots.txt, llms.txt, 404.html
e devolve o bloco de dados estruturados (JSON-LD) e os cartões estáticos da grade da página inicial.

Os dados vêm de `const P = [...]` em src/pagina.html (os mesmos do site). Nada aqui inventa fato:
só reorganiza o que já está publicado no site.
"""
import html, json, re
from datetime import date
from pathlib import Path
from PIL import Image

SITE = 'https://caiopires.com.br/'
NOME = 'Estúdio Caio Pires'
INSTAGRAM = 'https://www.instagram.com/caiopires.design/'
WHATS = '+55 21 96864-2896'
EMAIL = 'cpires.design@gmail.com'
e = lambda s: html.escape(str(s), quote=True)
HEX = re.compile(r'^#[0-9a-fA-F]{6}$')


def ler_projetos(src):
    m = re.search(r'^const P = (\[.*\]);\s*$', src, re.M)
    if not m: raise SystemExit('ERRO: não achei "const P = [...]" em src/pagina.html')
    return json.loads(m.group(1))


def ler_faq(src):
    itens = re.findall(r'<details><summary>(.*?)<i aria-hidden="true"></i></summary><p class="a">(.*?)</p></details>', src, re.S)
    limpa = lambda t: html.unescape(re.sub(r'<[^>]+>', '', t)).strip()
    return [(limpa(q), limpa(a)) for q, a in itens]


def conceitual(p): return p.get('kind') != 'Cliente'
def tipo_rotulo(p): return 'Cliente' if not conceitual(p) else 'Projeto conceitual'
def seg_min(p): s = p['seg']; return s[:1].lower() + s[1:]
def corta(t, n=155):
    t = re.sub(r'\s+', ' ', t).strip()
    return t if len(t) <= n else t[:n - 1].rsplit(' ', 1)[0].rstrip(',.;:') + '…'


def tam(root, rel):
    try:
        with Image.open(root / rel) as im: return im.size
    except Exception: return None


def img(root, rel, alt, lazy=True):
    t = tam(root, rel)
    if not t: return ''
    carga = 'loading="lazy"' if lazy else 'fetchpriority="high"'
    return f'<img src="/{e(rel)}" alt="{e(alt)}" width="{t[0]}" height="{t[1]}" {carga} decoding="async">'


def cabeca(titulo, desc, url, imagem, ld, tipo='website'):
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<script>try{{var t=localStorage.getItem('tema');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}}catch(e){{}}</script>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(titulo)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="{tipo}">
<meta property="og:site_name" content="{NOME}">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="{e(titulo)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(imagem)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/blog/blog.css">
<link rel="stylesheet" href="/projetos/projetos.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')}</script>
</head>
<body>
<header class="top"><div class="wrap bar">
  <a class="wm" href="/">{NOME}</a>
  <nav class="nav" aria-label="Seções">
    <a class="hide-s" href="/#simbolos">Símbolos</a>
    <a href="/blog/">Blog</a>
    <a class="btn" href="/comecar/"><span>Começar<span class="lng"> um projeto</span></span></a>
    <button class="tema" type="button" id="temaB" aria-label="Mudar para o tema escuro"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3.8a8.2 8.2 0 0 1 0 16.4Z" fill="currentColor"/></svg></button>
  </nav>
</div></header>
"""


RODAPE = f"""<section class="cta"><div class="wrap">
  <span class="lbl">{NOME}</span>
  <h2>Tem um negócio que precisa de marca?</h2>
  <a class="btn" href="/comecar/">Começar um projeto <span aria-hidden="true">→</span></a>
</div></section>
<footer class="wrap foot"><span>© {date.today().year} {NOME}</span><span>Símbolos desenhados em vetor pelo estúdio.</span></footer>
<script>(function(){{var b=document.getElementById('temaB');if(!b)return;var r=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)');
function escuro(){{var t=r.getAttribute('data-theme');return t?t==='dark':m.matches}}
function pinta(){{var d=escuro();b.classList.toggle('escuro',d);b.setAttribute('aria-label',d?'Mudar para o tema claro':'Mudar para o tema escuro');b.title=d?'Tema claro':'Tema escuro'}}
b.addEventListener('click',function(){{var n=escuro()?'light':'dark';r.setAttribute('data-theme',n);try{{localStorage.setItem('tema',n)}}catch(e){{}}pinta()}});
m.addEventListener&&m.addEventListener('change',pinta);pinta()}})();</script>
<script src="/visitas.js" defer></script>
</body>
</html>
"""

ORG = {'@type': 'ProfessionalService', '@id': SITE + '#estudio', 'name': NOME, 'url': SITE}


def titulo_proj(p): return f'Identidade visual para {seg_min(p)} | {p["name"]}'
def desc_proj(p):
    pre = '' if not conceitual(p) else 'Projeto conceitual. '
    return corta(f'{pre}{p["tag"]} {p["intro"][0]}')


def pagina_projeto(root, p, todos):
    s = p['slug']; url = f'{SITE}projetos/{s}/'
    capa = f'img/{s}/p01.webp'
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'CreativeWork', 'name': f'Identidade visual {p["name"]}', 'url': url, 'inLanguage': 'pt-BR',
         'about': p['seg'], 'description': desc_proj(p), 'image': SITE + capa,
         'genre': 'Identidade visual', 'creator': ORG,
         'locationCreated': {'@type': 'Place', 'name': p.get('city', '')}},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Início', 'item': SITE},
            {'@type': 'ListItem', 'position': 2, 'name': 'Projetos', 'item': SITE + 'projetos/'},
            {'@type': 'ListItem', 'position': 3, 'name': p['name'], 'item': url}]}]}
    b = []
    b.append(f"""<main class="wrap proj">
<a class="back" href="/projetos/">← Projetos</a>
<header class="pj-h">
  <span class="lbl">{e(tipo_rotulo(p))} · {e(p['seg'])} · {e(p.get('city', ''))}</span>
  <h1>{e(p['name'])}</h1>
  <p class="tag">{e(p['tag'])}</p>
  {('<p class="nota">Projeto conceitual: a marca é fictícia, criada pelo estúdio para mostrar o método Palavras de Marca num segmento real.</p>' if conceitual(p) else '')}
</header>
<figure class="capa">{img(root, capa, f'Capa do manual de identidade visual de {p["name"]}', lazy=False)}</figure>
<section class="pj-s two"><div><span class="lbl">O negócio</span><h2>Para quem é a marca</h2></div><div class="txt">
  {''.join(f'<p>{e(t)}</p>' for t in p['intro'])}
  {f'<p class="aud"><b>Público:</b> {e(p["aud"])}</p>' if p.get('aud') else ''}
</div></section>""")
    w = p.get('word')
    if w:
        b.append(f"""<section class="pj-s two"><div><span class="lbl">A ideia</span><h2>{e(w['w'])}</h2>{f'<p class="lbl">{e(w["c"])}</p>' if w.get('c') else ''}</div><div class="txt"><p class="def">{e(w['d'])}</p>
  {('<div class="pal"><span class="lbl">Palavras de Marca</span><ul>' + ''.join(f'<li>{e(n)}</li>' for n in p['nouns']) + '</ul></div>') if p.get('nouns') else ''}
</div></section>""")
    if p.get('steps'):
        figs = ''.join(f'<figure>{img(root, f"img/{s}/p{n:02d}.webp", f"{t} da identidade visual de {p['name']}")}<figcaption class="lbl">{e(t)}</figcaption></figure>' for n, t in (p.get('build') or [])[:2])
        b.append(f"""<section class="pj-s"><span class="lbl">Construção · {e(p.get('rule', ''))}</span><h2>Como o símbolo foi desenhado</h2>
  <ol class="passos">{''.join(f'<li><h3>{e(t)}</h3><p>{e(d)}</p></li>' for t, d in p['steps'])}</ol>
  {f'<div class="figs">{figs}</div>' if figs else ''}
</section>""")
    if p.get('colors'):
        cs = ''.join(f'<li><span class="sw" style="background:{c[1]}"></span><b>{e(c[0])}</b><span class="lbl">{e(c[1])}{(" · " + e(c[2])) if len(c) > 2 else ""}</span></li>' for c in p['colors'] if HEX.match(c[1]))
        b.append(f"""<section class="pj-s two"><div><span class="lbl">Cor</span><h2>Paleta</h2></div><div class="txt"><ul class="cores">{cs}</ul>{f'<p class="muted">{e(p["cnote"])}</p>' if p.get('cnote') else ''}</div></section>""")
    if p.get('fonts'):
        b.append(f"""<section class="pj-s two"><div><span class="lbl">Tipografia</span><h2>Fontes</h2></div><div class="txt"><ul class="fontes">{''.join(f'<li><b>{e(f["n"])}</b><span class="muted">{e(f.get("r", ""))}</span></li>' for f in p['fonts'])}</ul>{f'<p class="muted">{e(p["fnote"])}</p>' if p.get('fnote') else ''}</div></section>""")
    v = p.get('voice')
    if v:
        b.append(f"""<section class="pj-s two"><div><span class="lbl">Tom de voz</span><h2>{e(v['t'])}</h2></div><div class="txt"><p>{e(v['l'])}</p>
  <div class="voz"><div><span class="lbl">A marca diz</span><ul>{''.join(f'<li>{e(x)}</li>' for x in v.get('say', []))}</ul></div><div><span class="lbl">A marca não diz</span><ul class="nao">{''.join(f'<li>{e(x)}</li>' for x in v.get('no', []))}</ul></div></div>
</div></section>""")
    if p.get('apps'):
        apps = ''.join(f'<figure>{img(root, f"img/{s}/{a}.webp", f"{t}: aplicação da identidade visual de {p['name']}")}<figcaption class="lbl">{e(t)}</figcaption></figure>' for a, t in p['apps'] if tam(root, f'img/{s}/{a}.webp'))
        b.append(f'<section class="pj-s"><span class="lbl">Aplicações</span><h2>A marca no dia a dia</h2><div class="apps">{apps}</div></section>')
    if p.get('deliv'):
        b.append(f"""<section class="pj-s two"><div><span class="lbl">Entrega</span><h2>O que foi entregue</h2></div><div class="txt"><ul class="ent">{''.join(f'<li>{e(x)}</li>' for x in p['deliv'])}</ul>
  <div class="acoes"><a class="btn" href="/#{e(s)}">Ver o projeto interativo <span aria-hidden="true">→</span></a><a class="btn ghost" href="/comecar/">Começar um projeto</a></div>
</div></section>""")
    outros = [q for q in todos if q['slug'] != s]
    b.append(f"""<section class="pj-s"><span class="lbl">Mais projetos</span><h2>Outros segmentos</h2><ul class="outros">{''.join(f'<li><a href="/projetos/{e(q["slug"])}/"><b>{e(q["name"])}</b><span class="muted">{e(q["seg"])}</span></a></li>' for q in outros)}</ul></section>
</main>""")
    return cabeca(titulo_proj(p), desc_proj(p), url, SITE + capa, ld, 'article') + '\n'.join(b) + RODAPE


def pagina_lista(root, ps):
    url = SITE + 'projetos/'
    ld = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'Projetos de identidade visual', 'url': url, 'inLanguage': 'pt-BR',
          'publisher': ORG, 'hasPart': [{'@type': 'CreativeWork', 'name': f'Identidade visual {p["name"]}', 'url': f'{url}{p["slug"]}/'} for p in ps]}
    cards = ''.join(f"""<a class="rc" href="/projetos/{e(p['slug'])}/"><div class="pj-th">{img(root, f"img/{p['slug']}/p01t.webp", f"Identidade visual de {p['name']}")}</div>
  <span class="lbl">{e(tipo_rotulo(p))} · {e(p.get('city', ''))}</span><h2>{e(p['name'])}</h2><p>{e(p['seg'])}. {e(p['tag'])}</p></a>""" for p in ps)
    corpo = f"""<main class="wrap">
<section class="head"><span class="lbl">Projetos</span><h1>Projetos de identidade visual</h1>
<p>Identidades completas desenhadas pelo estúdio com o método Palavras de Marca: do símbolo ao manual, com as aplicações de cada negócio. Os projetos marcados como conceituais usam marcas fictícias, criadas para mostrar o método em segmentos diferentes.</p></section>
<div class="grid">{cards}</div>
</main>"""
    return cabeca('Projetos de identidade visual | Estúdio Caio Pires', 'Identidades visuais completas do Estúdio Caio Pires para odontologia, marcenaria, energia solar, escola infantil, apiário, kart e revestimentos: símbolo, cores, tipografia e aplicações.', url, SITE + 'og.png', ld) + corpo + RODAPE


def dados_home(faq):
    ld = {'@context': 'https://schema.org', '@graph': [
        {**ORG, 'description': 'Estúdio de identidade visual para pequenas e médias empresas, com o método Palavras de Marca. Atendimento online para todo o Brasil.',
         'image': SITE + 'og.png', 'telephone': WHATS, 'email': EMAIL, 'areaServed': {'@type': 'Country', 'name': 'Brasil'},
         'knowsAbout': ['Identidade visual', 'Design de logotipo', 'Branding', 'Manual de marca', 'Criação de sites'],
         'founder': {'@type': 'Person', 'name': 'Caio Pires', 'jobTitle': 'Designer de marcas'},
         'sameAs': [INSTAGRAM],
         'hasOfferCatalog': {'@type': 'OfferCatalog', 'name': 'Serviços', 'itemListElement': [
             {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': 'Identidade visual completa', 'description': 'Símbolo, versões da assinatura, paleta de cores, tipografia, padrões gráficos, ícones, manual da marca e página online da marca. Prazo de 1 a 2 meses.'}},
             {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': 'Site de cinco páginas', 'description': 'Site adaptado para celular, no ar em 15 dias depois que o conteúdo chega.'}}]}},
        {'@type': 'WebSite', '@id': SITE + '#site', 'name': NOME, 'url': SITE, 'inLanguage': 'pt-BR', 'publisher': {'@id': SITE + '#estudio'}},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faq]}]}
    return '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>'


def cartoes_estaticos(ps):
    # A grade da página inicial é desenhada pelo JavaScript; estes cartões simples ficam no HTML
    # para quem lê sem JavaScript (buscadores e assistentes) e são trocados pelos cartões completos ao carregar.
    return ''.join(f'<a class="pcard" href="/projetos/{e(p["slug"])}/" data-slug="{e(p["slug"])}"><div class="meta"><div class="mt"><h3>{e(p["name"])}</h3><p class="seg-t">{e(p["seg"])}</p></div></div></a>' for p in ps)


def llms(ps, faq):
    proj = '\n'.join(f'- [{p["name"]}]({SITE}projetos/{p["slug"]}/): {p["seg"]}, {p.get("city", "")}. {"Cliente do estúdio." if not conceitual(p) else "Projeto conceitual com marca fictícia."}' for p in ps)
    perguntas = '\n'.join(f'- **{q}** {a}' for q, a in faq)
    return f"""# {NOME}

> Estúdio de identidade visual para pequenas e médias empresas, conduzido pelo designer de marcas Caio Pires (10 anos de profissão). Atendimento online para todo o Brasil.

O estúdio desenha identidades visuais simples e geométricas, com referência no modernismo dos anos 50 e 60: construção racional, geometria e redução ao essencial. O trabalho segue um método próprio, Palavras de Marca: o símbolo nasce das palavras do negócio, definidas com o cliente.

## Serviços
- Identidade visual completa: símbolo, versões da assinatura (horizontal, vertical e símbolo isolado), paleta de cores, tipografia, padrões gráficos, ícones e manual da marca, em SVG, PDF e PNG, com uma página online da marca. Prazo de 1 a 2 meses, pagamento em duas parcelas, 1 rodada de ajuste na marca escolhida.
- Site de cinco páginas, adaptado para celular, no ar em 15 dias depois que o conteúdo chega.
- O estúdio não faz gestão de redes sociais. A impressão não é o foco, mas pode ser conversada caso a caso.
- Os projetos começam em R$ 1.000 (informação do formulário "Começar um projeto").

## Método Palavras de Marca
1. Imersão: questionário online sobre o negócio, o público e os concorrentes.
2. Palavras: cerca de 15 palavras da marca (coisas, qualidades e ações).
3. Pelo menos 50 esboços à mão; os 15 melhores viram símbolos em vetor.
4. Primeira apresentação por link: 15 símbolos em preto e branco; o cliente escolhe 3.
5. Segunda apresentação: 3 sistemas completos aplicados ao negócio; o cliente escolhe a marca final.
6. Entrega: ajuste final, padrões, ícones, manual e arquivos.

{('## Projetos' + chr(10) + proj + chr(10) + chr(10)) if proj else ''}## Perguntas frequentes
{perguntas}

## Contato
- Começar um projeto (pré-briefing): {SITE}comecar/
- WhatsApp: {WHATS}
- E-mail: {EMAIL}
- Instagram: {INSTAGRAM}
- Blog (notícias de identidade visual): {SITE}blog/
"""


PROJETOS = False  # páginas próprias dos projetos (desligadas em nov/2026, quando a seção saiu do site)

ERRO404 = cabeca('Página não encontrada | Estúdio Caio Pires', 'Esta página não existe mais. Veja os projetos, o blog ou comece um projeto com o Estúdio Caio Pires.', SITE, SITE + 'og.png',
                 {'@context': 'https://schema.org', '@type': 'WebPage', 'name': 'Página não encontrada'}).replace('<link rel="canonical" href="https://caiopires.com.br/">\n', '<meta name="robots" content="noindex">\n') + """<main class="wrap">
<section class="head"><span class="lbl">Erro 404</span><h1>Esta página não existe.</h1>
<p>O endereço pode ter mudado com o site novo. Os caminhos mais procurados estão aqui embaixo.</p></section>
<ul class="outros"><li><a href="/"><b>Página inicial</b><span class="muted">O estúdio, o processo e os serviços</span></a></li><li><a href="/#simbolos"><b>Símbolos</b><span class="muted">O acervo de símbolos do estúdio</span></a></li><li><a href="/blog/"><b>Blog</b><span class="muted">Notícias de identidade visual</span></a></li><li><a href="/comecar/"><b>Começar um projeto</b><span class="muted">Conte sobre o seu negócio</span></a></li></ul>
</main>""" + RODAPE


def gerar(root, src):
    root = Path(root)
    ps = ler_projetos(src); faq = ler_faq(src)
    if PROJETOS:
        (root / 'projetos').mkdir(exist_ok=True)
        (root / 'projetos' / 'index.html').write_text(pagina_lista(root, ps), encoding='utf-8')
        for p in ps:
            d = root / 'projetos' / p['slug']; d.mkdir(exist_ok=True)
            (d / 'index.html').write_text(pagina_projeto(root, p, ps), encoding='utf-8')
    posts = json.loads((root / 'blog' / 'posts.json').read_text(encoding='utf-8'))
    hoje = date.today().isoformat()
    urls = [(SITE, hoje, '1.0')] + ([(SITE + 'projetos/', hoje, '0.9')] + [(f'{SITE}projetos/{p["slug"]}/', hoje, '0.8') for p in ps] if PROJETOS else []) + \
           [(SITE + 'comecar/', hoje, '0.7'), (SITE + 'blog/', max((x['data'] for x in posts), default=hoje), '0.6')] + \
           [(f'{SITE}blog/{x["slug"]}/', x['data'], '0.5') for x in sorted(posts, key=lambda x: x['data'], reverse=True)]
    (root / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        ''.join(f'  <url><loc>{e(u)}</loc><lastmod>{d}</lastmod><priority>{pr}</priority></url>\n' for u, d, pr in urls) + '</urlset>\n', encoding='utf-8')
    (root / 'robots.txt').write_text(f'# Estúdio Caio Pires: o site inteiro pode ser lido por buscadores e assistentes.\nUser-agent: *\nAllow: /\n\nSitemap: {SITE}sitemap.xml\n', encoding='utf-8')
    (root / 'llms.txt').write_text(llms(ps if PROJETOS else [], faq), encoding='utf-8')
    (root / '404.html').write_text(ERRO404, encoding='utf-8')
    print(f'SEO: {len(ps) if PROJETOS else 0} páginas de projeto, sitemap com {len(urls)} endereços, robots.txt, llms.txt e 404.html.')
    return dados_home(faq), cartoes_estaticos(ps) if PROJETOS else ''
