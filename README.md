# Nikateliê — Simulador de Cores 3D

Visualizador 3D das peças impressas da [Nikateliê](https://www.nikatelie.com.br): o cliente gira a peça e escolhe a cor de cada parte (PLA Voolt3D: Premium, Velvet e V-Silk).

**Site:** https://rrs747.github.io/nika/

## Produtos

| ID (`?produto=`)        | Peça                    | Partes com cor           |
|-------------------------|-------------------------|--------------------------|
| `caixa-agulhas`         | Caixa de Agulhas        | Caixa, Tampa, Aplique    |
| `suporte-4-prateleiras` | Suporte 4 Prateleiras   | Laterais, Prateleiras    |
| `fita-metrica`          | Porta Fita Métrica      | uma cor só               |
| `bobinas`               | Bobinas                 | uma cor só               |
| `suporte-3-prateleiras` | Suporte 3 Prateleiras   | Laterais, Prateleiras    |
| `porta-canetinhas-80`   | Porta Canetinhas 80     | uma cor só               |

## Como usar na Loja Integrada

1. **Uma vez só** — nos códigos personalizados da loja (rodapé), cole:
   `<script src="https://rrs747.github.io/nika/ponte-loja.js" defer></script>`
   Isso faz o modelo trocar de cor quando o cliente escolhe a variação do produto.
2. **Em cada produto 3D** — na descrição (modo HTML), cole o iframe de [`loja-integrada.html`](loja-integrada.html) com o `?produto=` da peça.
3. **Variações** — use o nome da cor do simulador no valor (ex.: `Rosa Bebê Velvet`, `Dourado Silk`).
   Para peças com partes, ponha a parte no nome do grupo (ex.: `Cor da Tampa`); um grupo só `Cor` pinta a peça inteira.

## Nome personalizado

Desligado por padrão. Para uma peça com nome, use `<div class="nika3d" data-nome="sim">` (ou `"obrigatorio"`) na descrição do produto. O cliente digita o nome na página do produto e vê o nome aplicado na peça.
Ao clicar em Comprar, o nome fica guardado no navegador; o carrinho mostra um quadro com "Copiar personalização"
para colar no campo **Comentário** do checkout (Configurações > Gerais > Checkout). A Loja Integrada não permite
código no checkout, por isso o preenchimento não é automático. Posição do nome em cada peça: `personalizar` no `CONFIG`
(bobinas sem nome: o disco é pequeno demais).

## Como editar cores e produtos

Tudo fica no bloco `CONFIG` no início do `<script type="module">` do `index.html`:
- `cores`: catálogo PLA da [Voolt3D](https://voolt3d.com.br/pla/) — linhas `premium`, `velvet` e `silk` (V-Silk). Os códigos hex são aproximados; ajuste e apague as cores que não tiver em estoque.
- `produtos`: nome, arquivo `.glb`, texto e a cor inicial de cada parte.

## Como adicionar um modelo novo

Os `.glb` em `modelos/` foram gerados a partir dos `.3mf` (Creality Print / Bambu Studio) com os scripts de `ferramentas/`
(`pip install trimesh lxml fast_simplification`). Cada parte do `.glb` se chama `Zona__eixo`
(ex.: `Tampa__z`): `Zona` vira um botão de cor e `eixo` é a direção das camadas de impressão.
