# Hub do Estúdio Caio Pires

Site do estúdio com os símbolos do logofolio. Cada símbolo tem página própria (conceito, construção, simetria, redução e gerador de padrões).

## O que tem nesta pasta

| Arquivo ou pasta | Para que serve |
|---|---|
| `index.html` | O site pronto. É ele que vai ao ar. Não edite à mão: ele é gerado. |
| `simbolos/` | Um SVG por símbolo: `01.svg`, `02.svg`... O número do arquivo é o número do símbolo no site. |
| `conceitos.txt` | O texto de cada símbolo, uma linha por símbolo: `07 | texto`. |
| `src/pagina.html` | O modelo da página (visual, textos fixos, funcionamento). |
| `build.py` | Junta tudo e gera o `index.html`. |

## Como pedir mudanças ao Claude

Basta escrever na conversa, por exemplo:
- "Adiciona este símbolo como nº 53" (e anexe o SVG exportado do Illustrator).
- "Troca o conceito do nº 12 por: ..."
- "Muda o texto do Sobre."

O Claude altera os arquivos, gera o `index.html`, mostra uma prévia e, com o seu ok, envia para o GitHub. O site atualiza sozinho em um ou dois minutos.

## Ao exportar um símbolo do Illustrator
- Formato SVG, uma cor só, sem texto (converta textos em curvas).
- Fundo branco pode ficar: o `build.py` ignora formas brancas.
