import { calendarFile, downloadFile } from '../utils.js';
import { scene } from '../components/artwork.js';
import { toast } from './toast.js';

export function initSharedInteractions(w) {
  document
    .querySelectorAll('[data-close-dialog]')
    .forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('dialog:not(.envelope-intro)').forEach((dialog) =>
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    }),
  );
  document.querySelectorAll('[data-calendar]').forEach((button) =>
    button.addEventListener('click', () => {
      const event = w.events.find((item) => item.id === button.dataset.calendar);
      if (event)
        downloadFile(
          `${event.id}-invitation.ics`,
          calendarFile(event, w),
          'text/calendar;charset=utf-8',
        );
    }),
  );
  document.querySelectorAll('[data-copy-address]').forEach((button) =>
    button.addEventListener('click', async () => {
      const event = w.events.find((item) => item.id === button.dataset.copyAddress);
      if (!event) return;
      try {
        await navigator.clipboard.writeText(
          [event.venue, event.address].filter(Boolean).join(', '),
        );
        toast('The address is copied. See you there!');
      } catch {
        toast(`Address: ${[event.venue, event.address].filter(Boolean).join(', ')}`);
      }
    }),
  );
  document.addEventListener(
    'error',
    (event) => {
      const image = event.target;
      if (image instanceof HTMLImageElement && image.hasAttribute('data-portrait-photo')) {
        // Keep the matching monogram visible if a personal photo cannot load.
        image.remove();
        return;
      }
      if (image instanceof HTMLImageElement && image.hasAttribute('data-photo-fallback')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'illustrated-photo';
        placeholder.innerHTML = scene(image.dataset.photoFallback);
        placeholder.setAttribute('role', 'img');
        placeholder.setAttribute('aria-label', image.alt || 'Wedding illustration');
        image.replaceWith(placeholder);
      }
    },
    true,
  );
  // Some cached image errors precede the event listener.
  document
    .querySelectorAll('img[data-photo-fallback], img[data-portrait-photo]')
    .forEach((image) => {
      if (image.complete && !image.naturalWidth) image.dispatchEvent(new Event('error'));
    });
}
