# Instruções para o Claude: hub do Estúdio Caio Pires

O Caio não programa. Ele pede mudanças em linguagem natural; você faz, mostra a prévia e só publica (commit + push na branch `main`) depois do ok dele. O GitHub Pages publica o `index.html` da raiz automaticamente.

## Estrutura
- `simbolos/NN.svg`: um símbolo por arquivo; o número define a ordem e o número exibido. Qualquer SVG com formas preenchidas serve (o `build.py` converte retângulos, polígonos e transformações em paths e ignora formas brancas).
- `conceitos.txt`: `NN | texto`. A primeira frase vira o título da página do símbolo.
- `src/pagina.html`: modelo com os marcadores `/*SYMS*/` e `/*CONC*/`, preenchidos pelo build. Todo o CSS e JS está nele.
- `build.py`: `pip install svgelements cairosvg pillow --break-system-packages` e depois `python3 build.py`. Gera `index.html`.

## Regras
- Nunca edite `index.html` à mão; edite `src/pagina.html`, `simbolos/` ou `conceitos.txt` e rode o build.
- Antes de publicar, abra o `index.html` no Playwright (desktop 1440 e celular 390) e confira a grade e uma página de símbolo (`index.html#s07`).
- Nada de dados de clientes neste repositório: ele é público.
- Textos em português do Brasil, sem travessão (—) em textos que o público lê.
- As páginas de símbolo usam endereço `#sNN` (ex.: `#s07`).
- O botão "Baixar padrão em SVG" usa o recurso `downloads` quando roda como artefato do Claude e o download normal do navegador fora dele.
