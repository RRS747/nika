# Nikateliê — Simulador de Cores 3D

Visualizador 3D das peças impressas da [Nikateliê](https://www.nikatlie.com.br): o cliente gira a peça e escolhe a cor de cada parte (PLA Voolt3D: Premium, Velvet, V-Silk, Stone e Wood).

**Site:** https://rrs747.github.io/nika/

## Produtos

| ID (`?produto=`)        | Peça                    | Partes com cor           |
|-------------------------|-------------------------|--------------------------|
| `caixa-agulhas`         | Caixa de Agulhas        | Caixa, Tampa, Aplique    |
| `suporte-4-prateleiras` | Suporte 4 Prateleiras   | Laterais, Prateleiras    |
| `fita-metrica`          | Porta Fita Métrica      | Corpo, Tampa             |
| `bobinas`               | Bobinas                 | Disco de cima, de baixo  |

## Como usar na Loja Integrada

1. Abra o produto → Descrição → botão de código-fonte (`<>`/HTML).
2. Cole o conteúdo de [`loja-integrada.html`](loja-integrada.html) e troque o `?produto=` pelo ID da peça.
3. Salve e confira a página do produto.

## Como editar cores e produtos

Tudo fica no bloco `CONFIG` no início do `<script type="module">` do `index.html`:
- `cores`: catálogo PLA da [Voolt3D](https://voolt3d.com.br/pla/) — linhas `premium`, `velvet`, `silk` (V-Silk) e `stone` (Stone e Wood). Os códigos hex são aproximados; ajuste e apague as cores que não tiver em estoque.
- `produtos`: nome, arquivo `.glb`, texto e a cor inicial de cada parte.

## Como adicionar um modelo novo

Os `.glb` em `modelos/` foram gerados a partir dos `.3mf` (Creality Print / Bambu Studio) com os scripts de `ferramentas/`
(`pip install trimesh lxml fast_simplification`). Cada parte do `.glb` se chama `Zona__eixo`
(ex.: `Tampa__z`): `Zona` vira um botão de cor e `eixo` é a direção das camadas de impressão.
