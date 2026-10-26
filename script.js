import { wedding } from './config/wedding.js';
import { initEnvelope } from './src/features/invitation.js';
import { initMusic } from './src/features/music.js';
import { initLanguage } from './src/features/language.js';

async function start() {
  const app = document.getElementById('app');
  // Production and local previews already contain the rendered invitation.
  if (!app.querySelector('main')) {
    const { renderInvitation } = await import('./src/render.js');
    app.innerHTML = renderInvitation(wedding);
  }
  // Keep music's gesture handlers ready for even the first seal tap.
  initMusic(wedding);
  initEnvelope();
  initLanguage(wedding);

  let loading;
  let attempts = 0;
  let retryTimer;
  let retryNotice;
  function startPage() {
    if (loading) return loading;
    clearTimeout(retryTimer);
    attempts++;
    loading = import('./src/features/page.js').then(({ initPage }) => {
      initPage(wedding);
      retryNotice?.remove();
    }).catch(() => {
      loading = null;
      if (attempts < 3) retryTimer = setTimeout(startPage, attempts * 1000);
      else if (!retryNotice?.isConnected) {
        retryNotice = document.createElement('div');
        retryNotice.className = 'connection-retry';
        retryNotice.setAttribute('role', 'status');
        const message = document.createElement('p');
        message.textContent = 'Some features could not load. Please try again.';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'button button-outline';
        retry.textContent = 'Try again';
        retry.addEventListener('click', () => { attempts = 0; void startPage(); });
        retryNotice.append(message, retry);
        document.querySelector('main').prepend(retryNotice);
      }
    });
    return loading;
  }
  window.addEventListener('online', () => { attempts = 0; void startPage(); });
  const intro = document.getElementById('envelope-dialog');
  if (intro?.open) {
    document.querySelectorAll('[data-unseal], [data-open-invitation]').forEach((button) => {
      button.addEventListener('click', startPage);
    });
    intro.addEventListener('close', startPage, { once: true });
  } else void startPage();
}
void start();
