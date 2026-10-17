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
  return new Intl.DateTimeFormat(site.locale, {
    timeZone: site.timeZone,
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
  return `${wedding.couple.bride.initial}${separator}${wedding.couple.groom.initial}`;
}

export function coupleNames(wedding, separator = ' & ') {
  return `${wedding.couple.bride.name}${separator}${wedding.couple.groom.name}`;
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
    String(value)
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
    'PRODID:-//Ivory Garden//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escape(wedding.id)}-${escape(event.id)}@wedding-invitation`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escape(`${coupleNames(wedding)} · ${event.name}`)}`,
    `DESCRIPTION:${escape(event.description)}`,
    `LOCATION:${escape([event.venue, event.address].filter(Boolean).join(', '))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  // RFC 5545 folds at 75 UTF-8 octets, not at 75 JavaScript characters.
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
