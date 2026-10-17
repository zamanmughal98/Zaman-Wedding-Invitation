import { downloadFile, escapeHtml as e, readStored, safeUrl, writeStored } from '../utils.js';
import { toast } from './interactions.js';

export function initRsvp(w) {
  const form = document.getElementById('rsvp-form');
  if (!form) return;
  const key = `${w.id}:rsvp`;
  const status = document.getElementById('rsvp-status');
  const attendingFields = form.querySelector('[data-attending-fields]');
  const saved = readStored(key);
  let response = null;
  function attendance() {
    const no = form.elements.attendance.value === 'no';
    attendingFields.hidden = no;
    attendingFields.querySelectorAll('input, select').forEach((input) => {
      input.disabled = no;
    });
  }
  if (saved && typeof saved === 'object' && typeof saved.name === 'string') {
    for (const name of ['name', 'contact', 'message', 'attendance', 'guests']) {
      if (saved[name] !== undefined && form.elements[name]) form.elements[name].value = saved[name];
    }
    if (Array.isArray(saved.events))
      form.querySelectorAll('[name="events"]').forEach((input) => {
        input.checked = saved.events.includes(input.value);
      });
  }
  form
    .querySelectorAll('[name="attendance"]')
    .forEach((input) => input.addEventListener('change', attendance));
  form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));
  attendance();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.classList.remove('is-error');
    if (!form.elements.name.value.trim()) {
      form.elements.name.setCustomValidity('Please enter your name.');
      form.reportValidity();
      return;
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const accepts = data.get('attendance') === 'yes';
    const events = accepts
      ? data.getAll('events').filter((id) => w.events.some((item) => item.id === id))
      : [];
    if (accepts && !events.length && w.events.length) {
      status.textContent = 'Please choose at least one celebration.';
      status.classList.add('is-error');
      return;
    }
    const draft = {
      name: data.get('name').trim(),
      contact: (data.get('contact') || '').trim(),
      attendance: accepts ? 'yes' : 'no',
      guests: accepts
        ? Math.max(1, Math.min(w.rsvp.maxGuests, Number(data.get('guests')) || 1))
        : 0,
      events,
      message: (data.get('message') || '').trim(),
      updatedAt: new Date().toISOString(),
    };
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      if (w.rsvp.endpoint) {
        const endpoint = safeUrl(w.rsvp.endpoint);
        if (!endpoint)
          throw new Error('The response service is not configured yet. Please contact the family.');
        status.textContent = 'Sending your response…';
        const result = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weddingId: w.id, ...draft }),
          signal: AbortSignal.timeout(12000),
        });
        if (!result.ok)
          throw new Error(
            'Your response could not be sent. Please try again or contact the family.',
          );
        status.textContent = accepts
          ? 'Your response has been sent. We look forward to celebrating with you!'
          : 'Your response has been sent. Thank you for your love and duas.';
      } else {
        const stored = writeStored(key, draft);
        status.textContent = stored
          ? 'Your response is saved on this device. You can download it below. Please contact the family to confirm.'
          : 'Your browser could not save the draft. Download a copy below and contact the family to confirm.';
      }
      response = draft;
      document.querySelector('.response-actions').hidden = false;
      const whatsapp = document.querySelector('[data-whatsapp-rsvp]');
      if (whatsapp) {
        const names = events.map((id) => w.events.find((item) => item.id === id)?.name).join(', ');
        const text = `${draft.name}: ${accepts ? `Joyfully accepting for ${draft.guests} guest(s). Celebrations: ${names}.` : 'Unable to attend, with love and duas.'} ${draft.message}`;
        whatsapp.href = `https://wa.me/${w.rsvp.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
      }
    } catch (error) {
      status.classList.add('is-error');
      status.textContent =
        error.name === 'TimeoutError'
          ? 'The connection took too long. Please try again.'
          : error instanceof TypeError
            ? 'Unable to connect. Please try again or contact the family.'
            : error.message;
    } finally {
      submit.disabled = false;
    }
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

export function initWishes(w) {
  const dialog = document.getElementById('wish-dialog');
  if (!dialog) return;
  const key = `${w.id}:wishes`;
  const stored = readStored(key, []);
  let wishes = Array.isArray(stored)
    ? stored
        .filter((item) => item && typeof item.name === 'string' && typeof item.message === 'string')
        .slice(0, 30)
    : [];
  const list = document.querySelector('[data-wishes-list]');
  const empty = document.querySelector('[data-wishes-empty]');
  function render() {
    list.innerHTML = wishes
      .map(
        (wish) =>
          `<article class="wish-card"><blockquote>“${e(wish.message.slice(0, w.wishes.maxLength))}”</blockquote><p>— ${e(wish.name.slice(0, 100))}</p></article>`,
      )
      .join('');
    empty.hidden = wishes.length > 0;
  }
  document.querySelector('[data-open-wish]').addEventListener('click', () => dialog.showModal());
  const form = document.getElementById('wish-form');
  form.addEventListener('input', (event) => event.target.setCustomValidity?.(''));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    for (const name of ['name', 'message']) {
      if (!form.elements[name].value.trim()) {
        form.elements[name].setCustomValidity('Please fill in this field.');
        form.reportValidity();
        return;
      }
    }
    const data = new FormData(form);
    const entry = {
      name: data.get('name').trim().slice(0, 100),
      message: data.get('message').trim().slice(0, w.wishes.maxLength),
    };
    const next = [entry, ...wishes].slice(0, 30);
    if (!writeStored(key, next)) {
      form.querySelector('.form-status').textContent =
        'Your browser could not save this wish. Please try again with storage enabled.';
      return;
    }
    wishes = next;
    render();
    form.reset();
    dialog.close();
    toast('A little love, saved on this device. Thank you!');
  });
  render();
}
