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
  // Older cached HTML may still contain a live URL. Cancel it until this section is needed.
  frame.dataset.src = source;
  frame.removeAttribute('src');
  const intro = document.getElementById('envelope-dialog');
  let observer;
  let nearby = !window.IntersectionObserver;
  let active = false;
  let serviceOrigin = '';
  let lastChannel = '';
  let lastWidth = 0;
  let wrapperInset = 0;
  function activate() {
    if (active || !nearby || intro?.open) return;
    const url = new URL(frame.dataset.src, location.href);
    url.searchParams.set('embedChannel', crypto.randomUUID());
    url.searchParams.set('parentOrigin', location.origin);
    serviceOrigin = url.origin;
    active = true;
    observer?.disconnect();
    intro?.removeEventListener('close', activate);
    delete frame.dataset.src;
    frame.loading = 'eager';
    frame.src = url.href;
  }
  window.addEventListener('message', (event) => {
    if (!active) return;
    const activeChannel = new URL(frame.src).searchParams.get('embedChannel');
    if (!isWishResizeMessage(event, activeChannel, serviceOrigin)) return;
    if (lastChannel !== activeChannel || lastWidth !== event.data.viewportWidth) {
      // Account for any header around Google's inner HTML iframe.
      wrapperInset = Math.max(0, Math.min(256, frame.clientHeight - event.data.viewportHeight));
      lastChannel = activeChannel;
      lastWidth = event.data.viewportWidth;
    }
    frame.style.height = event.data.height + wrapperInset + 'px';
    event.source.postMessage({ type: 'wedding:wishes:resize-ack', channel: activeChannel }, event.origin);
  });
  intro?.addEventListener('close', activate);
  if (window.IntersectionObserver) {
    observer = new IntersectionObserver((entries) => {
      nearby = entries.some((entry) => entry.isIntersecting);
      activate();
    }, { rootMargin: '500px 0px' });
    observer.observe(frame);
  } else activate();
}
