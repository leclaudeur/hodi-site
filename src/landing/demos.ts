import type { Page } from './page.ts'

type BoxOf = (source: MessageEventSource | null) => HTMLElement | undefined

// Each demo is the app at its own size, scaled to the box it sits in. They live in Hodi's assets, each in a frame
// of its own with no access to Hodi's page.
const fitDemos = (page: Page) => {
  const { $$, observers, signal } = page
  $$('.demo-frame').forEach(box => {
    if (box.id === 'ba') return
    const w = Number(box.dataset.w)
    const h = Number(box.dataset.h)
    const iframe = box.querySelector('iframe')!
    iframe.width = String(w)
    iframe.height = String(h)
    const fit = () => {
      const k = box.clientWidth / w
      // The box keeps its height from its aspect-ratio (set when the page is built): setting it here too would
      // shrink the box a little at each resize, its border taken off its width each time.
      iframe.style.transform = `scale(${k})`
      // The demo keeps its hotspots and start button readable whatever the scale.
      iframe.contentWindow?.postMessage({ scale: k }, '*')
    }
    const resize = new ResizeObserver(fit)
    resize.observe(box)
    observers.push(resize)
    fit()
    iframe.addEventListener(
      'load',
      () => {
        iframe.contentWindow?.postMessage({ theme: page.theme }, '*')
        fit()
      },
      { signal }
    )
  })
}

// While a demo plays by itself, a clear shield covers its screen: no press, wheel or key can reach it.
const shieldOff = (box: HTMLElement) => box.querySelector(':scope > .demo-shield')?.remove()
const shieldOn = (box: HTMLElement, doc: Document) => {
  if (box.querySelector(':scope > .demo-shield')) return
  const shield = document.createElement('div')
  shield.className = 'demo-shield'
  for (const type of ['pointerdown', 'pointerup', 'click', 'dblclick', 'contextmenu'])
    shield.addEventListener(
      type,
      e => {
        if (e.cancelable) e.preventDefault()
        e.stopPropagation()
      },
      { passive: false }
    )
  box.append(shield)
  const active = doc.activeElement
  if (active instanceof HTMLElement && box.contains(active)) active.blur()
}

const frameOf = (box: Element) => box.querySelector('iframe')!

// The demo on screen among a section's boxes (the computer's or the phone's).
const visibleBox = (from: Element, scope: string) =>
  [...from.closest(scope)!.querySelectorAll<HTMLElement>('.demo-frame[data-demo]')].find(b => b.offsetParent)

// The hero's tour: "Passer" leaves the demo free, a button brings the tour back.
const mountTour = ({ $$, signal }: Page, boxOf: BoxOf) => {
  addEventListener(
    'message',
    event => {
      const m = (event.data || {}) as { demo?: string; tour?: string }
      if (!/^hero/.test(m.demo || '') || m.tour !== 'off') return
      // The bar under the demo that was skipped: the computer's or the phone's.
      boxOf(event.source)?.closest('.desk-only, .phone-only')?.querySelector('.stage-bar')?.classList.add('skipped')
    },
    { signal }
  )
  $$('[data-tour-again]').forEach(btn =>
    btn.addEventListener(
      'click',
      () => {
        const stage = btn.closest('.desk-only, .phone-only')!
        stage.querySelector('.stage-bar')?.classList.remove('skipped')
        stage.querySelector('iframe')?.contentWindow?.postMessage({ tour: 'start' }, '*')
      },
      { signal }
    )
  )
}

// Offline: the switch outside the phone cuts its network.
const mountOffline = ({ $, signal }: Page) => {
  $('#net').addEventListener(
    'click',
    e => {
      e.preventDefault()
      const button = e.currentTarget as HTMLElement
      const on = button.getAttribute('aria-checked') !== 'true'
      button.setAttribute('aria-checked', String(on))
      $<HTMLIFrameElement>('[data-demo="offline"] iframe').contentWindow?.postMessage(
        { go: on ? 'offline' : 'online' },
        '*'
      )
    },
    { signal }
  )
}

// What a demo says back: it finished playing, its network switch or its view changed.
const listenToDemos = ({ $, $$, signal }: Page, boxOf: BoxOf, played: (box: HTMLElement) => void) => {
  addEventListener(
    'message',
    event => {
      const m = (event.data || {}) as { played?: boolean; none?: boolean; net?: string; state?: string; demo?: string }
      const box = boxOf(event.source)
      if (!box) return
      if (m.played) {
        played(box)
        const btn = box.closest('.f-demo, .phone-only')?.querySelector<HTMLElement>('.replay')
        if (btn && !m.none) btn.hidden = false
      }
      if (m.net) $('#net').setAttribute('aria-checked', String(m.net === 'offline'))
      if (m.state && /^shares/.test(m.demo || ''))
        $$('.views button').forEach(b => b.classList.toggle('on', b.dataset.view?.[0] === m.state?.[0]))
    },
    { signal }
  )
}

// The feature demos play once when they are well in view; afterwards a button plays them again. Only one plays at a
// time.
const mountPlayback = (page: Page, boxOf: BoxOf) => {
  const { $$, doc, signal, observers } = page
  const playing = new Set<HTMLElement>()
  const playIn = (box: HTMLElement) => {
    playing.forEach(other => {
      if (other === box) return
      frameOf(other).contentWindow?.postMessage({ stop: true }, '*')
      shieldOff(other)
    })
    playing.clear()
    playing.add(box)
    shieldOn(box, doc)
    const iframe = frameOf(box)
    const go = () => iframe.contentWindow?.postMessage({ play: true }, '*')
    // A demo can finish loading before the page listens for it: it then says so on the iframe.
    if (iframe.dataset.ready) go()
    else iframe.addEventListener('load', go, { once: true, signal })
  }
  const seen = new IntersectionObserver(
    entries =>
      entries.forEach(entry => {
        const box = entry.target as HTMLElement
        if (!entry.isIntersecting || !box.offsetParent) return
        seen.unobserve(box)
        playIn(box)
      }),
    { threshold: 0.6 }
  )
  observers.push(seen)
  listenToDemos(page, boxOf, box => {
    playing.delete(box)
    shieldOff(box)
  })
  $$('.views button').forEach(btn =>
    btn.addEventListener(
      'click',
      () => {
        const box = visibleBox(btn, '.f-demo')
        // While the demo plays by itself, the view buttons wait: nothing interrupts it.
        if (box && !playing.has(box)) frameOf(box).contentWindow?.postMessage({ go: btn.dataset.view }, '*')
      },
      { signal }
    )
  )
  $$('.replay').forEach(btn =>
    btn.addEventListener(
      'click',
      () => {
        const box = visibleBox(btn, '.f-demo, .phone-only')
        if (box) playIn(box)
      },
      { signal }
    )
  )
  const shown = $$('.f-demo .demo-frame[data-demo]').filter(b => b.id !== 'ba')
  return { observe: () => shown.forEach(box => seen.observe(box)) }
}

export const mountDemos = (page: Page) => {
  const { options, $$, signal } = page
  const frames = () => $$<HTMLIFrameElement>('.demo-frame iframe, .ba iframe')
  const demoSrc = (iframe: HTMLIFrameElement) =>
    `${options.base}${iframe.dataset.demoPage}${page.lang === 'en' ? '-en' : ''}.html?theme=${encodeURIComponent(page.theme)}`
  // The markup names each demo without a src: nothing loads before its language and theme are known.
  for (const iframe of $$<HTMLIFrameElement>('iframe')) iframe.setAttribute('sandbox', 'allow-scripts')
  fitDemos(page)
  const boxOf: BoxOf = source =>
    $$('.demo-frame[data-demo]').find(b => b.querySelector('iframe')?.contentWindow === source)
  mountTour(page, boxOf)
  const playback = mountPlayback(page, boxOf)
  mountOffline(page)
  const show = (iframe: HTMLIFrameElement) => {
    delete iframe.dataset.ready
    iframe.addEventListener('load', () => (iframe.dataset.ready = '1'), { once: true, signal })
    // A frame that already shows a demo changes it in place: a new src would add a step to « Précédent ».
    const url = new URL(demoSrc(iframe), location.href).href
    if (iframe.hasAttribute('src') && iframe.contentWindow) iframe.contentWindow.location.replace(url)
    else iframe.src = url
  }
  // A demo loads once it comes near the screen: the page itself shows fast, and a demo never seen costs nothing. One
  // hidden at this size (the computer's or the phone's) waits until it shows.
  const near = new IntersectionObserver(
    entries =>
      entries.forEach(entry => {
        const iframe = entry.target as HTMLIFrameElement
        if (!entry.isIntersecting) return
        near.unobserve(iframe)
        iframe.dataset.near = '1'
        show(iframe)
      }),
    { rootMargin: '800px 0px' }
  )
  page.observers.push(near)
  return {
    observe: () => {
      frames().forEach(f => near.observe(f))
      playback.observe()
    },
    tell: (message: object) => frames().forEach(f => f.contentWindow?.postMessage(message, '*')),
    // Each demo is the app captured in that language. After a change, the replay buttons and the hero's tour start
    // over.
    load: (first: boolean) => {
      frames()
        .filter(f => f.dataset.near)
        .forEach(show)
      if (first) return
      $$('.replay').forEach(b => (b.hidden = true))
      $$('.hero .stage-bar').forEach(b => b.classList.remove('skipped'))
    }
  }
}
