import { assetUrl, escapeHtml as e, initials, safeUrl } from '../utils.js';
import { flourish, scene } from './artwork.js';

const paths = {
  camera: '<path d="M4 7h4l2-3h4l2 3h4v13H4Z"/><circle cx="12" cy="13" r="4"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
  sound: '<path d="M11 5 6 9H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  mute: '<path d="M11 5 6 9H3v6h3l5 4ZM16 9l5 6M21 9l-5 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  replay: '<path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7"/>',
};
export const icon = (name) => /* HTML */ `
  <svg
    class="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${paths[name] || paths.arrow}
  </svg>
`;

// All couple branding shares one image; individual portraits keep their own initials.
export function monogram(w, className = '') {
  const logo = assetUrl(w.site.logo);
  return logo
    ? `<img class="monogram-image${className ? ' ' + e(className) : ''}" src="${e(logo)}" alt="" width="1254" height="1254" draggable="false" />`
    : `<span class="monogram-initials" aria-hidden="true">${e(initials(w, ''))}</span>`;
}

export function heading(eyebrow, title, subtitle = '') {
  return /* HTML */ `
    <div class="section-heading reveal">
      <p class="eyebrow">${e(eyebrow)}</p>
      <h2>${e(title)}</h2>
      ${flourish()}${subtitle ? `<p class="section-subtitle">${e(subtitle)}</p>` : ''}
    </div>
  `;
}

export function photo({ src, alt, position = 'center', illustration = 'palace' }, className = '') {
  const url = assetUrl(src);
  return url
    ? `<img class="${className}" src="${e(url)}" alt="${e(alt)}" loading="lazy" decoding="async" style="object-position:${e(position)}" data-photo-fallback="${e(illustration)}" />`
    : `<div class="illustrated-photo ${className}">${scene(illustration)}</div>`;
}

export function mapLink(event, className = 'text-link', label = 'View directions') {
  const url = safeUrl(event.mapsUrl);
  return url
    ? `<a class="${className}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${icon('pin')}${e(label)}${icon('arrow')}</a>`
    : '<span class="venue-pending">Directions will follow</span>';
}
