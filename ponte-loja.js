/*
  Nikateliê — ponte entre a página do produto (Loja Integrada) e o simulador 3D.

  Instalação (uma vez): Configurações > Códigos HTML > rodapé > Página de produto > tipo HTML
    <script src="https://rrs747.github.io/nika/ponte-loja.js" defer></script>

  O que faz, só nas páginas que têm o simulador (<div class="nika3d"><iframe ...></div> na descrição):
   1. Leva o modelo 3D para o lugar da foto principal do produto (com botão "Fotos" se houver fotos).
   2. Deixa o simulador em "modo loja": só o modelo, sem a paleta própria.
   3. Quando o cliente escolhe a variação (ex.: Cor = "Brilliant Rose"), pinta o modelo com a cor
      cadastrada nela. Grupo com o nome da parte (ex.: "Cor da Tampa") pinta só aquela parte.
*/
(function () {
  var ORIGEM = 'https://rrs747.github.io';
  var AREA = '.atributos,[class*="atribut"],[class*="variac"],[class*="variant"],[id*="atribut"],[id*="variac"]';
  var SELECIONADO = '.active,.ativo,.selecionado,.selected,.checked,[aria-checked="true"],[aria-selected="true"],input:checked';
  var SEM_IMAGEM = /produto-sem-imagem|sem-imagem|no-image|placeholder/i;

  function limpo(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function iframes() {
    return Array.prototype.filter.call(document.querySelectorAll('iframe'), function (f) {
      return (f.src || '').indexOf('/nika') > -1;
    });
  }
  function enviarPara(f, msg) { try { f.contentWindow.postMessage(msg, ORIGEM); } catch (e) {} }

  /* ---------- ler a variação ---------- */
  function opcaoDe(el) {            // sobe até o item da variação (a.atributo-item, option, input...)
    return el.closest && (el.closest('[data-variacao-nome],.atributo-item,option,label,li') || el);
  }
  function textoOpcao(el) {
    if (!el) return '';
    if (el.tagName === 'SELECT') el = el.options[el.selectedIndex];
    if (!el) return '';
    var t = el.getAttribute('data-variacao-nome') || el.getAttribute('title') || el.getAttribute('aria-label') ||
            (el.labels && el.labels[0] && el.labels[0].innerText) || el.innerText || el.textContent;
    var img = !limpo(t) && el.querySelector && el.querySelector('img[alt]');
    t = limpo(img ? img.getAttribute('alt') : t);
    return t.length > 60 ? '' : t;
  }
  function hexDe(el) {              // cor cadastrada na variação (bolinha/quadrado de cor)
    if (!el) return '';
    var nos = [el].concat(Array.prototype.slice.call(el.querySelectorAll ? el.querySelectorAll('*') : []));
    for (var i = 0; i < nos.length; i++) {
      var st = nos[i].getAttribute && nos[i].getAttribute('style') || '';
      var m = st.match(/(?:background(?:-color)?|border-color)\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))/i);
      if (m) return paraHex(m[1]);
    }
    return '';
  }
  function paraHex(c) {
    if (c[0] === '#') return c.length === 4 ? '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c.slice(0, 7);
    var n = c.match(/\d+/g); if (!n) return '';
    return '#' + n.slice(0, 3).map(function (x) { return ('0' + (+x).toString(16)).slice(-2); }).join('');
  }
  function grupoDe(el) {
    var g = el.getAttribute && el.getAttribute('data-grade-nome');
    if (g) return limpo(g);
    var bloco = el.closest && el.closest(AREA);
    for (var i = 0; bloco && i < 4; i++, bloco = bloco.parentElement && bloco.parentElement.closest(AREA)) {
      var rot = bloco.querySelector('b, label, legend, strong, h3, h4, [class*="titulo"], [class*="label"]');
      if (rot && !rot.contains(el)) return limpo(rot.innerText).slice(0, 60);
    }
    return '';
  }
  function item(el) {
    var op = el.tagName === 'SELECT' ? el.options[el.selectedIndex] : opcaoDe(el);
    var v = textoOpcao(op);
    return v ? { grupo: grupoDe(op || el), valor: v, hex: hexDe(op) } : null;
  }

  // opções marcadas; se um grupo não tiver nada marcado, usa a 1ª opção dele (cor inicial do modelo)
  function selecionadas() {
    var porGrupo = {}, ordem = [];
    document.querySelectorAll('[data-variacao-nome], ' + AREA.split(',').map(function (a) { return a + ' ' + SELECIONADO.split(',').join(', ' + a + ' '); }).join(', ') + ', select').forEach(function (el) {
      if (el.closest && el.closest('.nika3d')) return;
      if (el.tagName === 'SELECT' && !el.closest(AREA)) return;     // ignora quantidade, frete etc.
      var it = item(el); if (!it) return;
      var marcado = el.tagName === 'SELECT' || el.matches(SELECIONADO) || (el.closest('li') && el.closest('li').matches(SELECIONADO));
      if (!(it.grupo in porGrupo)) { porGrupo[it.grupo] = it; ordem.push(it.grupo); }
      if (marcado) porGrupo[it.grupo] = it;
    });
    return ordem.map(function (g) { return porGrupo[g]; });
  }
  function enviar(lista) {
    if (!lista.length) return;
    iframes().forEach(function (f) { enviarPara(f, { nika3d: 'variacao', opcoes: lista }); });
  }
  function aoEscolher(ev) {
    if (!iframes().length) return;
    var alvo = ev.target;
    if (!(alvo.closest && (alvo.closest(AREA) || alvo.closest('[data-variacao-nome]'))) && alvo.tagName !== 'SELECT') return;
    var clicado = item(alvo);
    setTimeout(function () {       // a loja marca a opção um instante depois do clique
      var lista = selecionadas();
      if (clicado) lista = lista.filter(function (o) { return o.grupo !== clicado.grupo; }).concat([clicado]);
      enviar(lista);
    }, 120);
  }
  document.addEventListener('click', aoEscolher, true);
  document.addEventListener('change', aoEscolher, true);

  /* ---------- levar o simulador para o lugar da foto ---------- */
  function posicionar() {
    var caixa = document.querySelector('.nika3d');
    var foto = document.querySelector('.conteiner-imagem');
    if (!caixa || !foto || foto.contains(caixa) || caixa.getAttribute('data-posicao') === 'descricao') return;
    var img = foto.querySelector('#imagemProduto, img');
    var temFoto = img && !SEM_IMAGEM.test(img.getAttribute('src') || '');
    var original = foto.firstElementChild;

    caixa.style.cssText = 'width:100%;max-width:none;margin:0';
    var f = caixa.querySelector('iframe');
    if (f && f.src.indexOf('modo=loja') < 0) f.src = f.src + (f.src.indexOf('?') < 0 ? '?' : '&') + 'modo=loja';
    if (f) f.style.cssText = 'width:100%;aspect-ratio:1/1;height:auto;border:0;display:block;border-radius:10px';
    foto.insertBefore(caixa, foto.firstChild);
    if (original) original.style.display = 'none';

    if (temFoto && original) {          // botões 3D / Fotos
      var bar = document.createElement('div');
      bar.style.cssText = 'display:flex;gap:6px;margin:8px 0 0';
      [['Ver em 3D', true], ['Ver fotos', false]].forEach(function (b) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = b[0];
        btn.style.cssText = 'flex:1;border:1px solid #E5458C;border-radius:8px;padding:6px;font:600 13px sans-serif;cursor:pointer';
        btn.onclick = function () {
          caixa.style.display = b[1] ? '' : 'none'; original.style.display = b[1] ? 'none' : '';
          estilo();
        };
        bar.appendChild(btn);
      });
      foto.appendChild(bar);
      var estilo = function () {
        bar.children[0].style.background = caixa.style.display === 'none' ? '#fff' : '#E5458C';
        bar.children[0].style.color = caixa.style.display === 'none' ? '#E5458C' : '#fff';
        bar.children[1].style.background = caixa.style.display === 'none' ? '#E5458C' : '#fff';
        bar.children[1].style.color = caixa.style.display === 'none' ? '#fff' : '#E5458C';
      };
      estilo();
    }
    // tira da descrição o que sobrou do trecho (o <style> com altura fixa)
    document.querySelectorAll('style').forEach(function (s) { if (/\.nika3d/.test(s.textContent)) s.remove(); });
  }

  /* ---------- conversa com o simulador ---------- */
  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGEM || !e.data) return;
    if (e.data.nika3dPronto) {
      iframes().forEach(function (f) { if (f.contentWindow === e.source) enviarPara(f, { nika3d: 'modo', modo: 'loja' }); });
      enviar(selecionadas());
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', posicionar); else posicionar();
})();
