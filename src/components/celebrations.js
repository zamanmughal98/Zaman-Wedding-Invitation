import { escapeHtml as e, eventDate, eventTime, formatDate, safeUrl } from '../utils.js';
import { eventFlourish } from './artwork.js';
import { heading, icon, mapLink } from './shared.js';

export function celebrations(w) {
  return /* HTML */ `
    <section class="section celebrations-section" id="celebrations">
      ${heading(w.invitation.period, 'Our wedding celebrations', 'Four evenings, shared with the people closest to us.')}
      <div class="event-list">
        ${w.events
          .map(
            (event, index) => `
      ${index ? `<div class="event-divider" aria-hidden="true">${eventFlourish()}</div>` : ''}
      <article class="event-card tone-${e(event.tone)} reveal" id="event-${e(event.id)}">
        <span class="event-watermark" lang="ur" dir="rtl" aria-hidden="true">${e(event.urdu)}</span>
        <div class="event-content">
          <div class="event-topline"><span class="event-number">0${index + 1}</span><span class="event-urdu" lang="ur" dir="rtl">${e(event.urdu)}</span></div>
          ${eventFlourish()}
          <p class="eyebrow">${e(event.eyebrow)}</p><h3>${e(event.name)}</h3>
          <p class="event-description">${e(event.description)}</p>
          <dl class="event-details"><div><dt>Date</dt><dd>${e(formatDate(eventDate(event), w.site, { weekday: 'long' }))}</dd></div><div><dt>Time</dt><dd>${e(eventTime(event, w.site))}</dd></div><div class="event-venue"><dt>Venue</dt><dd>${e(event.venue || 'Details will be shared soon')}${event.address ? `<span class="event-address">${e(event.address)}</span>` : ''}</dd></div></dl>
          ${event.dressCode ? `<p class="event-dress">${e(event.dressCode)}</p>` : ''}
          <div class="event-actions">${safeUrl(event.mapsUrl) ? mapLink(event) : ''}<button class="text-link" type="button" data-calendar="${e(event.id)}">${icon('calendar')}${event.start ? 'Add to calendar' : 'Save the date'}</button></div>
        </div>
      </article>`,
          )
          .join('')}
      </div>
    </section>
  `;
}
