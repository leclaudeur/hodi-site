import type { Lang } from '../routes.ts'

// The « Rejoindre » section's words, French first. {email} is the visitor's address, in bold; {n} a number.
const FR = {
  kicker: 'Rejoindre',
  steps: {
    open: [
      'Créer un compte',
      'Commence avec ton e-mail : un code y arrive pour créer ton compte. Invité ? Le lien de ton e-mail t’attend.'
    ],
    code: [
      'Ton code',
      'On t’a envoyé un code à {email}. Il est valable 30 minutes : regarde aussi dans les indésirables.'
    ],
    account: [
      'Ton compte',
      'Tu te connecteras avec {email} et ce mot de passe.<br>Choisis-en un d’au moins 8 caractères.'
    ],
    name: ['Ton prénom', 'C’est le nom de ton profil dans Hodi. Tu pourras le changer ensuite.'],
    done: ['Ton compte est prêt', 'Connecte-toi dans Hodi avec {email} et ton mot de passe.'],
    wait: ['Liste d’attente', 'Laisse un e-mail : on te prévient dès qu’une place se libère.'],
    invite: [
      'Sur invitation',
      'On y entre sur invitation de la personne qui l’héberge. Tu peux aussi installer Hodi chez toi, c’est gratuit.'
    ],
    closed: [
      'Serveur complet',
      'Des places se libèrent parfois : reviens dans quelque temps. Tu peux aussi installer Hodi chez toi, c’est gratuit.'
    ],
    expired: ['Invitation expirée', 'Le lien a plus de 7 jours ou a déjà servi. Demande une nouvelle invitation.']
  },
  openApp: 'Ouvrir Hodi',
  signIn: 'Se connecter',
  sent: ['Confirme l’adresse e-mail', 'Lien envoyé à {email}, valable 48 heures.'],
  confirmed: ['Adresse confirmée', 'Un e-mail arrive dès qu’une place se libère.'],
  resent: 'Un nouveau code est parti.',
  show: 'Afficher le mot de passe',
  hide: 'Masquer le mot de passe',
  errors: {
    invalid_email: 'Cette adresse e-mail ne semble pas valide.',
    invalid_altcha: 'La vérification n’a pas abouti. Réessaie.',
    signup_closed: 'Ce serveur ne prend plus d’inscription pour l’instant.',
    waitlist_closed: 'Ce serveur ne prend plus d’inscription pour l’instant.',
    account_limit: 'Le serveur vient d’atteindre son nombre de comptes.',
    mail_unavailable: 'Ce serveur ne peut pas envoyer d’e-mail pour l’instant. Réessaie plus tard.',
    email_taken: 'Cette adresse a déjà un compte : connecte-toi avec elle.',
    rate: 'Trop d’essais d’un coup. Réessaie dans une minute.',
    network: 'Le serveur ne répond pas. Réessaie dans un instant.',
    consent: 'Coche d’abord la case sur l’usage de l’e-mail.',
    age: 'Coche d’abord la case sur ton âge.',
    code_one: 'Ce code n’est pas le bon. Encore {n} essai.',
    code_other: 'Ce code n’est pas le bon. Encore {n} essais.',
    code_over: 'Ce code ne marche plus. Recommence avec ton e-mail pour en recevoir un nouveau.',
    code_expired: 'Les 30 minutes du code sont passées. Recommence avec ton e-mail pour en recevoir un nouveau.',
    weak_password: 'Le mot de passe doit faire au moins 8 caractères.',
    name: 'Donne ton prénom.',
    invalid_invite: 'Cette invitation ne marche plus. Demande-en une nouvelle.',
    confirm_expired: 'Ce lien de confirmation a expiré. Inscris-toi à nouveau.',
    failed: 'Le compte n’a pas pu être créé. Réessaie dans un instant.'
  },
  password: {
    levels: ['Trop court', 'Faible', 'Moyen', 'Solide', 'Excellent'],
    gauge: 'Sécurité du mot de passe',
    minimum: '8 caractères minimum.',
    missing_one: 'Encore {n} caractère.',
    missing_other: 'Encore {n} caractères.',
    another: 'Ajoute un mot pour atteindre {level}.',
    tips: {
      keyboard: 'Évite les suites du clavier (azerty, 1234).',
      repeat: 'Évite les répétitions et les suites (aaa, abc).',
      dates: 'Évite les dates et les années, faciles à deviner.',
      common: 'Ce mot de passe est trop courant : choisis-en un autre.',
      word: 'Un seul mot se devine vite : ajoutes-en d’autres.'
    }
  }
}

export type JoinTexts = typeof FR

const EN: JoinTexts = {
  kicker: 'Join',
  steps: {
    open: [
      'Create an account',
      'Start with your e-mail: a code arrives there to create your account. Invited? The link in your e-mail is waiting.'
    ],
    code: ['Your code', 'We sent a code to {email}. It is valid for 30 minutes: check your spam folder too.'],
    account: ['Your account', 'You will sign in with {email} and this password.<br>Pick one of at least 8 characters.'],
    name: ['Your first name', 'It is your profile’s name in Hodi. You can change it later.'],
    done: ['Your account is ready', 'Sign in to Hodi with {email} and your password.'],
    wait: ['Waiting list', 'Leave an e-mail: we’ll let you know as soon as a spot opens up.'],
    invite: [
      'Invitation only',
      'People join when the person who runs it invites them. You can also install Hodi at home, it’s free.'
    ],
    closed: [
      'Server full',
      'Spots open up now and then: come back later. You can also install Hodi at home, it’s free.'
    ],
    expired: ['Invitation expired', 'The link is over 7 days old or was already used. Ask for a new invitation.']
  },
  openApp: 'Open Hodi',
  signIn: 'Sign in',
  sent: ['Confirm the e-mail address', 'Link sent to {email}, valid for 48 hours.'],
  confirmed: ['Address confirmed', 'An e-mail comes as soon as a spot opens up.'],
  resent: 'A new code is on its way.',
  show: 'Show password',
  hide: 'Hide password',
  errors: {
    invalid_email: 'This e-mail address doesn’t look right.',
    invalid_altcha: 'The check didn’t go through. Try again.',
    signup_closed: 'This server isn’t taking sign-ups right now.',
    waitlist_closed: 'This server isn’t taking sign-ups right now.',
    account_limit: 'The server just reached its number of accounts.',
    mail_unavailable: 'This server can’t send e-mail right now. Try again later.',
    email_taken: 'This address already has an account: sign in with it.',
    rate: 'Too many tries at once. Try again in a minute.',
    network: 'The server isn’t answering. Try again in a moment.',
    consent: 'Tick the box about the e-mail first.',
    age: 'Tick the box about your age first.',
    code_one: 'This code isn’t the right one. {n} try left.',
    code_other: 'This code isn’t the right one. {n} tries left.',
    code_over: 'This code no longer works. Start again with your e-mail to get a new one.',
    code_expired: 'The code’s 30 minutes are over. Start again with your e-mail to get a new one.',
    weak_password: 'The password needs at least 8 characters.',
    name: 'Give your first name.',
    invalid_invite: 'This invitation no longer works. Ask for a new one.',
    confirm_expired: 'This confirmation link has expired. Sign up again.',
    failed: 'The account couldn’t be created. Try again in a moment.'
  },
  password: {
    levels: ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'],
    gauge: 'Password strength',
    minimum: '8 characters minimum.',
    missing_one: '{n} more character.',
    missing_other: '{n} more characters.',
    another: 'Add a word to reach {level}.',
    tips: {
      keyboard: 'Avoid keyboard runs (qwerty, 1234).',
      repeat: 'Avoid repeats and runs (aaa, abc).',
      dates: 'Avoid dates and years, easy to guess.',
      common: 'This password is too common: pick another.',
      word: 'A single word is easy to guess: add more.'
    }
  }
}

export const textsOf = (lang: Lang): JoinTexts => (lang === 'en' ? EN : FR)

export type ErrorKey = keyof JoinTexts['errors']
