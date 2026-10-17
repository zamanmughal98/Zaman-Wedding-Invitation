import { wedding } from '../config/wedding.js';
import { renderInvitation } from './render.js';
import { assetUrl, escapeHtml } from './utils.js';

export function prepareDocument(template, { siteUrl = wedding.site.url } = {}) {
  const e = escapeHtml;
  const pageUrl = new URL(siteUrl);
  if (!pageUrl.pathname.endsWith('/')) pageUrl.pathname += '/';
  const absoluteImage = new URL(assetUrl(wedding.site.previewImage), pageUrl).href;
  const metadata = {
    description: wedding.site.description,
    'og:title': wedding.site.title,
    'og:description': wedding.site.description,
    'og:url': pageUrl.href,
    'og:image': absoluteImage,
  };
  return template
    .replace('<!-- invitation -->', renderInvitation(wedding))
    .replace(/<title>.*?<\/title>/, `<title>${e(wedding.site.title)}</title>`)
    .replace(/<meta\b[^>]*>/gi, (tag) => {
      const key = tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i)?.[1];
      if (!Object.hasOwn(metadata, key)) return tag;
      return tag.replace(
        /\bcontent\s*=\s*(["'])[\s\S]*?\1/i,
        () => `content="${e(metadata[key])}"`,
      );
    })
    .replace(/<html lang="[^"]*"/, `<html lang="${e(wedding.site.language)}"`);
}
