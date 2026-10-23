import { escapeHtml as e } from '../utils.js';
import { heading, icon, photo } from './shared.js';

export function gallery(w) {
  if (!w.gallery.photos.length)
    return `<section class="section gallery-section" id="gallery">${heading('Glimpses of forever', w.gallery.title, w.gallery.subtitle)}<p class="gallery-empty">Our photographs will find their place here.</p></section>`;

  return /* HTML */ `
    <section class="section gallery-section" id="gallery">
      ${heading('Glimpses of forever', w.gallery.title, w.gallery.subtitle)}
      <div class="gallery-grid">
        ${w.gallery.photos
          .map(
            (item, index) => /* HTML */ `
              <button
                class="gallery-item reveal"
                type="button"
                data-gallery="${index}"
                aria-label="View ${e(item.alt || item.caption)}"
              >
                <span class="gallery-image">
                  ${photo(item)}
                  <span class="gallery-expand" aria-hidden="true">↗</span>
                </span>
                <span class="gallery-caption">${e(item.caption)}</span>
              </button>
            `,
          )
          .join('')}
      </div>
      <dialog class="lightbox${w.gallery.photos.length === 1 ? ' gallery-single' : ''}" id="gallery-dialog" aria-labelledby="gallery-dialog-caption">
        <button
          class="dialog-close icon-button"
          type="button"
          data-close-dialog
          aria-label="Close photograph"
        >
          ${icon('close')}
        </button>
        <div class="lightbox-image"></div>
        <p id="gallery-dialog-caption"></p>
        <div class="lightbox-controls">
          <button
            class="icon-button"
            type="button"
            data-gallery-previous
            aria-label="Previous photograph"
          >
            ${icon('chevron')}
          </button>
          <span data-gallery-counter></span>
          <button class="icon-button" type="button" data-gallery-next aria-label="Next photograph">
            ${icon('chevron')}
          </button>
        </div>
      </dialog>
    </section>
  `;
}
