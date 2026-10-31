# Radar de Marca: publicação diária

Este é o roteiro da tarefa agendada (segunda a sexta, 7h de Brasília). Os posts vão ao ar sozinhos, sem aprovação do Caio, por decisão dele. Por isso as regras abaixo são obrigatórias.

## 1. Buscar
- Use a busca na web (modo "extended") para encontrar notícias publicadas nos **últimos 3 dias** sobre: logo e rebranding de marcas conhecidas, identidade visual, design gráfico, tipografia de marca e embalagem.
- Faça várias buscas no mesmo turno, em inglês e em português. Exemplos: "unveils new logo", "rebrand new visual identity", "new brand identity design studio", "nova identidade visual", "novo logo".
- **Só fontes de referência**: Creative Bloq, Dezeen, It's Nice That, Creative Review, Design Week, Fast Company, Brand New (UnderConsideration), The Dieline, Wallpaper, 9to5Mac (para Apple), sites de imprensa de grandes marcas, Meio & Mensagem, ABC da Comunicação, Marcas pelo Mundo. Nada de blogs anônimos, agregadores de SEO ou páginas de venda.
- Abra cada matéria candidata com a leitura de páginas (WebFetch) e peça: os fatos (o que mudou, quem desenhou, data) e o endereço exato da imagem principal (og:image).

## 2. Escolher
- **Até 3 posts por dia.** Se não houver nada bom, não publique nada e encerre.
- Não repita: compare o `url` e o assunto com `radar/posts.json`. A mesma notícia em outra fonte também conta como repetida.
- Prefira mudanças de marca com desenho para comentar. Evite fofoca, política e notícias que não sejam de design.

## 3. Escrever (português do Brasil)
Cada post entra no começo de `radar/posts.json`, neste formato:

```json
{
  "slug": "AAAA-MM-DD-palavras-curtas-sem-acento",
  "data": "AAAA-MM-DD (data da notícia)",
  "titulo": "frase clara, até 90 caracteres",
  "linha_fina": "uma frase que completa o título",
  "texto": ["parágrafo 1: o fato", "parágrafo 2: contexto, quem fez, reação"],
  "por_que_importa": "2 ou 3 frases com o olhar do estúdio: construção, simplicidade, aplicação, método",
  "fonte": "nome do site",
  "url": "endereço da matéria original",
  "imagem": "og:image da matéria, ou \"\" se não houver",
  "tags": ["Rebranding", "..."]
}
```

Regras de texto:
- **Com as suas palavras.** Nunca copie frases da matéria. No máximo uma citação curta, entre aspas e atribuída.
- **Só fatos que estão na matéria.** Não invente designer, data, número ou citação. Se a matéria não disser quem desenhou, não diga.
- Sem travessão (—), sem emoji, sem jargão ("disruptivo", "inovador"). Tom do estúdio: claro, um pouco formal, explica o porquê.
- **Não baixe imagens.** O campo `imagem` guarda só o endereço da imagem no site original; o blog mostra direto de lá, com crédito. Se ela não carregar, o site mostra a capa de grafismo sozinho.

## 4. Gerar e conferir
```
pip install svgelements cairosvg pillow --break-system-packages
python3 build.py
python3 -m http.server 8791 &
```
Abra no Playwright `http://localhost:8791/`, `http://localhost:8791/radar/` e a página de cada post novo, no desktop (1440) e no celular (390). Confira: sem erro no console, sem rolagem horizontal, título e texto aparecendo. Valide o JSON (`python3 -c "import json;json.load(open('radar/posts.json'))"`).

Se algo der errado e você não conseguir corrigir, **não publique**.

## 5. Publicar
```
git add radar index.html
git commit -m "Radar de Marca: posts de AAAA-MM-DD"
git push origin HEAD:main
```
Use as linhas de atribuição pedidas pela sessão no fim da mensagem de commit. O GitHub Pages publica em 1 ou 2 minutos.

## Remover um post
Se o Caio pedir para tirar um post, apague o item de `radar/posts.json`, rode `python3 build.py` (a pasta do post some sozinha) e publique.
