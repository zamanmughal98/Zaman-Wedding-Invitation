/** Only a deployed Apps Script URL belongs in public site configuration. */
export function wishesWidgetUrl(w) {
  const value = w.wishes.googleScriptUrl?.trim();
  if (!value) return '';
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value)) {
    throw new Error(
      'wishes.googleScriptUrl must be a deployed Google Apps Script /exec URL without a private key.',
    );
  }
  return value + '?view=wall';
}
