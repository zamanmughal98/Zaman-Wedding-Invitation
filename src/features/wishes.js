import { assetUrl, escapeHtml as e, readStored, writeStored } from '../utils.js';
import { emailAppUrl, whatsappUrl } from '../submissions.js';
import { translateGuestText } from '../localization.js';

function clearValidity(form) {
  form.addEventListener('input', (event) => event.target.setCustomValidity?.(''));
}
function requiredText(form, names) {
  for (const name of names) {
    if (!form.elements[name].value.trim())
      form.elements[name].setCustomValidity(
        translateGuestText('Please fill in this field.', document.documentElement.lang),
      );
  }
  return form.reportValidity();
}
function setStatus(element, message, error = false) {
  element.textContent = message;
  element.classList.toggle('is-error', error);
}

export async function initWishes(w) {
  const dialog = document.getElementById('wish-dialog');
  if (!dialog) return;
  const list = document.querySelector('[data-wishes-list]');
  const empty = document.querySelector('[data-wishes-empty]');
  const form = document.getElementById('wish-form');
  const status = form.querySelector('.form-status');
  const key = w.id + ':wish-draft';
  const saved = readStored(key);
  if (saved && typeof saved.name === 'string' && typeof saved.message === 'string') {
    form.elements.name.value = saved.name;
    form.elements.message.value = saved.message;
  }
  document.querySelector('[data-open-wish]').addEventListener('click', () => dialog.showModal());
  clearValidity(form);
  function collect() {
    if (!requiredText(form, ['name', 'message'])) return null;
    if (form.elements._honey.value) return null;
    const entry = {
      name: form.elements.name.value.trim().slice(0, 100),
      message: form.elements.message.value.trim().slice(0, w.wishes.maxLength),
      updatedAt: new Date().toISOString(),
    };
    writeStored(key, entry);
    return entry;
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const entry = collect();
    if (!entry) return;
    window.location.href = emailAppUrl(w, entry);
    setStatus(
      status,
      'Your email app will open with your wish. Tap Send there to share it for family approval.',
    );
  });
  form.querySelector('[data-whatsapp-wish]')?.addEventListener('click', (event) => {
    const entry = collect();
    if (!entry) {
      event.preventDefault();
      return;
    }
    event.currentTarget.href = whatsappUrl(w, entry);
    setStatus(
      status,
      'Your wish is ready in WhatsApp. Tap Send there to share it for family approval.',
    );
  });
  try {
    const response = await fetch(assetUrl(w.wishes.publishedFile), { cache: 'no-cache' });
    if (!response.ok) throw new Error('Wishes unavailable');
    const entries = await response.json();
    if (!Array.isArray(entries)) throw new Error('Invalid wishes');
    const approved = entries.filter(
      (item) =>
        item &&
        typeof item.name === 'string' &&
        typeof item.message === 'string' &&
        item.name.trim() &&
        item.message.trim(),
    );
    list.innerHTML = approved
      .map(
        (wish) =>
          `<article class="wish-card" data-user-content dir="auto"><blockquote>“${e(wish.message.slice(0, w.wishes.maxLength))}”</blockquote><p>— ${e(wish.name.slice(0, 100))}</p></article>`,
      )
      .join('');
    empty.hidden = approved.length > 0;
  } catch {
    empty.textContent = 'The wishes wall could not load. You can still send us a wish.';
  }
}
