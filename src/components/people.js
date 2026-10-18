import { assetUrl, escapeHtml as e, safeUrl } from '../utils.js';
import { flourish } from './artwork.js';
import { heading } from './shared.js';

// Keep both names on matching lines, regardless of the portrait or screen width.
function nameLines(fullName) {
  const words = fullName.trim().split(/\s+/);
  return [words.shift(), words.join(' ')].filter(Boolean);
}

export function couple(w) {
  return /* HTML */ `
    <section class="section couple-section" id="couple">
      ${heading('Two hearts. One beautiful beginning.', 'The blessed couple')}
      <div class="couple-grid">
        ${[
          ['groom', 'The groom'],
          ['bride', 'The bride'],
        ]
          .map(([key, role]) => {
            const person = w.couple[key];
            const social = safeUrl(person.social);
            const image = assetUrl(person.photo);
            return /* HTML */ `
              <article class="person reveal">
                <div class="portrait-arch">
                  <span class="portrait-initial" aria-hidden="true">${e(person.initial)}</span>
                  ${
                    image
                      ? `<img src="${e(image)}" alt="${e(person.photoAlt || person.fullName)}" loading="lazy" decoding="async" style="object-position:${e(person.photoPosition)}" data-portrait-photo />`
                      : ''
                  }
                  <span class="portrait-ornament" aria-hidden="true">✧</span>
                </div>
                <p class="eyebrow">${role}</p>
                <h3 class="person-name" aria-label="${e(person.fullName)}">
                  ${nameLines(person.fullName)
                    .map((line) => `<span>${e(line)}</span>`)
                    .join(' ')}
                </h3>
                ${person.parents ? `<p class="person-parents">${e(person.parents)}</p>` : ''}
                ${person.bio ? `<p class="person-bio">${e(person.bio)}</p>` : ''}
                ${social ? `<a class="text-link" href="${e(social)}" target="_blank" rel="noopener noreferrer">A little more about ${e(person.name)}</a>` : ''}
              </article>
            `;
          })
          .join('')}
      </div>
      ${flourish()}
      ${w.couple.quote ? `<p class="couple-quote reveal">“${e(w.couple.quote)}”</p>` : ''}
    </section>
  `;
}

export function families(w) {
  return /* HTML */ `
    <section class="section families-section" id="families">
      ${heading('Pillars of love & blessings', 'Our beloved families', 'Two families, brought together by a beautiful promise.')}
      <div class="family-grid">
        ${w.families
          .map(
            (family) => /* HTML */ `
              <article class="family-card reveal">
                <span class="family-ornament" aria-hidden="true">✦</span>
                <p class="eyebrow">${e(family.label)}</p>
                <h3>${e(family.name)}</h3>
                <p class="family-message">${e(family.message)}</p>
                <ul>
                  ${family.members
                    .map(
                      (member) => /* HTML */ `
                        <li>
                          <span>${e(member.role)}</span>
                          <p>${e(member.name)}</p>
                        </li>
                      `,
                    )
                    .join('')}
                </ul>
              </article>
            `,
          )
          .join('')}
      </div>
      <p class="family-union reveal">Bound by love. Blessed with duas.</p>
    </section>
  `;
}
