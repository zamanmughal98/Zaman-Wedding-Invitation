import { coupleNames } from './utils.js';

export function responseMessage(w, kind, entry) {
  const lines = [
    kind === 'wish'
      ? 'A wedding wish for ' + coupleNames(w)
      : 'Wedding attendance for ' + coupleNames(w),
    'From: ' + entry.name,
  ];
  if (kind === 'rsvp') {
    lines.push(
      entry.attendance === 'yes'
        ? 'Joyfully accepting for ' + entry.guests + ' guest(s).'
        : 'Unable to attend, with love and duas.',
    );
    if (entry.events.length)
      lines.push(
        'Celebrations: ' +
          entry.events
            .map((id) => w.events.find((event) => event.id === id)?.name)
            .filter(Boolean)
            .join(', '),
      );
    if (entry.contact) lines.push('Contact: ' + entry.contact);
  }
  if (entry.message) lines.push(entry.message);
  return lines.join('\n');
}

export function emailAppUrl(w, kind, entry) {
  const recipient = w.responses?.email;
  if (!recipient || /[\s?&#]/.test(recipient)) return '';
  const subject =
    coupleNames(w) + (kind === 'wish' ? ' | A wedding wish' : ' | Attendance response');
  return (
    'mailto:' +
    recipient +
    '?subject=' +
    encodeURIComponent(subject) +
    '&body=' +
    encodeURIComponent(responseMessage(w, kind, entry))
  );
}

export function whatsappUrl(w, kind, entry) {
  const phone = w.rsvp.contactPhone?.replace(/\D/g, '');
  return phone
    ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(responseMessage(w, kind, entry))
    : '';
}
