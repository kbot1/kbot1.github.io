import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from './site.config';
import { ui } from './i18n';
import { getVeille } from './lib';

export async function veilleRss(context: APIContext, lang: 'fr' | 'en') {
  const items = await getVeille(lang);
  const prefix = lang === 'fr' ? '' : '/en';
  return rss({
    title: `${SITE.name} — ${ui[lang]['veille.title']}`,
    description: ui[lang]['veille.lead'],
    site: context.site!,
    items: items.map(({ entry, slug }) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: `${entry.data.summary} (${entry.data.journal})`,
      link: `${prefix}/veille/${slug}/`,
      categories: [ui[lang][`loc.${entry.data.localisation}` as const]],
    })),
    customData: `<language>${lang === 'fr' ? 'fr-fr' : 'en-gb'}</language>`,
  });
}
