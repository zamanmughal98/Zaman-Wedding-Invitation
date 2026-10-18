/** Public uploader address only; Drive folder IDs and upload keys stay out of configuration. */
export function photoUploadUrl(w) {
  const value = w.photos?.googleScriptUrl?.trim();
  if (!value) return '';
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value))
    throw new Error(
      'photos.googleScriptUrl must be a public Google Apps Script /exec URL without queries or private keys.',
    );
  return value;
}
