import { wishesWidgetUrl } from '../wishes-service.js';
import { coupleNames, escapeHtml as e, eventDate, eventTime, formatDate } from '../utils.js';
import { botanical, flourish } from './artwork.js';
import { heading, icon, mapLink, monogram } from './shared.js';

export function venue(w) {
  const event = w.events.find((item) => item.id === w.venue.primaryEventId) || w.events[0];
  if (!event) return '';
  return /* HTML */ `
    <section class="section venue-section" id="venue">
      ${heading('Join us for the evening', 'A place to celebrate', w.venue.message)}
      <article class="venue-card reveal">
        <p class="eyebrow">${e(event.name)}</p>
        <h3>${e(event.venue || 'Venue to be confirmed')}</h3>
        ${event.address ? `<p class="venue-address">${e(event.address)}</p>` : ''}
        <p>${e(formatDate(eventDate(event), w.site))} · ${e(eventTime(event, w.site))}</p>
        <div class="venue-actions">
          ${event.mapsUrl ? mapLink(event, 'button button-primary', 'Open in Google Maps') : ''}
          ${event.address ? `<button class="text-link" type="button" data-copy-address="${e(event.id)}">${icon('copy')}Copy venue address</button>` : ''}
        </div>
      </article>
    </section>
  `;
}

export function dressCode(w) {
  const looks = (w.dressCode.looks || [])
    .map((look) => ({ ...look, event: w.events.find((event) => event.id === look.eventId) }))
    .filter((look) => look.event);
  return /* HTML */ `
    <section class="section dress-section" id="dress-code">
      ${heading('A little outfit inspiration', w.dressCode.title, w.dressCode.subtitle)}
      <div class="outfit-grid">
        ${looks
          .map(
            (look, index) => /* HTML */ `
          <article class="outfit-card outfit-tone-${e(look.tone)} reveal" aria-labelledby="outfit-${e(look.event.id)}">
            <div class="outfit-topline">
              <span class="outfit-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
              <time datetime="${e(look.event.date || look.event.start.slice(0, 10))}">${e(formatDate(eventDate(look.event), w.site, { month: 'short' }))}</time>
            </div>
            <h3 id="outfit-${e(look.event.id)}">${e(look.event.name)}</h3>
            <ul class="outfit-palette" aria-label="Illustrative outfit colours">
              ${look.palette
                .map(
                  (shade) => `
                <li class="fabric-tone-${e(shade.tone)}">
                  <span class="fabric-swatch" aria-hidden="true"></span>
                  <span class="fabric-label">${e(shade.label)}</span>
                </li>
              `,
                )
                .join('')}
            </ul>
            <p class="outfit-suggestion">${e(look.suggestion)}</p>
          </article>
        `,
          )
          .join('')}
      </div>
      ${w.dressCode.message ? `<div class="outfit-invitation reveal">${flourish()}<p>${e(w.dressCode.message)}</p></div>` : ''}
    </section>
  `;
}

function honeypot() {
  return '<label class="honeypot" aria-hidden="true">Leave this field empty<input name="_honey" tabindex="-1" autocomplete="off" /></label>';
}
function whatsappLink(w, kind) {
  if (!w.rsvp.contactPhone) return '';
  return `<a class="text-link" data-whatsapp-${kind} href="https://wa.me/${e(w.rsvp.contactPhone.replace(/\D/g, ''))}" target="_blank" rel="noopener noreferrer">Reply on WhatsApp ${icon('arrow')}</a>`;
}

export function rsvp(w) {
  return /* HTML */ `
    <section class="section rsvp-section" id="rsvp">
      ${heading('The honour of your presence', 'Will you celebrate with us?', w.rsvp.message)}
      <div class="rsvp-card reveal">
        <div class="rsvp-seal" aria-hidden="true">${monogram(w)}</div>
        ${w.rsvp.deadline ? `<p class="rsvp-deadline">Kindly respond by ${e(formatDate(w.rsvp.deadline, w.site))}</p>` : ''}
        <form id="rsvp-form">
          ${honeypot()}
          <fieldset class="attendance-options">
            <legend class="sr-only">Will you attend?</legend>
            <label>
              <input type="radio" name="attendance" value="yes" checked />
              <span>${icon('heart')}Joyfully accept</span>
            </label>
            <label>
              <input type="radio" name="attendance" value="no" />
              <span>With duas from afar</span>
            </label>
          </fieldset>
          <div class="form-grid">
            <label class="field">
              <span>
                Your name
                <span aria-hidden="true">*</span>
              </span>
              <input
                name="name"
                autocomplete="name"
                placeholder="Your full name"
                maxlength="100"
                required
              />
            </label>
            <label class="field">
              <span>
                Phone or email
                <small>(optional)</small>
              </span>
              <input name="contact" placeholder="How can we reach you?" maxlength="150" />
            </label>
          </div>
          <div data-attending-fields>
            <label class="field">
              <span>Number of guests, including you</span>
              <select name="guests">
                ${Array.from({ length: w.rsvp.maxGuests }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? 'guests' : 'guest'}</option>`).join('')}
              </select>
            </label>
            <fieldset class="event-checkboxes">
              <legend>Which celebrations will you join?</legend>
              ${w.events.map((event) => `<label><input type="checkbox" name="events" value="${e(event.id)}" checked /><span>${e(event.name)}</span></label>`).join('')}
            </fieldset>
          </div>
          <label class="field">
            <span>A little message for the couple</span>
            <textarea
              name="message"
              rows="3"
              placeholder="Your wishes mean the world to us…"
              maxlength="1000"
            ></textarea>
          </label>
          <div class="submission-options">
            <button class="button button-primary rsvp-submit" type="submit">
              Reply by email ${icon('arrow')}
            </button>
            ${whatsappLink(w, 'rsvp')}
          </div>
          <p class="local-note">Choose email or WhatsApp, then tap Send in the app that opens.</p>
          <p class="form-status" id="rsvp-status" role="status"></p>
        </form>
        <div class="response-actions" hidden>
          <button class="text-link" type="button" data-download-rsvp>
            ${icon('download')}Download my response
          </button>
        </div>
      </div>
    </section>
  `;
}

export function wishes(w) {
  if (!w.wishes.enabled) return '';
  const widget = wishesWidgetUrl(w);
  if (widget)
    return /* HTML */ `
      <section class="section wishes-section" id="wishes">
        ${heading('With love & duas', 'A wall of warm wishes', w.wishes.message)}
        <div class="wishes-keepsake">
          <div class="wishes-keepsake-heading">
            <span class="wishes-emblem" aria-hidden="true">${icon('heart')}</span>
            <div>
              <p class="eyebrow">A little love to keep</p>
              <p class="wishes-keepsake-title">Words we’ll treasure.</p>
            </div>
          </div>
          <div class="wishes-widget-frame">
            <iframe
              class="wishes-widget"
              src="${e(widget)}"
              title="Approved wedding wishes and a form to leave a wish"
              loading="lazy"
              referrerpolicy="no-referrer"
            ></iframe>
          </div>
          <div class="wishes-keepsake-footer">
            <p>Your words become part of our story.</p>
            <a class="text-link" href="${e(widget)}" target="_blank" rel="noopener noreferrer">
              Open the guestbook ${icon('arrow')}
            </a>
          </div>
        </div>
      </section>
    `;
  return /* HTML */ `
    <section class="section wishes-section" id="wishes">
      ${heading('Little notes. A lot of love.', 'A wall of warm wishes', w.wishes.message)}
      <div class="wishes-list" data-wishes-list></div>
      <p class="wishes-empty" data-wishes-empty>Your duas and warm wishes mean so much to us.</p>
      <button class="button button-outline" type="button" data-open-wish>
        ${icon('heart')}Leave a wish
      </button>
      <p class="local-note">Wishes are shared here after the family approves them.</p>
      <dialog class="wish-dialog" id="wish-dialog" aria-labelledby="wish-title">
        <button
          class="dialog-close icon-button"
          type="button"
          data-close-dialog
          aria-label="Close wish form"
        >
          ${icon('close')}
        </button>
        <p class="eyebrow">A little love goes a long way</p>
        <h2 id="wish-title">Leave a warm wish</h2>
        ${flourish()}
        <form id="wish-form">
          ${honeypot()}
          <label class="field">
            <span>Your name</span>
            <input name="name" autocomplete="name" maxlength="100" required />
          </label>
          <label class="field">
            <span>Your wish</span>
            <textarea name="message" rows="4" maxlength="${w.wishes.maxLength}" required></textarea>
          </label>
          <div class="submission-options">
            <button class="button button-primary" type="submit">
              Email my wish ${icon('heart')}
            </button>
            ${whatsappLink(w, 'wish')}
          </div>
          <p class="form-status" role="status"></p>
        </form>
        <p class="local-note">
          Send from your email app or WhatsApp. Wishes appear here after family approval.
        </p>
      </dialog>
    </section>
  `;
}

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
