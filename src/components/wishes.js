import { wishesWidgetUrl } from '../wishes-service.js';
import { escapeHtml as e } from '../utils.js';
import { flourish } from './artwork.js';
import { heading, icon } from './shared.js';

function honeypot() {
  return '<label class="honeypot" aria-hidden="true">Leave this field empty<input name="_honey" tabindex="-1" autocomplete="off" /></label>';
}
function whatsappLink(w) {
  if (!w.responses.whatsappPhone) return '';
  return `<a class="text-link" data-whatsapp-wish href="https://wa.me/${e(w.responses.whatsappPhone.replace(/\D/g, ''))}" target="_blank" rel="noopener noreferrer">Reply on WhatsApp ${icon('arrow')}</a>`;
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
          <div class="wishes-widget-frame is-loading" data-wishes-frame>
            <div class="wishes-loading" data-wishes-loading role="status">
              <p data-wishes-connection>Loading wishes…</p>
              <button class="text-link" type="button" data-retry-wishes hidden>Try again</button>
            </div>
            <iframe
              class="wishes-widget"
              data-guest-service
              data-src="${e(widget)}"
              title="Approved wedding wishes and a form to leave a wish"
              loading="lazy"
              referrerpolicy="no-referrer"
            ></iframe>
          </div>
          <div class="wishes-form-panel" data-google-wish-panel>
            <h3>Leave a warm wish</h3>
            ${flourish()}
            <form data-google-wish-form>
              ${honeypot()}
              <label class="field">
                <span>Your name</span>
                <input name="name" dir="auto" autocomplete="name" maxlength="100" required />
              </label>
              <label class="field">
                <span>Your wish or dua</span>
                <textarea name="message" dir="auto" rows="4" maxlength="500" required></textarea>
              </label>
              <button class="button button-primary" type="submit" disabled>Send for approval</button>
              <p class="form-status" data-google-wish-status role="status"></p>
            </form>
            <p class="local-note">Your name and wish are saved with Google and shared here only after the family approves them.</p>
          </div>
          <div class="wishes-keepsake-footer">
            <p>Your words become part of our story.</p>
            <a class="text-link" data-guest-service href="${e(widget)}" target="_blank" rel="noopener noreferrer">
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
      <button class="button button-outline" type="button" data-more-wishes hidden>See more wishes</button>
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
            <input name="name" dir="auto" autocomplete="name" maxlength="100" required />
          </label>
          <label class="field">
            <span>Your wish</span>
            <textarea name="message" dir="auto" rows="4" maxlength="${w.wishes.maxLength}" required></textarea>
          </label>
          <div class="submission-options">
            <button class="button button-primary" type="submit">
              Email my wish ${icon('heart')}
            </button>
            ${whatsappLink(w)}
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
