import en from './en.json'
import { ICONS } from './icons.ts'

// The texts the landing's script writes, French as the reference and their English; the markup's own texts are
// translated from en.json (units.ts).

type I18n = { units: Record<string, string | string[]>; attrs: Record<string, string>; script: Record<string, string> }
export const I18N = en as I18n

// The join section's title and line for each state: a short title, an explanation of two lines at most.
export const JOIN: Record<string, [string, string]> = {
  open: [
    'Créer un foyer',
    "Commence avec un e-mail. Tu pourras ensuite créer un foyer ou rejoindre celui qui t'a invité."
  ],
  wait: ["Liste d'attente", "Laisse un e-mail : on te prévient dès qu'une place se libère."],
  closed: [
    'Serveur complet',
    "Des places se libèrent parfois : reviens dans quelque temps. Tu peux aussi installer Hodi chez toi, c'est gratuit."
  ],
  invite: [
    'Sur invitation',
    "Les foyers y entrent sur invitation de la personne qui l'héberge. Tu peux aussi installer Hodi chez toi, c'est gratuit."
  ],
  expired: ['Invitation expirée', 'Le lien a plus de 7 jours ou a déjà servi. Demande une nouvelle invitation.']
}
// What worked, in a Notice: its icon, title and line.
export const SUCCESS = {
  sent: ['mail-check', "Confirme l'adresse e-mail", 'Lien envoyé à {email}, valable 48 heures.'],
  confirmed: [
    'circle-check',
    'Adresse confirmée',
    "N° {n} dans la file d'attente. Un e-mail arrive dès qu'une place se libère."
  ]
} as const
export const ICON_SVG: Record<string, string> = {
  'mail-check': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail-check" aria-hidden="true"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"></path><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path><path d="m16 19 2 2 4-4"></path></svg>`,
  'circle-check': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>`
}
// What the forms say when the server did not take the e-mail, by the error it answered.
export const JOIN_ERRORS: Record<string, string> = {
  invalid_email: 'Cette adresse e-mail ne semble pas valide.',
  invalid_altcha: "La vérification n'a pas abouti. Réessaie.",
  signup_closed: "Ce serveur ne prend plus d'inscription pour l'instant.",
  waitlist_closed: "Ce serveur ne prend plus d'inscription pour l'instant.",
  mail_unavailable: "Ce serveur ne peut pas envoyer d'e-mail pour l'instant. Réessaie plus tard.",
  rate: "Trop d'essais d'un coup. Réessaie dans une minute.",
  network: 'Le serveur ne répond pas. Réessaie dans un instant.',
  consent: "Coche d'abord la case sur l'usage de l'e-mail."
}
export const NOTICES = {
  confirm_expired: 'Ce lien de confirmation a expiré. Inscris-toi à nouveau.'
}

export const SCRIPT_EN: Record<string, string> = {
  ...I18N.script,
  'Cette adresse e-mail ne semble pas valide.': 'This e-mail address doesn’t look right.',
  "La vérification n'a pas abouti. Réessaie.": 'The check didn’t go through. Try again.',
  "Ce serveur ne prend plus d'inscription pour l'instant.": 'This server isn’t taking sign-ups right now.',
  "Ce serveur ne peut pas envoyer d'e-mail pour l'instant. Réessaie plus tard.":
    'This server can’t send e-mail right now. Try again later.',
  "Trop d'essais d'un coup. Réessaie dans une minute.": 'Too many tries at once. Try again in a minute.',
  'Le serveur ne répond pas. Réessaie dans un instant.': 'The server isn’t answering. Try again in a moment.',
  "Coche d'abord la case sur l'usage de l'e-mail.": 'Tick the box about the e-mail first.',
  'Ce lien de confirmation a expiré. Inscris-toi à nouveau.': 'This confirmation link has expired. Sign up again.',
  'Créer un foyer': 'Start a household',
  "Commence avec un e-mail. Tu pourras ensuite créer un foyer ou rejoindre celui qui t'a invité.":
    'Start with an e-mail. You can then start a household or join the one that invited you.',
  'Serveur complet': 'Server full',
  "Liste d'attente": 'Waiting list',
  "Laisse un e-mail : on te prévient dès qu'une place se libère.":
    'Leave an e-mail: we’ll let you know as soon as a spot opens up.',
  "Des places se libèrent parfois : reviens dans quelque temps. Tu peux aussi installer Hodi chez toi, c'est gratuit.":
    'Spots open up now and then: come back later. You can also install Hodi at home, it’s free.',
  'Sur invitation': 'Invitation only',
  'Invitation expirée': 'Invitation expired',
  'Le lien a plus de 7 jours ou a déjà servi. Demande une nouvelle invitation.':
    'The link is over 7 days old or was already used. Ask for a new invitation.',
  "Confirme l'adresse e-mail": 'Confirm the e-mail address',
  'Lien envoyé à {email}, valable 48 heures.': 'Link sent to {email}, valid for 48 hours.',
  'Adresse confirmée': 'Address confirmed',
  "N° {n} dans la file d'attente. Un e-mail arrive dès qu'une place se libère.":
    'Number {n} on the waiting list. An e-mail comes as soon as a spot opens up.',
  'Ce serveur est sur invitation': 'This server is invitation-only',
  "Les foyers y entrent sur invitation de la personne qui l'héberge. Tu peux aussi installer Hodi chez toi, c'est gratuit.":
    'Households join when the person who runs it invites them. You can also install Hodi at home, it’s free.'
}

export const FAQ = [
  [
    "C'est vraiment gratuit ?",
    "Oui. Hodi est un logiciel libre, et ce serveur est offert par la personne qui l'héberge. Il n'y a ni abonnement, ni pub, ni données revendues."
  ],
  [
    'Qui voit ce que je lis ?',
    "Toi seul. Les autres profils du foyer voient ce que tu leur partages. L'hébergeur voit le nom des foyers et les e-mails des comptes, jamais ce que tu lis."
  ],
  [
    "Pourquoi des articles s'ouvrent sur le site ?",
    "Les articles réservés aux abonnés ne sont jamais contournés. Et selon le réglage de ce serveur, Hodi peut montrer le début de l'article puis t'envoyer lire la suite chez l'éditeur."
  ],
  [
    "Et l'IA, elle coûte quoi ?",
    "Rien si le foyer n'en met pas. Avec une clé, chaque bouton violet est un appel payé au fournisseur choisi, jamais automatique, avec des plafonds par jour."
  ],
  [
    'Et les ados ?',
    "Ils ont leur profil Ado, créé par un parent : les sources que leurs parents ont choisies, et les heures où Hodi s'ouvre. Ils peuvent demander une nouvelle source, leurs parents décident."
  ],
  [
    'Et si le serveur est complet ?',
    "Inscris-toi sur la file d'attente avec un e-mail. Tu reçois un message dès qu'une place se libère, et cet e-mail ne sert à rien d'autre."
  ],
  [
    "Je peux l'installer chez moi ?",
    "Oui, c'est fait pour. Deux commandes avec Docker, puis un assistant dans le navigateur. Aucun fichier de configuration à écrire."
  ]
]

export const icon = (name: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${name}" aria-hidden="true">${ICONS[name]}</svg>`
