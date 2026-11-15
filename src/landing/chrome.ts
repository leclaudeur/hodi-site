import { THEME_KEY, type Page, write } from './page.ts'
import { icon } from './texts.ts'

// The app's three appearances; the system's choice until one is picked. The demos wear it too.
export const themeSetter = (page: Page, tellDemos: (message: object) => void) => {
  const { $$, root, body } = page
  const html = document.documentElement
  return (next: string) => {
    page.theme = next
    root.dataset.theme = next
    write(THEME_KEY, next)
    $$('[data-theme-pick]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.themePick === next))
      b.setAttribute('aria-checked', String(b.dataset.themePick === next))
    })
    // The browser's own colours (overscroll, scrollbars) follow the theme.
    html.style.backgroundColor = getComputedStyle(body).getPropertyValue('--bg').trim()
    html.style.colorScheme = next === 'light' ? 'light' : 'dark'
    tellDemos({ theme: next })
  }
}

// The theme menu and the menu sheet; Escape closes both. Answers how to close the sheet.
export const mountMenus = ({ $, $$, signal }: Page, setTheme: (theme: string) => void) => {
  const themeBtn = $('#theme-btn')
  const themeMenu = $('#theme-menu')
  const closeMenus = () => {
    themeMenu.classList.remove('open')
    themeBtn.setAttribute('aria-expanded', 'false')
  }
  themeBtn.addEventListener(
    'click',
    e => {
      e.stopPropagation()
      const open = !themeMenu.classList.contains('open')
      if (open) {
        const r = themeBtn.getBoundingClientRect()
        const nav = $('#nav').getBoundingClientRect()
        themeMenu.style.top = r.bottom - nav.top + 8 + 'px'
        themeMenu.style.right = Math.max(12, innerWidth - r.right) + 'px'
      }
      themeMenu.classList.toggle('open', open)
      themeBtn.setAttribute('aria-expanded', String(open))
    },
    { signal }
  )
  document.addEventListener('click', e => !e.composedPath().includes(themeMenu) && closeMenus(), { signal })
  const sheet = $('#sheet')
  const burger = $('#burger')
  const toggleSheet = (open: boolean) => {
    sheet.classList.toggle('open', open)
    burger.setAttribute('aria-expanded', String(open))
    burger.innerHTML = icon(open ? 'x' : 'menu')
  }
  burger.addEventListener('click', () => toggleSheet(!sheet.classList.contains('open')), { signal })
  $('#sheet-scrim').addEventListener('click', () => toggleSheet(false), { signal })
  document.addEventListener(
    'keydown',
    e => {
      if (e.key !== 'Escape') return
      closeMenus()
      toggleSheet(false)
    },
    { signal }
  )
  $$('[data-theme-pick]').forEach(b =>
    b.addEventListener(
      'click',
      () => {
        setTheme(b.dataset.themePick!)
        closeMenus()
      },
      { signal }
    )
  )
  return { closeSheet: () => toggleSheet(false) }
}

// The nav: the section on screen lit. The steps' line fills as you go.
export const mountScroll = ({ $, $$, doc, signal }: Page) => {
  const spyLinks = $$('[data-spy]')
  const sections = spyLinks.map(a => doc.getElementById(a.dataset.spy!)!)
  const how = $('#how')
  const steps = $$('#how .st')
  const onScroll = () => {
    let current: HTMLElement | null = null
    // A hidden section (on a legal page) lights nothing.
    sections.forEach((s, i) => {
      if (s.offsetParent && s.getBoundingClientRect().top < innerHeight * 0.4) current = spyLinks[i] ?? null
    })
    spyLinks.forEach(a => a.setAttribute('aria-current', String(a === current)))
    const r = how.getBoundingClientRect()
    const line = innerHeight * 0.55
    const p = Math.max(0, Math.min(1, (line - r.top) / r.height))
    $('#how-fill').style.setProperty('--p', p * 100 + '%')
    let last = -1
    steps.forEach((s, i) => {
      const reached = s.getBoundingClientRect().top + 14 < line
      s.classList.toggle('reached', reached)
      if (reached) last = i
    })
    steps.forEach((s, i) => s.classList.toggle('current', i === last))
  }
  addEventListener('scroll', onScroll, { passive: true, signal })
  return onScroll
}

// « Copier »: the two install commands.
export const mountCopy = ({ $, signal, timers, tr }: Page) => {
  $('#copy').addEventListener(
    'click',
    async e => {
      const b = e.currentTarget as HTMLElement
      try {
        await navigator.clipboard.writeText(
          'git clone https://github.com/leclaudeur/hodi.git\ncd hodi && docker compose up -d'
        )
      } catch {
        // No clipboard (an old browser, a refused permission): the commands stay on screen to copy by hand.
      }
      b.innerHTML = `${icon('check')}${tr('Copié')}`
      const timer = window.setTimeout(() => {
        timers.delete(timer)
        b.innerHTML = `${icon('copy')}${tr('Copier')}`
      }, 1600)
      timers.add(timer)
    },
    { signal }
  )
}

// Questions: the app's accordions, written into the page at build time; a click opens or closes one.
export const mountFaq = ({ $, signal }: Page) => {
  $('#faq').addEventListener(
    'click',
    e => {
      const h = (e.target as Element).closest('.acc-h')
      if (!h) return
      const acc = h.closest('.acc')!
      const open = !acc.classList.contains('open')
      acc.classList.toggle('open', open)
      h.setAttribute('aria-expanded', String(open))
    },
    { signal }
  )
}
