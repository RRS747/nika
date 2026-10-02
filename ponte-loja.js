/*
  Nikateliê — ponte entre a página do produto (Loja Integrada) e o simulador 3D.
  Quando o cliente escolhe uma variação (ex.: "Azul Velvet"), o modelo 3D troca de cor.

  Instalação: cole UMA vez nos códigos personalizados da loja (rodapé/body):
    <script src="https://rrs747.github.io/nika/ponte-loja.js" defer></script>
  Ele só age em páginas que tenham o iframe do simulador.

  Dica: para peças com mais de uma parte, coloque o nome da parte no grupo
  da variação, ex.: "Cor da Tampa", "Cor das Laterais". Um grupo só "Cor"
  pinta a peça inteira.
*/
(function () {
  var ORIGEM = 'https://rrs747.github.io';
  var AREA = '[class*="atribut"],[class*="variac"],[class*="variant"],[class*="opcao"],[class*="opcoes"],[id*="atribut"],[id*="variac"]';
  var SELECIONADO = '.active,.ativo,.selecionado,.selected,.checked,[aria-checked="true"],[aria-selected="true"],input:checked';

  function iframes() {
    return Array.prototype.filter.call(document.querySelectorAll('iframe'), function (f) {
      return (f.src || '').indexOf('/nika') > -1;
    });
  }
  function limpo(t) { return (t || '').replace(/\s+/g, ' ').trim(); }

  // texto que representa a opção (texto visível, title, alt ou data-*)
  function textoOpcao(el) {
    if (!el) return '';
    if (el.tagName === 'SELECT') return limpo(el.options[el.selectedIndex] && el.options[el.selectedIndex].text);
    if (el.tagName === 'INPUT' && el.labels && el.labels[0]) return limpo(el.labels[0].innerText);
    var t = limpo(el.innerText);
    if (!t || t.length > 60) {
      var img = el.querySelector && el.querySelector('img[alt],[title]');
      t = limpo(el.getAttribute('title') || el.getAttribute('data-variacao-nome') || el.getAttribute('data-nome') ||
                el.getAttribute('aria-label') || (img && (img.getAttribute('alt') || img.getAttribute('title'))) || t);
    }
    return t.length > 60 ? '' : t;
  }

  // nome do grupo (ex.: "Cor da Tampa") — primeiro rótulo dentro do bloco da variação
  function grupoDe(el) {
    var bloco = el.closest && el.closest(AREA);
    for (var i = 0; bloco && i < 4; i++, bloco = bloco.parentElement && bloco.parentElement.closest(AREA)) {
      var rot = bloco.querySelector('label, legend, strong, b, h3, h4, .nome, [class*="titulo"], [class*="label"]');
      if (rot && !rot.contains(el)) return limpo(rot.innerText).slice(0, 60);
    }
    return '';
  }

  function selecionadas() {
    var lista = [];
    document.querySelectorAll(AREA).forEach(function (area) {
      area.querySelectorAll(SELECIONADO + ',select').forEach(function (el) {
        var v = textoOpcao(el);
        if (v) lista.push({ grupo: grupoDe(el), valor: v });
      });
    });
    return lista;
  }

  function enviar(lista) {
    if (!lista.length) return;
    iframes().forEach(function (f) {
      try { f.contentWindow.postMessage({ nika3d: 'variacao', opcoes: lista }, ORIGEM); } catch (e) {}
    });
  }

  function aoEscolher(ev) {
    if (!iframes().length) return;
    var alvo = ev.target.closest ? ev.target.closest('a,button,li,label,option,select,input,span,div') : ev.target;
    if (!alvo) return;
    var dentroDaArea = alvo.closest && alvo.closest(AREA);
    var clicado = textoOpcao(alvo);
    if (!dentroDaArea && alvo.tagName !== 'SELECT') return;
    var lista = [];
    if (clicado) lista.push({ grupo: grupoDe(alvo), valor: clicado });
    // a loja marca a opção escolhida um instante depois do clique
    setTimeout(function () { enviar(selecionadas().concat(lista)); }, 120);
  }

  document.addEventListener('click', aoEscolher, true);
  document.addEventListener('change', aoEscolher, true);

  // quando o simulador termina de carregar, manda a variação que já estiver marcada
  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGEM || !e.data) return;
    if (e.data.nika3dPronto) enviar(selecionadas());
    if (e.data.nikatelie3d) iframes().forEach(function (f) {
      if (f.contentWindow === e.source) f.style.height = e.data.nikatelie3d + 'px';
    });
  });
})();
