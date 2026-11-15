import type { Page } from '../page.ts'

const LENGTH = 8

// The code's eight boxes, as Hodi's PinField: one real input on top of them for the keyboard, paste and the phone's
// one-time-code suggestion; the boxes only show what it holds.
export const mountPins = (page: Page, onType: () => void) => {
  const { $, $$, signal } = page
  const input = $<HTMLInputElement>('#join-code .pin-input')
  const boxes = $$('#join-code .pin')
  const value = () =>
    input.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, LENGTH)
  const draw = () => {
    const typed = value()
    boxes.forEach((box, i) => {
      box.textContent = typed[i] ?? ''
      box.classList.toggle('next', i === Math.min(typed.length, LENGTH - 1))
    })
  }
  input.addEventListener(
    'input',
    () => {
      input.value = value()
      draw()
      onType()
    },
    { signal }
  )
  draw()
  return {
    value,
    // As the e-mail writes it: two groups of four.
    formatted: () => `${value().slice(0, 4)}-${value().slice(4)}`,
    clear: () => {
      input.value = ''
      draw()
    }
  }
}
