/*
  Nikateliê — carregador do simulador 3D na Loja Integrada.
  (Este arquivo não muda; ele busca sempre a versão mais recente de ponte-app.js, sem cache antigo.)
  Instalação: Configurações > Códigos HTML > Rodapé > Página de produto > tipo HTML
    <script src="https://rrs747.github.io/nika/ponte-loja.js" defer></script>
*/
(function () {
  var v = Math.floor(Date.now() / 120000);      // muda a cada 2 minutos
  var s = document.createElement('script');
  s.src = 'https://rrs747.github.io/nika/ponte-app.js?v=' + v;
  s.async = true;
  document.head.appendChild(s);
})();
