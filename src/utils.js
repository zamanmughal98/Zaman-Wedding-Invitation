export function escapeHtml(value = '') {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

export function safeUrl(value, protocols = ['https:', 'http:']) {
  if (!value || typeof value !== 'string') return '';
  if (
    (value.startsWith('/') || value.startsWith('./')) &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !/[\u0000-\u001f\u007f]/.test(value)
  )
    return value;
  try {
    const url = new URL(value);
    return protocols.includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

// Local media belongs to this project, including when hosted below /repository/.
// Existing '/assets/...' configuration continues to work without being rewritten.
export function assetUrl(value) {
  const url = safeUrl(value);
  return url.startsWith('/') ? `.${url}` : url;
}

export function formatDate(value, site, options = {}) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(site.locale, {
    timeZone: dateOnly ? 'UTC' : site.timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(new Date(value));
}

export function formatTime(value, site) {
  return new Intl.DateTimeFormat(site.locale, {
    timeZone: site.timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value));
}

export function initials(wedding, separator = ' & ') {
  return wedding.couple.groom.initial + separator + wedding.couple.bride.initial;
}

export function coupleNames(wedding, separator = ' & ') {
  return wedding.couple.groom.name + separator + wedding.couple.bride.name;
}

export function eventDate(event) {
  return event.date || event.start;
}

export function eventTime(event, site) {
  return event.start
    ? formatTime(event.start, site)
    : event.timeLabel || 'Evening · Time to follow';
}

export function countdownParts(target, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  };
}

export function readStored(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function calendarFile(event, wedding) {
  const escape = (value) =>
    String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  const stamp = (value) =>
    new Date(value)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Invitation//Zaman and Nimra//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escape(wedding.id)}-${escape(event.id)}@wedding-invitation`,
    `DTSTAMP:${stamp(new Date())}`,
  ];
  if (event.start) {
    lines.push('DTSTART:' + stamp(event.start));
    if (event.end) lines.push('DTEND:' + stamp(event.end));
  } else {
    const day = eventDate(event);
    const next = new Date(day + 'T00:00:00Z');
    next.setUTCDate(next.getUTCDate() + 1);
    lines.push(
      'DTSTART;VALUE=DATE:' + day.replace(/-/g, ''),
      'DTEND;VALUE=DATE:' + next.toISOString().slice(0, 10).replace(/-/g, ''),
    );
  }
  const description = [event.description, !event.start ? event.timeLabel : '']
    .filter(Boolean)
    .join('\n');
  lines.push(
    `SUMMARY:${escape(coupleNames(wedding) + ' · ' + event.name)}`,
    `DESCRIPTION:${escape(description)}`,
    `LOCATION:${escape([event.venue, event.address].filter(Boolean).join(', '))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  );
  const fold = (line) => {
    let result = '',
      width = 0;
    for (const character of line) {
      const size = new TextEncoder().encode(character).length;
      if (width + size > 75) {
        result += '\r\n ';
        width = 1;
      }
      result += character;
      width += size;
    }
    return result;
  };
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = Object.assign(document.createElement('a'), { href: url, download: filename });
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
