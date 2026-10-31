"""Monta o index.html do hub a partir de:
  simbolos/NN.svg   um arquivo por símbolo (01.svg, 02.svg...)
  conceitos.txt     um conceito por linha: "NN | texto"
  src/pagina.html   o modelo da página
Uso: python3 build.py
"""
import io, json, re, sys
from pathlib import Path
import cairosvg
from PIL import Image
from svgelements import SVG, Shape, Path as SPath, Color

ROOT = Path(__file__).parent
WHITE = {'#ffffff', '#fff', 'white'}

def read_symbol(f):
    svg = SVG.parse(str(f))
    ds, ev = [], False
    for e in svg.elements():
        if not isinstance(e, Shape): continue
        fill = e.fill
        if fill is None or fill.value is None: continue
        if Color(fill).hex[:7].lower() in WHITE: continue   # ignora fundos brancos exportados pelo Illustrator
        p = SPath(e); p.reify()
        if not len(p): continue
        ds.append(p.d())
        if str(e.values.get('fill-rule', '')).lower() == 'evenodd': ev = True
    if not ds: sys.exit(f'ERRO: {f.name} não tem formas preenchidas.')
    return ds, ev

def measure(ds, ev):
    joined = SPath(' '.join(ds)); x0, y0, x1, y1 = joined.bbox()
    w, h = x1-x0, y1-y0; pad = max(w, h)*.02
    vb = (x0-pad, y0-pad, w+2*pad, h+2*pad); S = 2000/max(vb[2], vb[3])
    fr = ' fill-rule="evenodd"' if ev else ''
    body = ''.join(f'<path d="{d}"{fr}/>' for d in ds)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{vb[2]*S:.0f}" height="{vb[3]*S:.0f}" viewBox="{vb[0]} {vb[1]} {vb[2]} {vb[3]}"><g fill="#000">{body}</g></svg>'
    im = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode()))).convert('RGBA')
    a = im.getchannel('A'); bb = a.getbbox()
    small = a.crop(bb).resize((100, 100))
    fill = sum(1 for px in small.tobytes() if px > 127)/10000
    return [round(vb[0]+bb[0]/S, 1), round(vb[1]+bb[1]/S, 1), round((bb[2]-bb[0])/S, 1), round((bb[3]-bb[1])/S, 1)], round(fill, 3)

def main():
    files = sorted((ROOT/'simbolos').glob('*.svg'), key=lambda f: int(re.sub(r'\D', '', f.stem) or 0))
    conc = {}
    for line in (ROOT/'conceitos.txt').read_text(encoding='utf-8').splitlines():
        if '|' in line and not line.lstrip().startswith('#'):
            n, t = line.split('|', 1); conc[int(n.strip())] = t.strip()
    syms, texts, faltando = [], [], []
    for k, f in enumerate(files, 1):
        ds, ev = read_symbol(f); bb, fill = measure(ds, ev)
        syms.append({'d': ds, 'ev': 1 if ev else 0, 'bb': bb, 'fill': fill})
        num = int(re.sub(r'\D', '', f.stem))
        if num not in conc: faltando.append(f.stem)
        texts.append(conc.get(num, 'Conceito em breve.'))
    page = (ROOT/'src'/'pagina.html').read_text(encoding='utf-8')
    page = page.replace('/*SYMS*/', json.dumps(syms, separators=(',', ':'))).replace('/*CONC*/', json.dumps(texts, ensure_ascii=False))
    import blog_build
    page = page.replace('/*BLOG*/', blog_build.gerar(ROOT, syms))
    (ROOT/'index.html').write_text(page, encoding='utf-8')
    print(f'index.html gerado com {len(syms)} símbolos e o blog.')
    if faltando: print('Sem conceito em conceitos.txt:', ', '.join(faltando))

if __name__ == '__main__':
    main()
