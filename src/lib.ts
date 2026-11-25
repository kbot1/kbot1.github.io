import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from './site.config';

export type Travail = CollectionEntry<'travaux'>;

export async function getTravaux(types?: Travail['data']['type'][]) {
  const all = await getCollection('travaux');
  return all
    .filter((e) => !SITE.hiddenTypes.includes(e.data.type))
    .filter((e) => !types || types.includes(e.data.type))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getPosts(lang?: 'fr' | 'en') {
  const all = await getCollection('blog', (e) => !e.data.draft);
  return all
    .filter((e) => !lang || e.data.lang === lang)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Transforme un lien vidéo en lecteur intégrable */
export function videoEmbed(url: string): { kind: 'iframe' | 'file'; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { kind: 'file', src: url };
}

export function youtubeThumb(url: string): string | undefined {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : undefined;
}

/** Citation au format Vancouver */
export function vancouver(d: Travail['data']): string {
  const authors = d.authors.length > 6 ? d.authors.slice(0, 6).join(', ') + ', et al' : d.authors.join(', ');
  const year = d.date.getFullYear();
  let s = `${authors}. ${d.title.replace(/\.$/, '')}. ${d.venue}`;
  if (d.type === 'article') s += `. ${year}${d.volume ? ';' + d.volume.replace(/^\d{4};?/, '') : ''}.`;
  else s += `${d.location ? ', ' + d.location : ''}; ${year}.`;
  if (d.doi) s += ` doi:${d.doi}`;
  if (d.pmid) s += ` PMID: ${d.pmid}`;
  return s;
}

export function isPdf(p?: string) {
  return !!p && /\.pdf($|\?)/i.test(p);
}

export type Billet = CollectionEntry<'veille'>;

/** Billets de veille d'une langue, du plus récent au plus ancien. slug = nom du fichier sans le dossier de langue. */
export async function getVeille(lang: 'fr' | 'en') {
  const all = await getCollection('veille', (e) => e.id.startsWith(`${lang}/`));
  return all
    .map((e) => ({ entry: e, slug: e.id.replace(/^(fr|en)\//, '') }))
    .sort((a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime());
}
