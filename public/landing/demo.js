// Replays snapshots of the real Hodi app: the app's own markup and CSS, one state per screen, clicks move between them.
;(() => {
  const D = window.DEMO
  const root = document.documentElement
  let demoK = ''
  // The start button is sized by the landing's scale: it only animates a press, never that scale arriving or changing.
  const settleIntro = intro => requestAnimationFrame(() => requestAnimationFrame(() => intro.classList.add('settled')))
  const params = new URLSearchParams(location.search)
  let current = null
  // The last screen without a window open, where Escape goes back to.
  let plain = null
  let autoTimer = 0

  const setTheme = theme => {
    if (theme === 'poudre') theme = 'powder'
    if (['light', 'dark', 'powder'].includes(theme)) root.dataset.theme = theme
  }
  setTheme(root.dataset.theme || params.get('theme'))

  // The gos a feature's script presses or marks; none for the hero, whose tour leaves its whole screen to explore.
  const base = D.name.replace(/-en$/, '').replace(/-(desk|tab|phone)$/, '')
  // Demos whose whole point fits the screen: nothing to scroll.
  // Nothing scrolls by hand, in any direction: a demo only moves where its own script or tour moves it. The one
  // exception is the AI demo once it has played, where the summary and the answer are read down the article.
  const still = base !== 'ai'
  if (still) root.style.overflow = 'hidden'
  const allowed = () => {
    const all = window.DEMO_SCRIPTS || {}
    const list = all[D.name] || all[base]
    return list && new Set(list.map(step => step.go || step.spot).filter(Boolean))
  }
  const say = message => parent !== window && parent.postMessage({ demo: D.name, ...message }, '*')

  // Where each scrolled box is, by its place in the page, so the same box can be found on the next screen.
  const pathOf = e => {
    const parts = []
    for (; e && e !== document.body; e = e.parentElement) parts.push(e.tagName + [...e.parentElement.children].indexOf(e))
    return parts.join('<')
  }
  const scrolled = () => {
    const map = new Map()
    for (const e of document.body.querySelectorAll('*')) if (e.scrollTop || e.scrollLeft) map.set(pathOf(e), [e.scrollLeft, e.scrollTop])
    map.set('window', [scrollX, scrollY])
    return map
  }
  const glide = (before, s) => {
    // A state that only adds to the screen (a reaction) keeps every scroll where the visitor left it.
    if (s.keep) {
      for (const [path, [x, y]] of before) {
        if (path === 'window') continue
        const e = [...document.body.querySelectorAll('*')].find(z => pathOf(z) === path)
        if (e) (e.scrollLeft = x), (e.scrollTop = y)
      }
      const [wx, wy] = before.get('window') || [0, 0]
      scrollTo(wx, wy)
      return
    }
    const targets = new Map()
    document.body.querySelectorAll('[data-scroll]:not(input):not(textarea)').forEach(e => targets.set(e, e.dataset.scroll.split(',').map(Number)))
    for (const [path] of before) {
      if (path === 'window') continue
      const e = [...document.body.querySelectorAll('*')].find(x => pathOf(x) === path)
      if (e && !targets.has(e)) targets.set(e, [0, 0])
    }
    for (const [e, [x, y]] of targets) {
      const from = before.get(pathOf(e))
      if (from && (from[0] !== x || from[1] !== y)) {
        e.scrollLeft = from[0]
        e.scrollTop = from[1]
        e.scrollTo({ left: x, top: y, behavior: 'smooth' })
      } else {
        e.scrollLeft = x
        e.scrollTop = y
      }
    }
    const from = before.get('window')
    if (from && (from[0] !== s.win[0] || from[1] !== s.win[1])) {
      scrollTo(from[0], from[1])
      scrollTo({ left: s.win[0], top: s.win[1], behavior: 'smooth' })
    } else scrollTo(s.win[0], s.win[1])
  }

  // A new state patches the screen in place instead of rebuilding it: rebuilt cards, glows and lists would replay
  // their entrance animations and flash, while the app itself only opens a menu over the same screen.
  const sameNode = (a, b) => a.nodeType === b.nodeType && a.nodeName === b.nodeName
  const syncAttrs = (from, to) => {
    // A window that the next state shows closed is closed properly, or it would keep the page inert.
    if (from.localName === 'dialog' && from.open && !to.hasAttribute('open')) from.close()
    for (const a of [...from.attributes]) if (!to.hasAttribute(a.name)) from.removeAttribute(a.name)
    for (const a of to.attributes) if (from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value)
  }
  const morph = (from, to) => {
    const olds = [...from.childNodes]
    const news = [...to.childNodes]
    news.forEach((n, i) => {
      const o = olds[i]
      if (o && sameNode(o, n)) {
        if (n.nodeType === 1) {
          syncAttrs(o, n)
          morph(o, n)
        } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue
      } else if (o) from.replaceChild(n, o)
      else from.appendChild(n)
    })
    for (const o of olds.slice(news.length)) o.remove()
  }
  const patch = (body, html) => {
    const t = document.createElement('template')
    t.innerHTML = html
    morph(body, document.importNode(t.content, true))
  }

  const apply = (name, { fade = true } = {}) => {
    const s = D.states[name]
    if (!s) return
    clearTimeout(autoTimer)
    const swap = () => {
      const before = scrolled()
      // A window already open stays open across its own states (a box ticked, a word typed): only the first one opens.
      const wasOpen = !!document.querySelector('dialog[open]')
      for (const a of [...root.attributes]) if (a.name !== 'data-theme') root.removeAttribute(a.name)
      for (const [k, v] of Object.entries(s.html)) root.setAttribute(k, v)
      // The landing's scale outlives the screen's own attributes.
      if (demoK) root.style.setProperty('--demo-k', demoK)
      const body = document.body
      for (const a of [...body.attributes]) body.removeAttribute(a.name)
      for (const [k, v] of Object.entries(s.body)) body.setAttribute(k, v)
      // The page itself never scrolls by hand in a still demo: only the script moves it.
      if (still) for (const e of [root, body]) e.style.overflow = 'hidden'
      // The finger and its shield step out while the screen is patched: the patch would turn them into the new
      // screen's own nodes, and the finger would be lost for the rest of the demo.
      show.block?.remove()
      show.finger?.remove()
      patch(body, s.inner)
      glide(before, s)
      body.querySelectorAll('dialog[data-modal]').forEach(d => {
        // During the tour the screen is already dimmed and the window is lit at once: an opening animation would
        // fade the tour's own shade in with it and flash the screen behind.
        if (tour.mode === 'tour' || wasOpen) d.classList.add('demo-still')
        // A window kept open by the patch stays as it is.
        if (d.matches(':modal')) return
        d.removeAttribute('open')
        try {
          d.showModal()
        } catch {
          d.setAttribute('open', '')
        }
      })
      // The browser's own hover tooltips are not part of a demo.
      body.querySelectorAll('[title]').forEach(e => e.removeAttribute('title'))
      // A menu the app opened in the top layer opens again where it was.
      body.querySelectorAll('[popover]').forEach(p => {
        if (p.matches(':popover-open')) return
        try {
          p.showPopover()
        } catch {}
      })
      // Opening a window puts the focus on its first button: in a demo nothing has the focus, so no button looks pressed.
      if (document.activeElement && document.activeElement !== body) document.activeElement.blur()
      // A feature demo is only what its script shows: any other marked button is left as plain markup.
      const only = allowed()
      if (only) {
        for (const e of body.querySelectorAll('[data-go]')) if (!only.has(e.dataset.go)) e.removeAttribute('data-go')
        for (const e of body.querySelectorAll('[data-submit]')) if (!only.has(e.dataset.submit)) e.removeAttribute('data-submit')
      }
      // An open window's Annuler or Fermer without its own mark still closes it (outside the tour, which leads the way).
      if (tour.mode !== 'tour')
        for (const b of body.querySelectorAll('dialog[open] button:not([data-go])'))
          if (/^(Annuler|Fermer|Cancel|Close)$/.test((b.getAttribute('aria-label') || b.textContent).trim())) b.dataset.demoClose = ''
      // Boxes that scroll keep the pointer, so the wheel and a drag still scroll them (demo.css takes it elsewhere).
      for (const e of body.querySelectorAll('*')) {
        const cs = getComputedStyle(e)
        const scrolls = (o, size, box) => (o === 'auto' || o === 'scroll') && size > box
        const y = scrolls(cs.overflowY, e.scrollHeight, e.clientHeight)
        const x = scrolls(cs.overflowX, e.scrollWidth, e.clientWidth)
        if (!x && !y) continue
        // In a still demo nothing scrolls, not even under a button that bubbles the wheel up; the captured position stays.
        // In the AI demo only the article scrolls, down to its questions; the list beside it holds still.
        if (still || x || !e.querySelector('#summary, form')) e.style.overflow = 'hidden'
        else e.dataset.scrolls = ''
      }
      current = name
      if (!body.querySelector('dialog[open]')) plain = name
      if (s.auto && !(s.auto.free && show.mode === 'playing')) autoTimer = setTimeout(() => apply(s.auto.go), s.auto.after)
      say({ state: name })
      renderTour()
      // A new screen replaces the body: the playing finger and its shield come back on top.
      if (show.mode === 'playing') host().append(show.block, show.finger)
    }
    // A window or a menu opening or closing has its own animation, as in the app: a cross-fade on top of it would
    // show both screens at once.
    const layered = html => /data-modal|popover=/.test(html)
    const overlaid = !!document.querySelector('dialog[open], [popover]') || layered(s.inner)
    if (fade && !overlaid && document.startViewTransition) document.startViewTransition(swap)
    else swap()
  }

  // Nothing leaves the demo: links and buttons only do what a marked state says.
  let swallow = false
  document.addEventListener(
    'click',
    event => {
      if (swallow) {
        swallow = false
        event.preventDefault()
        event.stopPropagation()
        return
      }
      const el = event.target instanceof Element ? event.target : null
      if (!el) return
      const go = el.closest('[data-go]')
      if (go) {
        event.preventDefault()
        event.stopPropagation()
        const at = tour.mode === 'tour' && D.tour[tour.step]
        if (at?.press && go.dataset.go !== at.press) return
        const then = stepState(go.dataset.go)
        if (tour.mode === 'tour') pressedInTour(go)
        apply(then)
        return
      }
      // A window's own Annuler or Fermer closes it, as in the app.
      if (el.closest('[data-demo-close]') && tour.mode !== 'tour') {
        event.preventDefault()
        closeOverlay()
        return
      }
      if (el.closest('a, button')) event.preventDefault()
      // A press beside an open window or menu closes it, as in the app.
      if (outside(event.clientX, event.clientY)) closeOverlay()
    },
    true
  )
  document.addEventListener(
    'submit',
    event => {
      event.preventDefault()
      const go = event.target.closest('[data-submit]')
      if (go) apply(go.dataset.submit)
    },
    true
  )
  // The open window or menu, and whether a point lies beside it. During the tour the tour leads: nothing closes.
  const overlay = () => {
    const dialog = document.querySelector('dialog[open]')
    if (dialog) return dialog.firstElementChild || dialog
    return [...document.querySelectorAll('[popover]')].find(p => p.matches(':popover-open')) || null
  }
  const outside = (x, y) => {
    const box = tour.mode !== 'tour' && overlay()
    if (!box) return false
    const r = box.getBoundingClientRect()
    return x < r.left || x > r.right || y < r.top || y > r.bottom
  }
  // Closing goes back to the state the window's own "Annuler" leads to, else to the one the state names, else to the
  // last screen without a window (a feature demo keeps only what it shows).
  const closeOverlay = () => {
    const cancel = [...document.querySelectorAll('dialog [data-go]')].find(b => /Annuler|Fermer|Cancel|Close/.test(b.textContent + (b.getAttribute('aria-label') || '')))
    const back = cancel?.dataset.go || D.states[current]?.close || (plain !== current ? plain : null)
    if (back) apply(back)
  }
  // Escape closes an open window or menu too.
  document.addEventListener(
    'cancel',
    event => {
      event.preventDefault()
      if (show.mode === 'playing' || tour.mode === 'tour') return
      closeOverlay()
    },
    true
  )
  document.addEventListener(
    'keydown',
    event => {
      if (event.key !== 'Escape' || show.mode === 'playing' || tour.mode === 'tour') return
      if (!document.querySelector('dialog[open]') && overlay()) closeOverlay()
    },
    true
  )

  // The app's tour classes (app/Tour.tsx).
  const T = {
    layer: '_layer_14zxf_3',
    pane: '_pane_14zxf_11',
    hole: '_hole_14zxf_25',
    bubble: '_bubble_14zxf_35',
    below: '_below_14zxf_52',
    above: '_above_14zxf_53',
    head: '_head_14zxf_86',
    bars: '_bars_14zxf_97',
    done: '_done_14zxf_109',
    title: '_title_14zxf_143',
    text: '_text_14zxf_151',
    line: '_line_14zxf_171',
    foot: '_foot_14zxf_122',
    ahead: '_ahead_14zxf_132',
    count: '_count_14zxf_113',
    dim: '_dim_14zxf_16',
    neutral: '_button_jc9xd_3 _neutral_jc9xd_68',
    primary: '_button_jc9xd_3 _primary_jc9xd_74',
    round: '_button_11h7q_1 _default_11h7q_27 _size44_11h7q_46'
  }
  const PAD = 6
  // The demo's own words follow the language it was captured in.
  const W = (fr, en) => (D.lang === 'en' ? en : fr)
  // Lucide chevron-left, as the app's icon buttons draw it.
  const CHEVRON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
  const CHEVRON_R = CHEVRON.replace('m15 18-6-6 6-6', 'm9 18 6-6-6-6')
  const CHECK = CHEVRON.replace('<path d="m15 18-6-6 6-6"/>', '<path d="M20 6 9 17l-5-5"/>')
  const GAP = 12
  const MARGIN = 16
  const EDGE = 3
  // A phone demo is shown smaller than life on the landing: its bubble is scaled back so its text reads at the size of
  // the page's own text, and narrowed so it still fits the screen.
  const sizeBubble = bubble => {
    const k = parseFloat(getComputedStyle(root).getPropertyValue('--demo-k')) || 1
    const z = innerWidth < 600 && k < 1 ? 1 / k : 1
    // A transform rather than CSS zoom: every browser measures it the same way, and its position stays in page pixels.
    bubble.style.transformOrigin = '0 0'
    bubble.style.scale = String(z)
    const width = Math.min(340, (innerWidth - MARGIN * 2) / z)
    bubble.style.width = px(width)
    return { z, width: width * z }
  }
  // The hero's tour has three moments: a dimmed screen with one button, the tour itself, then the app left free with
  // a hotspot on each place the tour showed, to read its bubble again.
  const tour = { mode: !D.tour ? 'none' : params.get('tour') === 'off' ? 'spots' : 'intro', step: 0, open: -1 }
  const host = () => document.querySelector('dialog[open]') || document.body
  const px = v => `${v}px`


  // Brings an element into view by scrolling only the demo's own boxes. scrollIntoView would also scroll the landing
  // page around the frame.
  const reveal = (target, behavior = 'smooth') => {
    const scrollers = []
    for (let e = target.parentElement; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e)
      const y = e.scrollHeight > e.clientHeight + 1 && cs.overflowY !== 'visible'
      const x = e.scrollWidth > e.clientWidth + 1 && cs.overflowX !== 'visible'
      if (x || y) scrollers.push([e, x, y])
    }
    scrollers.push([document.scrollingElement, false, true])
    for (const [e, x, y] of scrollers) {
      const r = target.getBoundingClientRect()
      const page = e === document.scrollingElement
      const box = page ? { top: 0, bottom: innerHeight, left: 0, right: innerWidth } : e.getBoundingClientRect()
      const by = { behavior }
      // Something already fully in view is pressed where it is: nothing scrolls unless it has to.
      if (y && (r.top < box.top || r.bottom > box.bottom))
        by.top = r.top + r.height / 2 - (box.top + box.bottom) / 2
      if (x && (r.left < box.left || r.right > box.right)) by.left = r.left + r.width / 2 - (box.left + box.right) / 2
      if (by.top || by.left) {
        e.scrollBy(by)
        return true
      }
    }
    return false
  }

  const goStep = step => {
    tour.step = step
    const at = D.tour[tour.step]
    if (current !== at.state) apply(at.state)
    else renderTour()
  }

  const finish = () => {
    tour.mode = 'spots'
    tour.open = -1
    renderTour()
    say({ tour: 'off' })
  }

  // A step's press can open another screen than the app's own next one (the share window with Antho ticked).
  const stepState = go => (tour.mode === 'tour' && D.tour[tour.step]?.then) || go
  const pressedInTour = el => {
    const at = D.tour[tour.step]
    // A lit window can name the one button that moves on (Envoyer); its other buttons wait.
    if (at.until === 'press' && (at.press ? el.dataset.go === at.press : el.closest(`[data-t="${at.target}"]`))) {
      if (tour.step + 1 < D.tour.length) tour.step++
      else tour.mode = 'spots'
    }
  }

  const button = (cls, label, onClick) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = cls
    b.textContent = label
    b.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
      onClick()
    })
    return b
  }

  const el = (tag, cls, style) => {
    const e = document.createElement(tag)
    if (cls) e.className = cls
    if (style) Object.assign(e.style, style)
    return e
  }

  // The part of a target on screen: a reader taller than the window is lit down to the window's edge.
  // A window or a panel with its own rounded edge is outlined on that edge; a button or a card gets a margin around it.
  const padOf = target => (target.matches('dialog') || parseFloat(getComputedStyle(target).borderTopLeftRadius) >= 20 ? 0 : PAD)
  const holeOf = target => {
    const r = target.getBoundingClientRect()
    const pad = padOf(target)
    // A lit edge near the screen's edge stays inside it, or its outline and glow are cut by the frame. A box that
    // reaches the screen's edge (a reader, a row as wide as the screen) has no outline on that side at all: the edge
    // goes well past the screen, glow included, instead of drawing a line along the rounded frame.
    const OUT = 40
    const fit = (v, min, max, lo, hi) => (lo ? -OUT + min : hi ? max + OUT : Math.min(Math.max(v, min + EDGE), max - EDGE))
    const top = fit(r.top - pad, 0, innerHeight, r.top <= 0, false)
    const bottom = fit(r.bottom + pad, 0, innerHeight, false, r.bottom >= innerHeight)
    const left = fit(r.left - pad, 0, innerWidth, r.left <= 0, false)
    const right = fit(r.right + pad, 0, innerWidth, false, r.right >= innerWidth)
    return { top, left, width: right - left, height: bottom - top }
  }

  // The app's bubble beside a box: below it, above it, or next to it when neither has room. It is measured in place
  // first, so a long text never runs off the screen.
  const placeBubble = (layer, bubble, hole) => {
    Object.assign(bubble.style, { left: '0', top: '0', visibility: 'hidden' })
    const { z, width } = sizeBubble(bubble)
    bubble.setAttribute('role', 'dialog')
    layer.append(bubble)
    const height = bubble.getBoundingClientRect().height
    const centre = hole.left + hole.width / 2
    let left = Math.min(Math.max(centre - width / 2, MARGIN), innerWidth - width - MARGIN)
    let top
    if (hole.top + hole.height + GAP + height + MARGIN < innerHeight) {
      bubble.classList.add(T.below)
      top = hole.top + hole.height + GAP
    } else if (hole.top - GAP - height > MARGIN) {
      bubble.classList.add(T.above)
      top = hole.top - GAP - height
    } else {
      left = hole.left - GAP - width > MARGIN ? hole.left - GAP - width : Math.min(hole.left + hole.width + GAP, innerWidth - width - MARGIN)
      top = Math.min(Math.max(hole.top + hole.height / 2 - height / 2, MARGIN), innerHeight - height - MARGIN)
    }
    Object.assign(bubble.style, { left: px(left), top: px(top), visibility: '' })
    bubble.style.setProperty('--tip', px(Math.min(Math.max(centre - left, 24 * z), width - 24 * z) / z))
  }

  const words = (at, { bars, act }) => {
    const head = el('div', T.head)
    if (bars) {
      const row = el('div', T.bars)
      D.tour.forEach((_, i) => row.append(el('i', i <= tour.step ? T.done : '')))
      head.append(row)
    }
    const title = el('h2', T.title)
    title.textContent = at.title
    head.append(title)
    // One real paragraph: the sentences run on, the bubble decides where lines break.
    const text = el('p', T.text)
    text.textContent = (act && at.act ? [...at.text, at.act] : at.text).join(' ')
    return [head, text]
  }

  // Hotspots live with what they point at: one on the page stays under an open window or menu (which covers it
  // without removing it), one inside a window or a menu sits on top of it.
  const overOf = target => target.closest('dialog[open], [popover]') || document.body
  const layerFor = (layers, target) => {
    const over = overOf(target)
    if (!layers.has(over)) {
      const layer = el('div', T.layer)
      layer.dataset.demoTour = ''
      over.append(layer)
      layers.set(over, layer)
    }
    return layers.get(over)
  }

  function renderTour() {
    document.querySelectorAll('[data-demo-tour]').forEach(e => e.remove())
    if (tour.mode === 'none') {
      if (show.mode === 'free') renderGoSpots()
      return
    }
    const layer = el('div', T.layer)
    layer.dataset.demoTour = ''
    host().append(layer)
    if (tour.mode === 'intro') renderIntro(layer)
    else if (tour.mode === 'tour') renderStep(layer)
    else {
      layer.remove()
      renderSpots()
    }
  }

  // The whole screen veiled like behind one of the app's windows (its scrim, grain and blur), one button in the middle.
  function renderIntro(layer) {
    layer.append(el('div', `${T.pane} demo-shade`))
    const middle = el('div', 'demo-intro')
    const start = () => {
      tour.mode = 'tour'
      goStep(0)
    }
    middle.append(button(T.primary, W('Commencer la visite', 'Start the tour'), start))
    // The whole veiled screen starts the tour, not only its button.
    middle.addEventListener('click', event => {
      event.preventDefault()
      start()
    })
    layer.append(middle)
    // Until the landing gives its scale, the button waits unseen: it would show at the wrong size, then jump.
    if (demoK || window.parent === window) settleIntro(middle)
  }

  // A step as the app draws it (app/Tour.tsx): the target lit, the rest dimmed, a bubble with its counter.
  function renderStep(layer) {
    const at = D.tour[tour.step]
    if (current !== at.state) return
    const target = document.querySelector(`[data-t="${at.target}"]`)
    if (!target) return
    const r0 = target.getBoundingClientRect()
    if (r0.height < innerHeight && (r0.top < 0 || r0.bottom > innerHeight)) reveal(target, 'instant')
    const last = tour.step === D.tour.length - 1
    const bubble = el('div', T.bubble)
    const foot = el('div', T.foot)
    const count = el('span', T.count)
    count.textContent = `${tour.step + 1} / ${D.tour.length}`
    const skip = button(T.neutral, W('Passer', 'Skip'), finish)
    // On the landing, a step can be seen again: back and forward without redoing the whole tour. A step to press
    // moves on as the press would.
    const ahead = el('span', T.ahead)
    ahead.append(count)
    if (tour.step > 0) {
      const back = button(T.round, '', () => goStep(tour.step - 1))
      back.setAttribute('aria-label', W('Étape précédente', 'Previous step'))
      back.innerHTML = CHEVRON
      ahead.append(back)
    }
    // Round arrows keep the foot as small as the app's; the last one ends the tour.
    const next = button(T.round.replace('_default_11h7q_27', '_primary_11h7q_69'), '', () => {
      if (last) return finish()
      const go = at.until === 'press' && (at.press ? document.querySelector(`[data-go="${at.press}"]`) : target.closest('[data-go]'))
      if (!go) return goStep(tour.step + 1)
      const then = stepState(go.dataset.go)
      tour.step++
      apply(then)
    })
    next.setAttribute('aria-label', last ? W('Terminer la visite', 'End the tour') : W('Étape suivante', 'Next step'))
    next.innerHTML = last ? CHECK : CHEVRON_R
    ahead.append(next)
    foot.append(skip, ahead)
    bubble.append(...words(at, { bars: true, act: true }), foot)
    // The bubble never covers what it talks about. Measured first, it goes under or over the lit box; on a small
    // screen with no room for either, the box makes room: a window moves up to the top, the page scrolls just
    // enough, and a box taller than what is left (a reader) is lit down to where the bubble starts.
    bubble.style.visibility = 'hidden'
    sizeBubble(bubble)
    layer.append(bubble)
    const tall = bubble.getBoundingClientRect().height
    bubble.remove()
    let hole = holeOf(target)
    const room = h => h.top + h.height + GAP + tall + MARGIN < innerHeight || h.top - GAP - tall > MARGIN
    if (!room(hole)) {
      if (target.matches('dialog')) {
        target.style.margin = `${MARGIN}px auto auto`
        hole = holeOf(target)
        // Too tall for the screen: the window's top (its title) slides out of view rather than its buttons. The
        // bubble keeps the size of every other step.
        if (!room(hole)) {
          const over = hole.top + hole.height + GAP + tall + MARGIN + 1 - innerHeight
          target.style.margin = `${MARGIN - over}px auto auto`
          hole = holeOf(target)
        }
      } else if (hole.height + GAP + tall + MARGIN * 2 < innerHeight) {
        scrollBy({ top: hole.top + hole.height + GAP + tall + MARGIN + 1 - innerHeight, behavior: 'instant' })
        hole = holeOf(target)
      }
      if (!room(hole) && !target.matches('dialog')) hole.height = Math.max(innerHeight - MARGIN - tall - GAP - hole.top - 1, 0)
    }
    const radius = Math.min(parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0, hole.height / 2) + padOf(target)
    const box = Object.fromEntries(Object.entries(hole).map(([k, v]) => [k, px(v)]))
    layer.append(
      el('div', T.pane, { top: '0', left: '0', right: '0', height: px(hole.top) }),
      el('div', T.pane, { top: px(hole.top + hole.height), left: '0', right: '0', bottom: '0' }),
      el('div', T.pane, { top: px(hole.top), left: '0', width: px(Math.max(hole.left, 0)), height: px(hole.height) }),
      el('div', T.pane, { top: px(hole.top), left: px(hole.left + hole.width), right: '0', height: px(hole.height) }),
      el('div', T.hole, { ...box, borderRadius: px(radius) })
    )
    // A step to look at, not to press: the lit target takes no click either.
    if (at.until !== 'press') layer.append(el('div', T.pane, box))

    placeBubble(layer, bubble, hole)
    say({ step: tour.step })
  }

  // After the tour: nothing dimmed, a pulsing dot on each place the tour showed, its bubble again on a click.
  function renderSpots() {
    const layers = new Map()
    const seen = new Set()
    D.tour.forEach((at, i) => {
      if (seen.has(at.target)) return
      seen.add(at.target)
      const target = document.querySelector(`[data-t="${at.target}"]`)
      if (!target) return
      // A step can put its dot on a part of its target (the first of a row that runs past the screen's edge).
      const r = ((at.spotIn && target.querySelector(at.spotIn)) || target).getBoundingClientRect()
      if (!r.width) return
      // A button gets its dot on its corner, like a badge; a larger area on the middle of its top edge, clear of
      // its content. A step can name its own place. The dot stays on that place as it scrolls, and goes with it.
      const [fx, fy] = at.spot || (r.width > 120 && r.height > 60 ? [0.5, 0] : [1, 0])
      let x = r.left + r.width * fx - (fx === 1 ? 2 : 0)
      let y = r.top + r.height * fy + (fy === 0 ? 2 : 0)
      if (!at.spot && fx === 1) [x, y] = corner(target, r)
      if (!inView(target, x, y)) return
      const layer = layerFor(layers, target)
      const dot = el('button', 'demo-spot', { left: px(x), top: px(y) })
      dot.type = 'button'
      dot.setAttribute('aria-label', at.title)
      if (tour.open === i) dot.classList.add('open')
      dot.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        tour.open = tour.open === i ? -1 : i
        renderTour()
      })
      layer.append(dot)
      if (tour.open !== i) return
      // An open tip dims the screen like the tour, and says how to close it.
      layer.prepend(el('div', `${T.pane} ${T.dim}`))
      const bubble = el('div', `${T.bubble} demo-tip`)
      const foot = el('div', T.foot)
      const close = button(`${T.neutral} demo-close`, W('Fermer', 'Close'), () => {
        tour.open = -1
        renderTour()
      })
      foot.append(close)
      bubble.append(...words(at, { bars: false, act: false }), foot)
      placeBubble(layer, bubble, { top: y - 9, left: x - 9, width: 18, height: 18 })
    })
  }

  // A click anywhere else closes the open bubble and still does what it does in the app.
  addEventListener(
    'pointerdown',
    event => {
      if (tour.mode === 'spots' && tour.open >= 0 && !event.target.closest?.('.demo-tip, .demo-spot')) {
        // The click only closes the tip: what lies under the dimmed screen is not pressed.
        swallow = true
        setTimeout(() => (swallow = false), 500)
        tour.open = -1
        renderTour()
      }
    },
    true
  )
  // Hotspots follow what they point at.
  let frame = 0
  const follow = () => {
    if (tour.mode !== 'spots' && tour.mode !== 'tour' && show.mode !== 'free') return
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(renderTour)
  }
  addEventListener('scroll', follow, true)
  addEventListener('resize', follow)


  // The feature demos play themselves once: a finger presses what the script names, nothing else can be touched,
  // then the screen goes back to its start and hotspots mark the same buttons, for the visitor to try.
  // One script per feature, played at every size (feed, feed-tab and feed-desk press the same things).
  const scripts = window.DEMO_SCRIPTS || {}
  const script = scripts[D.name] || scripts[D.name.replace(/-en$/, '').replace(/-(desk|tab|phone)$/, '')]
  const show = { mode: 'idle', run: 0 }
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  // Waits for a smooth scroll to end: the element has not moved for a few frames.
  const settle = target =>
    new Promise(resolve => {
      let last = null
      let still = 0
      const started = performance.now()
      const tick = () => {
        const top = target.getBoundingClientRect().top
        still = top === last ? still + 1 : 0
        last = top
        const t = performance.now() - started
        if ((still >= 6 && t > 350) || t > 2500) resolve()
        else requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
  // A badge's place on a button: its top-right corner; on a round one (an avatar), on the circle itself, so the dot
  // overlaps it like a notification badge.
  const isRound = (e, b) => b.width >= 24 && parseFloat(getComputedStyle(e).borderTopLeftRadius) >= Math.min(b.width, b.height) / 2 - 1
  const corner = (target, r) => {
    // A profile button holds its avatar: the badge goes on the avatar, not on the button's box.
    if (!isRound(target, r)) {
      const face = [...target.querySelectorAll('*')].find(e => isRound(e, e.getBoundingClientRect()))
      if (!face) return [r.right - 2, r.top + 2]
      r = face.getBoundingClientRect()
    }
    const k = Math.SQRT1_2
    return [r.left + r.width / 2 + (r.width / 2) * k, r.top + r.height / 2 - (r.height / 2) * k]
  }
  // A point is seen when no scrolling box around it, nor the window, cuts it off.
  const inView = (target, x, y) => {
    if (y < 0 || y > innerHeight || x < 0 || x > innerWidth) return false
    for (let e = target.parentElement; e && e !== document.body; e = e.parentElement) {
      const o = getComputedStyle(e)
      if (o.overflowY === 'visible' && o.overflowX === 'visible') continue
      const c = e.getBoundingClientRect()
      if (y < c.top || y > c.bottom || x < c.left || x > c.right) return false
    }
    return true
  }
  const visible = e => {
    const r = e.getBoundingClientRect()
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth
  }

  function renderGoSpots() {
    const gos = new Set(script.map(step => step.go || step.spot).filter(Boolean))
    const layers = new Map()
    for (const target of document.querySelectorAll('[data-go]')) {
      const go = target.dataset.go
      if (!gos.has(go) || go === current || !visible(target)) continue
      const r = target.getBoundingClientRect()
      const big = r.width > 120 && r.height > 60
      const [x, y] = big ? [r.left + r.width / 2, r.top + 2] : corner(target, r)
      if (!inView(target, x, y)) continue
      const layer = layerFor(layers, target)
      // The dot does what its button does, like the tour's.
      const dot = el('button', 'demo-spot', { left: px(x), top: px(y) })
      dot.type = 'button'
      dot.setAttribute('aria-label', target.getAttribute('aria-label') || target.textContent.trim().slice(0, 60))
      dot.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        apply(go)
      })
      layer.append(dot)
    }
  }

  // Nothing a visitor does reaches a demo while it plays itself: no key, no press. The wheel and swipes go on to the page, which keeps scrolling.
  for (const type of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click']) {
    addEventListener(
      type,
      event => {
        if (show.mode !== 'playing') return
        if (event.cancelable) event.preventDefault()
        event.stopImmediatePropagation()
      },
      { capture: true, passive: false }
    )
  }

  const play = async () => {
    // A demo without a script has nothing to play: the page takes its shield away at once.
    if (!script) return say({ played: true, none: true })
    const run = ++show.run
    show.mode = 'playing'
    document.querySelector('[data-demo-tour]')?.remove()
    apply(D.start, { fade: false })
    show.block?.remove()
    show.finger?.remove()
    const block = (show.block = el('div', 'demo-block'))
    const finger = (show.finger = el('div', 'demo-finger'))
    host().append(block, finger)
    const alive = () => run === show.run
    await sleep(500)
    let placed = false
    for (const step of script) {
      if (!alive()) return
      // A step only to mark, once the demo is over: the finger never presses it.
      if (step.spot) continue
      if (step.net) {
        say({ net: step.net })
        apply(step.net)
      } else if (step.show) {
        // Another person's screen: the finger lifts while the view changes.
        finger.classList.remove('on')
        placed = false
        await sleep(300)
        apply(step.show)
      } else {
        const target = document.querySelector(`[data-go="${step.go}"]`)
        if (!target) continue
        if (reveal(target)) await settle(target)
        const r = target.getBoundingClientRect()
        const at = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`
        if (!placed) {
          // The finger comes in from below the screen the first time.
          finger.style.transition = 'none'
          finger.style.translate = `${r.left + r.width / 2}px ${innerHeight + 60}px`
          finger.offsetWidth
          finger.style.transition = ''
          placed = true
        }
        finger.classList.add('on')
        finger.style.translate = at
        await sleep(600)
        // If the screen still moved under the finger, it follows before pressing.
        const r2 = target.getBoundingClientRect()
        if (Math.abs(r2.top - r.top) > 2 || Math.abs(r2.left - r.left) > 2) {
          finger.style.translate = `${r2.left + r2.width / 2}px ${r2.top + r2.height / 2}px`
          await sleep(350)
        }
        finger.classList.add('press')
        await sleep(180)
        finger.classList.remove('press')
        if (!alive()) return
        apply(step.go)
        // The new screen may sit at another scroll: the finger glides along with the button it pressed, never jumps.
        await sleep(260)
        const same = document.querySelector(`[data-go="${step.go}"]`)
        if (same) {
          const r3 = same.getBoundingClientRect()
          finger.style.translate = `${r3.left + r3.width / 2}px ${r3.top + r3.height / 2}px`
        }
      }
      await sleep((step.pause ?? 1500) * 0.7)
    }
    if (!alive()) return
    finger.classList.remove('on')
    await sleep(400)
    block.remove()
    finger.remove()
    show.mode = 'free'
    apply(D.start)
    say({ played: true })
  }

  addEventListener('message', event => {
    const m = event.data || {}
    if (m.theme) setTheme(m.theme)
    if (m.scale) {
      demoK = m.scale
      const intros = [...document.querySelectorAll('.demo-intro')]
      intros.forEach(intro => intro.classList.remove('settled'))
      root.style.setProperty('--demo-k', m.scale)
      intros.forEach(settleIntro)
    }
    if (m.go) apply(m.go)
    if (m.play) play()
    // Another demo starts: this one stops where it is and goes back to its start, so two never play together.
    if (m.stop && show.mode === 'playing') {
      show.run++
      show.block?.remove()
      show.finger?.remove()
      show.mode = 'free'
      apply(D.start, { fade: false })
      say({ played: true })
    }
    if (m.tour === 'start' && D.tour) {
      tour.mode = 'tour'
      tour.open = -1
      goStep(0)
    }
  })

  apply(D.tour && tour.mode !== 'spots' ? D.tour[0].state : D.start, { fade: false })
})()
