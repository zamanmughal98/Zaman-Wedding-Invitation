import { initNavigation } from './navigation.js';
import { initCountdown } from './countdown.js';
import { initScratch } from './scratch.js';
import { initGallery } from './gallery.js';
import { initSharedInteractions } from './shared-interactions.js';
import { initWishes } from './wishes.js';
import { initCoupleMedia } from './media.js';

const initialized = new Set();
export function initPage(wedding) {
  for (const initialize of [initNavigation, initCountdown, initScratch, initGallery,
    initSharedInteractions, initWishes, initCoupleMedia]) {
    if (initialized.has(initialize)) continue;
    initialize(wedding);
    initialized.add(initialize);
  }
}
