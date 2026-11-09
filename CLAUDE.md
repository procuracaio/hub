# Instruções para o Claude: hub do Estúdio Caio Pires

**Mapa geral do estúdio** (como o site se liga ao bot do WhatsApp, ao banco e ao sistema interno; contas, decisões e pendências): `MAPA-DO-ESTUDIO.md` no repositório privado `procuracaio/sistema`.

O Caio não programa. Ele pede mudanças em linguagem natural; você faz, mostra a prévia e só publica (commit + push na branch `main`) depois do ok dele. **Exceção:** os posts diários do blog vão ao ar sem aprovação, por decisão do Caio, seguindo `blog/COMO-PUBLICAR.md`. O GitHub Pages publica o `index.html` da raiz automaticamente.

## Estrutura
- `simbolos/NN.svg`: um símbolo por arquivo; o número define a ordem e o número exibido. Qualquer SVG com formas preenchidas serve (o `build.py` converte retângulos, polígonos e transformações em paths e ignora formas brancas).
- `conceitos.txt`: `NN | texto`. A primeira frase vira o título da página do símbolo.
- `src/pagina.html`: o site inteiro (projetos, símbolos, processo, serviços, sobre, perguntas e contato), com os marcadores `/*SYMS*/` e `/*CONC*/` preenchidos pelo build. Todo o CSS e JS está nele. Os dados dos projetos ficam em `const P = [...]` dentro dele.
- `img/<projeto>/`: pranchas dos projetos (`p01.webp` a `p20.webp`, e a versão pequena `p01t.webp`). `svg/`: assinaturas (`<projeto>-ass.svg`) e negativos dos projetos.
- `comecar/index.html`: página do pré-briefing ("Começar um projeto"). É um arquivo pronto, editado direto (não passa pelo build). Envia as respostas para o bot do WhatsApp do estúdio (`https://bot-whatsapp-791312662225.southamerica-east1.run.app/pre-briefing`), que guarda no Supabase e avisa o Caio. As opções de cada pergunta precisam ser iguais às de `OPCOES` em `src/pre-briefing.js` do bot (pasta `estudio-caio/00_estudio/bot do whatsapp/`). Aceita `?simbolo=NN` para registrar de qual símbolo o cliente veio.
- `blog/posts.json`: os posts do **Blog** (o nome na página é só "Blog"). O `build.py` chama o `blog_build.py`, que gera `blog/index.html`, uma página por post em `blog/<slug>/`, o feed `blog/feed.xml`, a capa de reserva (`blog/simbolos.svg`) e o bloco com os 3 posts mais recentes na página inicial (marcador `/*BLOG*/` em `src/pagina.html`). O passo a passo da publicação diária está em `blog/COMO-PUBLICAR.md`. A pasta `radar/` só redireciona o endereço antigo para `blog/`.
- `visitas.js`: contador de visitas próprio (sem cookies), carregado em todas as páginas (`src/pagina.html`, `comecar/index.html` e o modelo do blog em `blog_build.py`). Anota no Supabase pela função `registrar_visita` (ver `supabase/etapa-3e-visitas.sql` no `sistema`); os números aparecem na tela Marketing do sistema. `?nao-contar` para de contar o navegador, `?contar` volta, `?de=bio` marca o link da bio do Instagram. Página nova precisa do `<script src="/visitas.js" defer></script>`.
- `build.py`: `pip install svgelements cairosvg pillow --break-system-packages` e depois `python3 build.py`. Gera `index.html`.

## Regras
- Nunca edite `index.html` à mão; edite `src/pagina.html`, `simbolos/` ou `conceitos.txt` e rode o build.
- Antes de publicar, sirva a pasta com `python3 -m http.server` e abra no Playwright (desktop 1440 e celular 390): a página inicial, um projeto (`#jessica`), uma página de símbolo (`#s07`) e `comecar/`. Confira que nenhuma imagem dá erro 404.
- O método do estúdio se chama **Palavras de Marca** (o nome antigo, Substantivos de Marca, não deve aparecer).
- Os botões de contato principais levam ao pré-briefing (`comecar/`); o WhatsApp do estúdio é +55 21 96864-2896.
- Nada de dados de clientes neste repositório: ele é público.
- Textos em português do Brasil, sem travessão (—) em textos que o público lê.
- As páginas de símbolo usam endereço `#sNN` (ex.: `#s07`).
- O botão "Baixar padrão em SVG" usa o recurso `downloads` quando roda como artefato do Claude e o download normal do navegador fora dele.
