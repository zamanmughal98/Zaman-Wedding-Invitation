import { coupleNames, escapeHtml as e } from '../utils.js';
import { botanical } from './artwork.js';
import { icon, monogram } from './shared.js';

export function footer(w) {
  return /* HTML */ `
    <footer class="site-footer">
      ${botanical('footer-botanical')}
      <div class="footer-monogram" aria-hidden="true">${monogram(w)}</div>
      <p class="eyebrow">Hope to see you there</p>
      <p class="footer-names">${e(coupleNames(w))}</p>
      <p>${e(w.invitation.closing)}</p>
      ${w.couple.hashtag ? `<p class="footer-hashtag">${e(w.couple.hashtag)}</p>` : ''}
      <div class="footer-contacts">
        ${w.contacts.map((contact) => `<div><p>${e(contact.name)}</p><span>${e(contact.role)}</span>${contact.phone ? `<a href="tel:${e(contact.phone.replace(/[^+\d]/g, ''))}">${e(contact.phone)}</a>` : ''}</div>`).join('')}
      </div>
      <div class="footer-bottom">
        <span>Made with love. Shared with joy.</span>
        ${w.envelope.enabled ? `<button class="text-link" type="button" data-replay-envelope>${icon('replay')}Open the envelope again</button>` : ''}
      </div>
    </footer>
  `;
}
