import { coupleNames } from './utils.js';

export function wishMessage(w, entry) {
  return ['A wedding wish for ' + coupleNames(w), 'From: ' + entry.name, entry.message]
    .filter(Boolean)
    .join('\n');
}

export function emailAppUrl(w, entry) {
  const recipient = w.responses?.email;
  if (!recipient || /[\s?&#]/.test(recipient)) return '';
  return (
    'mailto:' +
    recipient +
    '?subject=' +
    encodeURIComponent(coupleNames(w) + ' | A wedding wish') +
    '&body=' +
    encodeURIComponent(wishMessage(w, entry))
  );
}

export function whatsappUrl(w, entry) {
  const phone = w.responses?.whatsappPhone?.replace(/\D/g, '');
  return phone
    ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(wishMessage(w, entry))
    : '';
}
