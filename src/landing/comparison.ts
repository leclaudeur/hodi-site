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
  // The handle sets the line where the pointer is; anywhere else, a sideways swipe moves it by as much as the pointer
  // moved, and a vertical one still scrolls the page (touch-action: pan-y), which cancels it. Leaving the phone
  // ends either: no capture, so a button let go outside never leaves a drag running.
  let drag: { id: number; x: number; from: number; handle: boolean } | null = null
  const move = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return
    const r = ba.getBoundingClientRect()
    setCut(drag.handle ? ((e.clientX - r.left) / r.width) * 100 : drag.from + ((e.clientX - drag.x) / r.width) * 100)
  }
  ba.addEventListener(
    'pointerdown',
    e => {
      // A mouse press would start a text selection in the site's page.
      if (e.pointerType === 'mouse') e.preventDefault()
      const onHandle = (e.target as Element).closest('#ba-handle') !== null
      drag = { id: e.pointerId, x: e.clientX, from: Number(handle.getAttribute('aria-valuenow')), handle: onHandle }
      if (onHandle) move(e)
    },
    { signal }
  )
  ba.addEventListener('pointermove', move, { signal })
  for (const type of ['pointerup', 'pointercancel', 'pointerleave'])
    ba.addEventListener(type, () => (drag = null), { signal })
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
