export function initEnvelope() {
  const dialog = document.getElementById('envelope-dialog');
  if (!dialog) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let closing = false;
  const letter = dialog.querySelector('.envelope-letter');
  const seal = dialog.querySelector('.wax-seal');

  function show() {
    closing = false;
    dialog.classList.remove('is-unsealed', 'is-leaving');
    letter.inert = true;
    letter.setAttribute('aria-hidden', 'true');
    seal.disabled = false;
    dialog.showModal();
    seal.focus({ preventScroll: true });
  }
  function enter() {
    if (closing || !dialog.open) return;
    closing = true;
    dialog.classList.add('is-leaving');
    setTimeout(
      () => {
        dialog.close();
        const target = document.getElementById('hero-title') || document.getElementById('main');
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      },
      reduced.matches ? 0 : 600,
    );
  }
  dialog.querySelectorAll('[data-unseal]').forEach((button) =>
    button.addEventListener('click', () => {
      if (dialog.classList.contains('is-unsealed')) return;
      dialog.classList.add('is-unsealed');
      letter.inert = false;
      letter.removeAttribute('aria-hidden');
      seal.disabled = true;
      letter.querySelector('[data-open-invitation]').focus({ preventScroll: true });
    }),
  );
  dialog
    .querySelectorAll('[data-open-invitation]')
    .forEach((button) => button.addEventListener('click', enter));
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    enter();
  });
  document.querySelector('[data-replay-envelope]')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    show();
  });
  // Refreshing restarts the envelope even when a section anchor remains in the URL.
  const isReload = window.performance.getEntriesByType('navigation')[0]?.type === 'reload';
  if (isReload || !window.location.hash) show();
}
