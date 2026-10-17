import { assetUrl, downloadFile, escapeHtml as e, readStored, writeStored } from '../utils.js';
import { emailAppUrl, whatsappUrl } from '../submissions.js';

function clearValidity(form) {
  form.addEventListener('input', (event) => event.target.setCustomValidity?.(''));
}
function requiredText(form, names) {
  for (const name of names) {
    if (!form.elements[name].value.trim())
      form.elements[name].setCustomValidity('Please fill in this field.');
  }
  return form.reportValidity();
}
function setStatus(element, message, error = false) {
  element.textContent = message;
  element.classList.toggle('is-error', error);
}

export function initRsvp(w) {
  const form = document.getElementById('rsvp-form');
  if (!form) return;
  const key = w.id + ':rsvp';
  const status = document.getElementById('rsvp-status');
  const attendingFields = form.querySelector('[data-attending-fields]');
  const saved = readStored(key);
  let response = saved && typeof saved.name === 'string' ? saved : null;
  const actions = document.querySelector('.response-actions');
  if (response) {
    for (const name of ['name', 'contact', 'message', 'attendance', 'guests']) {
      if (response[name] !== undefined) form.elements[name].value = response[name];
    }
    if (Array.isArray(response.events))
      form.querySelectorAll('[name="events"]').forEach((input) => {
        input.checked = response.events.includes(input.value);
      });
    actions.hidden = false;
  }
  function attendance() {
    const no = form.elements.attendance.value === 'no';
    attendingFields.hidden = no;
    attendingFields.querySelectorAll('input, select').forEach((input) => {
      input.disabled = no;
    });
  }
  form
    .querySelectorAll('[name="attendance"]')
    .forEach((input) => input.addEventListener('change', attendance));
  clearValidity(form);
  attendance();

  function collect() {
    if (!requiredText(form, ['name'])) return null;
    const data = new FormData(form);
    if (data.get('_honey')) return null;
    const accepts = data.get('attendance') === 'yes';
    const events = accepts
      ? data.getAll('events').filter((id) => w.events.some((item) => item.id === id))
      : [];
    if (accepts && !events.length && w.events.length) {
      setStatus(status, 'Please choose at least one celebration.', true);
      return null;
    }
    response = {
      name: data.get('name').trim().slice(0, 100),
      contact: (data.get('contact') || '').trim().slice(0, 150),
      attendance: accepts ? 'yes' : 'no',
      guests: accepts
        ? Math.max(1, Math.min(w.rsvp.maxGuests, Number(data.get('guests')) || 1))
        : 0,
      events,
      message: (data.get('message') || '').trim().slice(0, 1000),
      updatedAt: new Date().toISOString(),
    };
    writeStored(key, response);
    actions.hidden = false;
    return response;
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const draft = collect();
    if (!draft) return;
    window.location.href = emailAppUrl(w, 'rsvp', draft);
    setStatus(
      status,
      'Your email app will open with your response. Tap Send there to confirm, or use WhatsApp below.',
    );
  });
  form.querySelector('[data-whatsapp-rsvp]')?.addEventListener('click', (event) => {
    const draft = collect();
    if (!draft) {
      event.preventDefault();
      return;
    }
    event.currentTarget.href = whatsappUrl(w, 'rsvp', draft);
    setStatus(status, 'Your message is ready in WhatsApp. Tap Send there to confirm.');
  });
  document.querySelector('[data-download-rsvp]')?.addEventListener('click', () => {
    if (response)
      downloadFile(
        'my-wedding-response.json',
        JSON.stringify(response, null, 2),
        'application/json',
      );
  });
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
    window.location.href = emailAppUrl(w, 'wish', entry);
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
    event.currentTarget.href = whatsappUrl(w, 'wish', entry);
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
          `<article class="wish-card"><blockquote>“${e(wish.message.slice(0, w.wishes.maxLength))}”</blockquote><p>— ${e(wish.name.slice(0, 100))}</p></article>`,
      )
      .join('');
    empty.hidden = approved.length > 0;
  } catch {
    empty.textContent = 'The wishes wall could not load. You can still send us a wish.';
  }
}
