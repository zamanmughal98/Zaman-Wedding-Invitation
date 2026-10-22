import { photo } from '../components/shared.js';

export function initGallery(w) {
  const dialog = document.getElementById('gallery-dialog');
  if (!dialog || !w.gallery.photos.length) return;
  let current = 0;
  function display(index) {
    current = (index + w.gallery.photos.length) % w.gallery.photos.length;
    const item = w.gallery.photos[current];
    dialog.querySelector('.lightbox-image').innerHTML = photo(item);
    dialog.querySelector('#gallery-dialog-caption').textContent = item.caption;
    dialog.querySelector('[data-gallery-counter]').textContent =
      `${current + 1} / ${w.gallery.photos.length}`;
  }
  document.querySelectorAll('[data-gallery]').forEach((button) =>
    button.addEventListener('click', () => {
      display(Number(button.dataset.gallery));
      dialog.showModal();
    }),
  );
  dialog
    .querySelector('[data-gallery-previous]')
    .addEventListener('click', () => display(current - 1));
  dialog.querySelector('[data-gallery-next]').addEventListener('click', () => display(current + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      display(current - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      display(current + 1);
    }
  });
}
