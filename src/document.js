import { wedding } from '../config/wedding.js';
import { renderInvitation } from './render.js';
import { assetUrl, escapeHtml } from './utils.js';

export function prepareDocument(template, { siteUrl = wedding.site.url } = {}) {
  const e = escapeHtml;
  const pageUrl = new URL(siteUrl);
  if (!pageUrl.pathname.endsWith('/')) pageUrl.pathname += '/';
  const logo = assetUrl(wedding.site.logo) || './assets/favicon.svg';
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
    .replace(/<link\b[^>]*\bdata-envelope-preload\b[^>]*>/i, () => {
      const sources = (wedding.envelope.imageSources || [])
        .map(({ src, width }) => `${assetUrl(src)} ${width}w`).join(', ');
      return `<link rel="preload" href="${e(assetUrl(wedding.envelope.image))}" as="image" fetchpriority="high"${sources ? ` imagesrcset="${e(sources)}" imagesizes="${e(wedding.envelope.imageSizes)}"` : ''} />`;
    })
    .replace(/<link\b[^>]*\brel=["']icon["'][^>]*>/i, () => `<link rel="icon" href="${e(logo)}" />`)
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
