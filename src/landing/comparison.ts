import type { Page } from './page.ts'

const WIDTH = 390
const HEIGHT = 780

// The reader's iframe and its layer: the same size as the box.
const fitFrame = ({ observers, signal }: Page, ba: HTMLElement, theme: () => string) => {
  const iframe = ba.querySelector('iframe')!
  iframe.width = String(WIDTH)
  iframe.height = String(HEIGHT)
  iframe.style.position = 'absolute'
  iframe.style.border = '0'
  iframe.style.transformOrigin = '0 0'
  const fit = () => {
    const k = ba.clientWidth / WIDTH
    iframe.style.transform = `scale(${k})`
    ba.style.height = `${HEIGHT * k}px`
  }
  const resize = new ResizeObserver(fit)
  resize.observe(ba)
  observers.push(resize)
  fit()
  iframe.addEventListener('load', () => iframe.contentWindow?.postMessage({ theme: theme() }, '*'), { signal })
}

// Reader: the page as the site shows it beside Hodi's reader. Drag the handle, or use the arrow keys on it.
export const mountComparison = (page: Page) => {
  const { $, signal } = page
  const ba = $('#ba')
  const handle = $('#ba-handle')
  const setCut = (pct: number) => {
    pct = Math.max(0, Math.min(100, pct))
    ba.style.setProperty('--cut', pct + '%')
    handle.setAttribute('aria-valuenow', String(Math.round(pct)))
  }
  let dragging = false
  const fromEvent = (e: PointerEvent) => {
    const r = ba.getBoundingClientRect()
    setCut(((e.clientX - r.left) / r.width) * 100)
  }
  handle.addEventListener(
    'pointerdown',
    e => {
      dragging = true
      handle.setPointerCapture(e.pointerId)
      fromEvent(e)
    },
    { signal }
  )
  handle.addEventListener('pointermove', e => dragging && fromEvent(e), { signal })
  handle.addEventListener('pointerup', () => (dragging = false), { signal })
  // Anywhere else on the comparison, a sideways swipe moves the line by as much as the finger moved; a vertical one
  // still scrolls the page (touch-action: pan-y), which cancels the swipe.
  let swipe: { id: number; x: number; from: number } | null = null
  ba.addEventListener(
    'pointerdown',
    e => {
      if ((e.target as Element).closest('#ba-handle')) return
      swipe = { id: e.pointerId, x: e.clientX, from: Number(handle.getAttribute('aria-valuenow')) }
    },
    { signal }
  )
  ba.addEventListener(
    'pointermove',
    e => {
      if (!swipe || e.pointerId !== swipe.id) return
      setCut(swipe.from + ((e.clientX - swipe.x) / ba.getBoundingClientRect().width) * 100)
    },
    { signal }
  )
  for (const type of ['pointerup', 'pointercancel']) ba.addEventListener(type, () => (swipe = null), { signal })
  handle.addEventListener(
    'keydown',
    e => {
      const now = Number(handle.getAttribute('aria-valuenow'))
      if (e.key === 'ArrowLeft') setCut(now - 5)
      if (e.key === 'ArrowRight') setCut(now + 5)
    },
    { signal }
  )
  fitFrame(page, ba, () => page.theme)
}
