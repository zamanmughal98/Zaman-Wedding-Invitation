import { readStored, writeStored } from '../utils.js';
import { translateGuestText } from '../localization.js';

/** Apps Script wraps its HTML in another Google iframe, so use a per-load channel. */
export function isWishResizeMessage(event, channel, serviceOrigin) {
  let origin;
  try {
    origin = new URL(event.origin);
  } catch {
    return false;
  }
  const trusted =
    event.origin === serviceOrigin ||
    (origin.protocol === 'https:' &&
      (origin.hostname === 'script.google.com' || origin.hostname.endsWith('.googleusercontent.com')));
  const data = event.data;
  return Boolean(
    trusted &&
    event.source &&
    data &&
    data.type === 'wedding:wishes:resize' &&
    data.channel === channel &&
    Number.isInteger(data.height) &&
    data.height >= 100 &&
    data.height <= 10000000 &&
    Number.isInteger(data.viewportHeight) && data.viewportHeight > 0 &&
    Number.isInteger(data.viewportWidth) && data.viewportWidth > 0,
  );
}

const initializedFrames = new WeakSet();

export function initWishesEmbed() {
  const frame = document.querySelector('.wishes-widget');
  if (!frame || initializedFrames.has(frame)) return;
  const source = frame.dataset.src || frame.getAttribute('src');
  if (!source) return;
  initializedFrames.add(frame);
  const wrapper = frame.closest('[data-wishes-frame]');
  const loading = document.querySelector('[data-wishes-loading]');
  const connection = document.querySelector('[data-wishes-connection]');
  const retry = document.querySelector('[data-retry-wishes]');
  const form = document.querySelector('[data-google-wish-form]');
  const formStatus = document.querySelector('[data-google-wish-status]');
  const button = form?.querySelector('[type="submit"]');
  const draftKey = 'zaman-nimra-wish-draft-v1';
  const uuid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
  let requestId = crypto.randomUUID();
  let revision = 0;
  let pending;
  let peer;
  let connectionTimer;
  let connectionMessage = 'Loading wishes…';
  let formMessage = '';
  let formError = false;
  let active = false;
  let serviceOrigin = '';
  let lastChannel = '';
  let lastWidth = 0;
  let wrapperInset = 0;
  const text = (value) => translateGuestText(value, document.documentElement.lang);
  function setFormStatus(message, error = false) {
    formMessage = message;
    formError = error;
    if (!formStatus) return;
    formStatus.textContent = text(message);
    formStatus.classList.toggle('is-error', error);
  }
  function setConnectionStatus(message) {
    connectionMessage = message;
    if (connection) connection.textContent = text(message);
  }
  function currentChannel() {
    return active ? new URL(frame.src).searchParams.get('embedChannel') : '';
  }
  function saveDraft() {
    if (form) writeStored(draftKey, {
      requestId, name: form.elements.name.value, message: form.elements.message.value,
    });
  }
  function waiting() {
    peer = null;
    wrapper?.classList.add('is-loading');
    if (loading) loading.hidden = false;
    setConnectionStatus('Loading wishes…');
    if (retry) retry.hidden = true;
    clearTimeout(connectionTimer);
    connectionTimer = setTimeout(() => {
      if (peer) return;
      setConnectionStatus('The guestbook is taking longer to connect. You can keep writing your wish.');
      if (retry) retry.hidden = false;
    }, 8000);
  }
  function activate(force = false) {
    if (active && !force) return;
    const url = new URL(frame.dataset.src || frame.src || source, location.href);
    url.searchParams.set('embedChannel', crypto.randomUUID());
    url.searchParams.set('parentOrigin', location.origin);
    if (form) url.searchParams.set('hostForm', '1');
    serviceOrigin = url.origin;
    active = true;
    waiting();
    delete frame.dataset.src;
    frame.loading = 'eager';
    frame.src = url.href;
  }
  function finishSubmission(accepted) {
    const submitted = pending;
    clearTimeout(submitted.timer);
    pending = null;
    button.disabled = false;
    form.removeAttribute('aria-busy');
    if (accepted) {
      if (revision === submitted.revision) {
        form.reset();
        requestId = crypto.randomUUID();
        saveDraft();
      }
      setFormStatus('Thank you. Your wish has been saved for family approval.');
    } else setFormStatus('Your wish could not be sent. Please try again. Your wish is still in the form.', true);
  }
  function sendPending() {
    if (!pending || !peer || peer.channel !== currentChannel() || pending.sentChannel === peer.channel) return;
    pending.sentChannel = peer.channel;
    setFormStatus('Sending your wish…');
    peer.source.postMessage({
      type: 'wedding:wishes:submit', channel: peer.channel,
      requestId: pending.requestId, payload: pending.payload,
    }, peer.origin);
  }
  window.addEventListener('message', (event) => {
    if (!active) return;
    const activeChannel = currentChannel();
    if (event.data?.type === 'wedding:wishes:submitted') {
      if (!pending || !peer || peer.channel !== activeChannel || event.source !== peer.source ||
          event.origin !== peer.origin || event.data.channel !== activeChannel ||
          event.data.requestId !== pending.requestId || typeof event.data.accepted !== 'boolean') return;
      finishSubmission(event.data.accepted);
      return;
    }
    if (!isWishResizeMessage(event, activeChannel, serviceOrigin)) return;
    // An updated embedded service hides its own form and explicitly enables this bridge.
    if (form && event.data.hostForm !== true) return;
    if (peer?.channel === activeChannel && (peer.source !== event.source || peer.origin !== event.origin)) return;
    if (lastChannel !== activeChannel || lastWidth !== event.data.viewportWidth) {
      // Account for any header around Google's inner HTML iframe.
      wrapperInset = Math.max(0, Math.min(256, frame.clientHeight - event.data.viewportHeight));
      lastChannel = activeChannel;
      lastWidth = event.data.viewportWidth;
    }
    frame.style.height = event.data.height + wrapperInset + 'px';
    event.source.postMessage({ type: 'wedding:wishes:resize-ack', channel: activeChannel }, event.origin);
    peer = { source: event.source, origin: event.origin, channel: activeChannel };
    clearTimeout(connectionTimer);
    wrapper?.classList.remove('is-loading');
    if (loading) loading.hidden = true;
    sendPending();
  });
  retry?.addEventListener('click', () => activate(true));
  document.addEventListener('wedding:language', () => {
    if (active && peer?.channel !== currentChannel()) waiting();
    else setConnectionStatus(connectionMessage);
    setFormStatus(formMessage, formError);
  });
  if (form) {
    const saved = readStored(draftKey);
    if (saved && typeof saved.name === 'string' && typeof saved.message === 'string') {
      form.elements.name.value = saved.name.slice(0, 100);
      form.elements.message.value = saved.message.slice(0, 500);
      if (uuid.test(saved.requestId || '')) requestId = saved.requestId;
    }
    form.addEventListener('input', (event) => {
      event.target.setCustomValidity?.('');
      revision++;
      requestId = crypto.randomUUID();
      saveDraft();
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (pending) return;
      for (const name of ['name', 'message'])
        if (!form.elements[name].value.trim()) form.elements[name].setCustomValidity(text('Please fill in this field.'));
      if (!form.reportValidity()) return;
      saveDraft();
      pending = {
        requestId, revision,
        payload: {
          name: form.elements.name.value.trim(), message: form.elements.message.value.trim(),
          website: form.elements._honey.value.slice(0, 200),
        },
      };
      button.disabled = true;
      form.setAttribute('aria-busy', 'true');
      setFormStatus('Connecting to send your wish…');
      pending.timer = setTimeout(() => finishSubmission(false), 20000);
      activate();
      sendPending();
    });
    // Keep the uninitialized HTML form from sending its contents in a default GET.
    button.disabled = false;
  }
  // Prepare Google after the priority envelope images, while the guest views the intro.
  // The local form and loading message never wait for Google or for this task.
  const images = document.getElementById('envelope-dialog')?.open
    ? [...document.querySelectorAll('[data-envelope-cover] img, .wax-seal img')]
    : [];
  const imageReady = (image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  });
  void Promise.all(images.map(imageReady)).then(() => activate());
}
