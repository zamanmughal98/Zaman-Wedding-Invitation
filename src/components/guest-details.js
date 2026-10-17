import {
  coupleNames,
  escapeHtml as e,
  formatDate,
  formatTime,
  initials,
  safeUrl,
} from '../utils.js';
import { botanical, flourish, scene } from './artwork.js';
import { heading, icon, mapLink } from './shared.js';

export function venue(w) {
  const event = w.events.find((item) => item.id === w.venue.primaryEventId) || w.events[0];
  if (!event) return '';
  return /* HTML */ `
    <section class="section venue-section" id="venue">
      ${heading('The sacred destination', 'A place to celebrate', w.venue.message)}
      <article class="venue-card reveal">
        <div class="venue-art">${scene('palace')}</div>
        <p class="eyebrow">${e(event.name)}</p>
        <h3>${e(event.venue)}</h3>
        ${event.address ? `<p class="venue-address">${e(event.address)}</p>` : '<p class="venue-address">The address will be shared here soon.</p>'}
        <p>${e(formatDate(event.start, w.site))} · ${e(formatTime(event.start, w.site))}</p>
        <div class="venue-actions">
          ${mapLink(event, 'button button-primary', 'Open in Google Maps')}${event.address ? `<button class="text-link" type="button" data-copy-address="${e(event.id)}">${icon('copy')}Copy address</button>` : ''}
        </div>
      </article>
      <div class="other-venues">
        ${w.events
          .filter((item) => item.id !== event.id)
          .map(
            (item) => /* HTML */ `
              <div>
                <span>${e(item.name)}</span>
                <span>${e(item.venue)}</span>
                ${safeUrl(item.mapsUrl) ? mapLink(item, 'text-link', 'Map') : ''}
              </div>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}

export function dressCode(w) {
  return /* HTML */ `
    <section class="section dress-section" id="dress-code">
      ${heading('Attire & a little inspiration', w.dressCode.title, w.dressCode.subtitle)}
      <div class="dress-swatches reveal">
        ${w.dressCode.swatches
          .map(
            (tone) => /* HTML */ `
              <span class="swatch swatch-${e(tone)}" title="${e(tone)}">
                <span class="sr-only">${e(tone)}</span>
              </span>
            `,
          )
          .join('')}
      </div>
      <div class="dress-list reveal">
        ${w.events
          .map(
            (event) => /* HTML */ `
              <div>
                <span>${e(event.name)}</span>
                <span>${e(event.dressCode)}</span>
              </div>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}

export function rsvp(w) {
  const local = !w.rsvp.endpoint;
  return /* HTML */ `
    <section class="section rsvp-section" id="rsvp">
      ${heading('The honour of your presence', 'Will you celebrate with us?', w.rsvp.message)}
      <div class="rsvp-card reveal">
        <div class="rsvp-seal" aria-hidden="true">${e(initials(w, ''))}</div>
        <p class="rsvp-deadline">Kindly respond by ${e(formatDate(w.rsvp.deadline, w.site))}</p>
        ${local ? '<p class="preview-notice">Preview invitation · Responses are saved on this device. Please contact the family to confirm attendance.</p>' : ''}
        <form id="rsvp-form">
          <fieldset class="attendance-options">
            <legend class="sr-only">Will you attend?</legend>
            <label>
              <input type="radio" name="attendance" value="yes" checked />
              <span>${icon('heart')}Joyfully accept</span>
            </label>
            <label>
              <input type="radio" name="attendance" value="no" />
              <span>✧ With duas from afar</span>
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
              <span>Phone or email</span>
              <input
                name="contact"
                autocomplete="email"
                placeholder="How can we reach you?"
                maxlength="150"
              />
            </label>
          </div>
          <div data-attending-fields>
            <label class="field">
              <span>Number of guests, including you</span>
              <select name="guests">
                ${Array.from(
                  { length: w.rsvp.maxGuests },
                  (_, i) => /* HTML */ `
                    <option value="${i + 1}">${i + 1} ${i ? 'guests' : 'guest'}</option>
                  `,
                ).join('')}
              </select>
            </label>
            <fieldset class="event-checkboxes">
              <legend>Which celebrations will you join?</legend>
              ${w.events
                .map(
                  (event) => /* HTML */ `
                    <label>
                      <input type="checkbox" name="events" value="${e(event.id)}" checked />
                      <span>${e(event.name)}</span>
                    </label>
                  `,
                )
                .join('')}
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
          <button class="button button-primary rsvp-submit" type="submit">
            ${local ? 'Save my response' : 'Send my response'}${icon('arrow')}
          </button>
          <p class="form-status" id="rsvp-status" role="status"></p>
        </form>
        <div class="response-actions" hidden>
          <button class="text-link" type="button" data-download-rsvp>
            ${icon('download')}Download my response
          </button>
          ${w.rsvp.contactPhone ? `<a class="text-link" data-whatsapp-rsvp href="https://wa.me/${e(w.rsvp.contactPhone)}" target="_blank" rel="noopener noreferrer">Confirm on WhatsApp ${icon('arrow')}</a>` : ''}
        </div>
      </div>
    </section>
  `;
}

export function wishes(w) {
  if (!w.wishes.enabled) return '';
  return /* HTML */ `
    <section class="section wishes-section" id="wishes">
      ${heading('Little notes. A lot of love.', 'A wall of warm wishes', 'Leave a dua, a memory, or a little love for the journey ahead.')}
      <div class="wishes-list" data-wishes-list></div>
      <p class="wishes-empty" data-wishes-empty>Be the first to leave a little love.</p>
      <button class="button button-outline" type="button" data-open-wish>
        ${icon('heart')}Leave a wish
      </button>
      <p class="local-note">Wishes in this preview are kept on this device.</p>
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
          <label class="field">
            <span>Your name</span>
            <input name="name" autocomplete="name" maxlength="100" required />
          </label>
          <label class="field">
            <span>Your wish</span>
            <textarea name="message" rows="4" maxlength="${w.wishes.maxLength}" required></textarea>
          </label>
          <button class="button button-primary" type="submit">Save my wish ${icon('heart')}</button>
          <p class="form-status" role="status"></p>
        </form>
        <p class="local-note">Saved on this device for now.</p>
      </dialog>
    </section>
  `;
}

export function footer(w) {
  return /* HTML */ `
    <footer class="site-footer">
      ${botanical('footer-botanical')}${flourish()}
      <p class="eyebrow">Hope to see you there</p>
      <p class="footer-names">${e(coupleNames(w))}</p>
      <p>${e(w.invitation.closing)}</p>
      <p class="footer-hashtag">${e(w.couple.hashtag)}</p>
      <div class="footer-contacts">
        ${w.contacts
          .map(
            (contact) => /* HTML */ `
              <div>
                <p>${e(contact.name)}</p>
                <span>${e(contact.role)}</span>
                ${contact.phone ? `<a href="tel:${e(contact.phone.replace(/[^+\d]/g, ''))}">${e(contact.phone)}</a>` : ''}
              </div>
            `,
          )
          .join('')}
      </div>
      <div class="footer-bottom">
        <span>Made with love. Shared with joy.</span>
        ${w.envelope.enabled ? `<button class="text-link" type="button" data-replay-envelope>${icon('replay')}Open the envelope again</button>` : ''}
      </div>
    </footer>
  `;
}
