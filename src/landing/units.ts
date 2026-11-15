// The page's translatable pieces: each element that holds text of its own, with all the text inside it (bold words,
// links) as one unit. A unit is keyed by its French text, so the English follows it wherever it moves in the page.
export interface TextUnit {
  texts: Text[]
  key: string
  fr: string[]
}

const SKIP = 'script, style, svg, iframe, .site-layer, [data-no-i18n]'

export const textUnits = (root: Element): TextUnit[] => {
  const units: TextUnit[] = []
  const walk = (el: Element) => {
    if (el.matches(SKIP)) return
    const own = [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.nodeValue?.trim())
    if (own) {
      const texts: Text[] = []
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: n =>
          n.nodeValue?.trim() && !n.parentElement?.closest('svg, script, style')
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT
      })
      while (walker.nextNode()) texts.push(walker.currentNode as Text)
      const fr = texts.map(n => n.nodeValue ?? '')
      units.push({ texts, fr, key: fr.map(t => t.replace(/\s+/g, ' ').trim()).join(' | ') })
      return
    }
    for (const child of el.children) walk(child)
  }
  walk(root)
  return units
}

// The attributes that carry words: they follow the language too.
export const TEXT_ATTRIBUTES = ['aria-label', 'title', 'placeholder', 'alt']
