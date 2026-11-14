import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

// The built pages (npm run build first): each address has its language, title, canonical link and text.
const page = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8')
const PAGES = [
  ['index.html', 'fr', 'https://get-hodi.com/'],
  ['en.html', 'en', 'https://get-hodi.com/en'],
  ['legal.html', 'fr', 'https://get-hodi.com/legal'],
  ['privacy.html', 'fr', 'https://get-hodi.com/privacy'],
  ['terms.html', 'fr', 'https://get-hodi.com/terms'],
  ['en/legal.html', 'en', 'https://get-hodi.com/en/legal'],
  ['en/privacy.html', 'en', 'https://get-hodi.com/en/privacy'],
  ['en/terms.html', 'en', 'https://get-hodi.com/en/terms']
] as const

describe('the built site', { skip: !existsSync(new URL('../dist/index.html', import.meta.url)) }, () => {
  it('writes every address with its language and canonical link', () => {
    for (const [file, lang, url] of PAGES) {
      const html = page(file)
      assert.match(html, new RegExp(`<html lang="${lang}"`), file)
      assert.ok(html.includes(`<link rel="canonical" href="${url}">`), file)
    }
  })

  it('fills the legal pages with who runs the server, with no blank left', () => {
    for (const file of ['legal.html', 'en/legal.html', 'privacy.html', 'en/terms.html']) {
      const html = page(file)
      assert.ok(html.includes('A. Du Pont') || file.includes('privacy') || file.includes('terms'), file)
      assert.doesNotMatch(
        html,
        /\[(nom de l’exploitant|adresse e-mail de contact|operator’s name|contact email)\]/,
        file
      )
      assert.match(html, /class="hl-body legal-mode"/, file)
    }
  })

  it('writes the English page in English, the forms included', () => {
    const html = page('en.html')
    for (const french of ['Créer mon compte', 'Continuer', 'Renvoyer le code', 'Connexion', 'Se connecter'])
      assert.ok(!html.includes(`>${french}<`), french)
  })

  it('leads every « Connexion » to the app', () => {
    const html = page('index.html')
    assert.ok(!html.includes('href="#login"'))
    assert.ok(html.includes('href="https://app.get-hodi.com/"'))
  })
})
