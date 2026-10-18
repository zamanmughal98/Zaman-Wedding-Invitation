import { escapeHtml as e } from '../utils.js';
import { heading, icon } from './shared.js';
import { photoUploadUrl } from '../photo-upload-service.js';

export function photoUploads(w) {
  const url = photoUploadUrl(w);
  return /* HTML */ `
    <section class="section" id="photo-uploads">
      ${heading('Through your eyes', w.photos.title, w.photos.message)}
      <div class="photo-upload-card reveal">
        <span class="photo-upload-emblem" aria-hidden="true">${icon('camera')}</span>
        <p class="eyebrow">Little moments. Lasting memories.</p>
        <h3>Our day, through your lens.</h3>
        <p class="photo-upload-copy">
          Candid smiles, happy tears, and the moments in between. We would love to keep the memories
          you capture.
        </p>
        ${
          url
            ? `<a class="button button-primary" href="${e(url)}" target="_blank" rel="noopener noreferrer">Share your photos ${icon('arrow')}</a>
             <p class="local-note">Opens a private upload page. Keep it open until your photos finish.</p>`
            : '<p class="photo-upload-soon">Photo sharing will open here soon.</p>'
        }
        <p class="photo-upload-privacy">
          ${icon('lock')}Shared privately with Zaman &amp; Nimra. Viewing is by invitation.
        </p>
      </div>
    </section>
  `;
}
