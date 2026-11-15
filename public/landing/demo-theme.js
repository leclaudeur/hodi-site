// The theme the landing asks for, before the first paint: from the address, the only thing a sandboxed page reads.
(function () {
  var t = new URLSearchParams(location.search).get('theme')
  if (t === 'poudre') t = 'powder'
  if (t) document.documentElement.dataset.theme = t
})()
