// The mini demos' scripts: what the finger presses, in order, in each demo. "go" names a marked element of the
// current screen; "pause" is how long the screen stays before the next press. Hotspots afterwards point at the same
// elements, so the visitor can do it again.
window.DEMO_SCRIPTS = {
  feed: [{ go: 'chip-Belgique' }, { go: 'chip-Monde' }, { go: 'chip-Tout', pause: 600 }],
  profiles: [{ go: 'lea', pause: 2200 }, { go: 'who' }, { go: 'antho', pause: 2200 }, { go: 'who', pause: 600 }],
  shares: [
    { go: 's-share' },
    { go: 's-share-antho' },
    { go: 's-sent', pause: 2200 },
    { show: 'a-feed', pause: 1600 },
    { go: 'a-list' },
    { go: 'a-open', pause: 1600 },
    { go: 'a-react', pause: 2000 },
    { show: 's-feed', pause: 1500 },
    { go: 's-partages', pause: 2800 }
  ],
  ai: [{ go: 'writing', pause: 4200 }, { go: 'asking', pause: 4400 }, { spot: 'q-asking' }, { spot: 'q-writing' }]
}
