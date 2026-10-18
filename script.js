import { wedding } from './config/wedding.js';
import { renderInvitation } from './src/render.js';
import { initEnvelope } from './src/features/invitation.js';
import { initNavigation } from './src/features/navigation.js';
import {
  initCountdown,
  initScratch,
  initGallery,
  initSharedInteractions,
} from './src/features/interactions.js';
import { initRsvp, initWishes } from './src/features/responses.js';
import { initCoupleMedia } from './src/features/media.js';
import { initMusic } from './src/features/music.js';

// The local server and production build pre-render the same components.
const app = document.getElementById('app');
if (!app.querySelector('main')) app.innerHTML = renderInvitation(wedding);
initNavigation();
initCountdown(wedding);
initScratch(wedding);
initGallery(wedding);
initSharedInteractions(wedding);
initRsvp(wedding);
initWishes(wedding);
initMusic(wedding);
initCoupleMedia();
initEnvelope();
