import { wedding } from '../config/wedding.js';
import { renderInvitation } from './render.js';
import { escapeHtml } from './utils.js';

export function prepareDocument(template) {
  const e = escapeHtml;
  const absoluteImage = new URL(wedding.site.previewImage, wedding.site.url).href;
  return template
    .replace('<!-- invitation -->', renderInvitation(wedding))
    .replace(/<title>.*?<\/title>/, `<title>${e(wedding.site.title)}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*/,
      (_, prefix) => prefix + e(wedding.site.description),
    )
    .replace(
      /(<meta property="og:title" content=")[^"]*/,
      (_, prefix) => prefix + e(wedding.site.title),
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*/,
      (_, prefix) => prefix + e(wedding.site.description),
    )
    .replace(
      /(<meta property="og:url" content=")[^"]*/,
      (_, prefix) => prefix + e(wedding.site.url),
    )
    .replace(/(<meta property="og:image" content=")[^"]*/, (_, prefix) => prefix + e(absoluteImage))
    .replace(/<html lang="[^"]*"/, `<html lang="${e(wedding.site.language)}"`);
}
