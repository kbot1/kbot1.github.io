export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const ui = {
  fr: {
    'nav.home': 'Accueil',
    'nav.publications': 'Publications',
    'nav.congres': 'Congrès',
    'nav.cartes': 'Cartes mentales',
    'nav.galerie': 'Galerie',
    'nav.blog': 'Blog',
    'type.article': 'Article',
    'type.poster': 'Poster',
    'type.oral': 'Communication orale',
    'type.resume': 'Résumé',
    'all': 'Tout',
    'search': 'Rechercher (titre, auteur, revue, mot-clé)…',
    'year': 'Année',
    'allYears': 'Toutes les années',
    'noResult': 'Aucun résultat.',
    'results': 'résultat(s)',
    'cite': 'Citer',
    'copied': 'Copié !',
    'abstract': 'Résumé',
    'poster': 'Poster',
    'slides': 'Diaporama',
    'video': 'Vidéo',
    'pdf': 'PDF',
    'openPdf': 'Ouvrir le PDF',
    'back': 'Retour',
    'example': 'Exemple – à remplacer',
    'latestPubs': 'Dernières publications',
    'latestTalks': 'Dernières interventions en congrès',
    'seeAll': 'Tout voir',
    'featuredMap': 'Carte mentale à la une',
    'latestPosts': 'Derniers billets',
    'stats.articles': 'articles',
    'stats.posters': 'posters',
    'stats.orals': 'communications orales',
    'stats.resumes': 'résumés',
    'pubs.intro': 'Articles publiés dans des revues scientifiques. Filtrez par année ou recherchez un mot-clé.',
    'congres.intro': 'Posters, communications orales et résumés présentés en congrès.',
    'cartes.intro': 'Cartes mentales interactives : cliquez sur un nœud pour le déplier, faites glisser pour vous déplacer, molette pour zoomer.',
    'galerie.intro': 'Photos et vidéos : congrès, enseignement, vie du service.',
    'blog.intro': 'Billets, notes de lecture et réflexions.',
    'mm.fit': 'Recentrer',
    'mm.expand': 'Tout déplier',
    'mm.collapse': 'Replier',
    'mm.full': 'Plein écran',
    'theme': 'Changer de thème',
    'menu': 'Menu',
    'prev': 'Précédent',
    'next': 'Suivant',
    'close': 'Fermer',
    'readMore': 'Lire',
    'zoomHint': 'Cliquez sur le poster pour l’agrandir.',
    'footer': 'Site construit avec Astro et hébergé sur GitHub Pages.',
  },
  en: {
    'nav.home': 'Home',
    'nav.publications': 'Publications',
    'nav.congres': 'Conferences',
    'nav.cartes': 'Mind maps',
    'nav.galerie': 'Gallery',
    'nav.blog': 'Blog',
    'type.article': 'Article',
    'type.poster': 'Poster',
    'type.oral': 'Oral presentation',
    'type.resume': 'Abstract',
    'all': 'All',
    'search': 'Search (title, author, journal, keyword)…',
    'year': 'Year',
    'allYears': 'All years',
    'noResult': 'No results.',
    'results': 'result(s)',
    'cite': 'Cite',
    'copied': 'Copied!',
    'abstract': 'Abstract',
    'poster': 'Poster',
    'slides': 'Slides',
    'video': 'Video',
    'pdf': 'PDF',
    'openPdf': 'Open PDF',
    'back': 'Back',
    'example': 'Example – replace me',
    'latestPubs': 'Latest publications',
    'latestTalks': 'Latest conference contributions',
    'seeAll': 'See all',
    'featuredMap': 'Featured mind map',
    'latestPosts': 'Latest posts',
    'stats.articles': 'articles',
    'stats.posters': 'posters',
    'stats.orals': 'oral presentations',
    'stats.resumes': 'abstracts',
    'pubs.intro': 'Articles published in scientific journals. Filter by year or search for a keyword.',
    'congres.intro': 'Posters, oral presentations and abstracts presented at conferences.',
    'cartes.intro': 'Interactive mind maps: click a node to expand it, drag to pan, scroll to zoom.',
    'galerie.intro': 'Photos and videos: conferences, teaching, department life.',
    'blog.intro': 'Posts, reading notes and reflections.',
    'mm.fit': 'Fit',
    'mm.expand': 'Expand all',
    'mm.collapse': 'Collapse',
    'mm.full': 'Full screen',
    'theme': 'Toggle theme',
    'menu': 'Menu',
    'prev': 'Previous',
    'next': 'Next',
    'close': 'Close',
    'readMore': 'Read',
    'zoomHint': 'Click the poster to enlarge it.',
    'footer': 'Built with Astro, hosted on GitHub Pages.',
  },
} as const;

export type UiKey = keyof (typeof ui)['fr'];

export function useT(lang: Lang) {
  return (key: UiKey): string => ui[lang][key] ?? ui.fr[key];
}

export function langFromParam(p?: string): Lang {
  return p === 'en' ? 'en' : 'fr';
}

/** Chemins statiques pour les deux langues : / (fr) et /en/ */
export function langPaths() {
  return [{ params: { lang: undefined } }, { params: { lang: 'en' } }];
}

/** Construit un lien localisé. p commence par / */
export function href(lang: Lang, p: string): string {
  return lang === 'fr' ? p : `/en${p}`;
}

/** Retire le préfixe de langue d'un chemin */
export function stripLang(pathname: string): string {
  return pathname.replace(/^\/en(\/|$)/, '/');
}

/** Champ traduit : prend `field_en` en anglais s'il existe */
export function tr<T extends Record<string, any>>(data: T, field: string, lang: Lang): string {
  if (lang === 'en' && data[`${field}_en`]) return data[`${field}_en`];
  return data[field] ?? '';
}

export function fmtDate(d: Date, lang: Lang, style: 'long' | 'month' | 'year' = 'long'): string {
  const opts: Intl.DateTimeFormatOptions =
    style === 'year' ? { year: 'numeric' } : style === 'month' ? { year: 'numeric', month: 'long' } : { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', opts);
}
