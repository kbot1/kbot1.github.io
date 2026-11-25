// ─────────────────────────────────────────────────────────────
//  Informations personnelles : modifiez ce fichier en premier.
// ─────────────────────────────────────────────────────────────

export const SITE = {
  // Types de travaux masqués sur tout le site : 'article' | 'poster' | 'oral' | 'resume'.
  // Retirez 'oral' de la liste pour réafficher les communications orales.
  hiddenTypes: ['oral'] as string[],
  name: 'Kevin Berthelot',
  initials: 'KB',
  // Photo de profil : déposez un fichier dans /public (ex. /portrait.jpg)
  // et indiquez son chemin ici. Laissez vide pour afficher les initiales.
  portrait: '/portrait.jpg',
  portraitMini: '/portrait-mini.jpg',
  role: {
    fr: 'MD, MSc · Oncologue-radiothérapeute au Centre de radiothérapie de Saint-Germain-en-Laye',
    en: 'MD, MSc · Radiation oncologist at the Saint-Germain-en-Laye Radiotherapy Center',
  },
  bio: {
    fr: "Ce site rassemble mes travaux en oncologie-radiothérapie : articles scientifiques, posters et résumés de congrès, ainsi que des cartes mentales interactives, des photos et des vidéos.",
    en: 'This site gathers my work in radiation oncology: scientific articles, posters and conference abstracts, along with interactive mind maps, photos and videos.',
  },
  // Votre nom tel qu'il apparaît dans les listes d'auteurs : il sera mis en gras.
  authorName: 'Berthelot K',
  email: '',
  links: [
    { label: 'GitHub', url: 'https://github.com/kbot1' },
    { label: 'X / Twitter', url: 'https://twitter.com/KBerthelot_MD' },
    { label: 'ORCID', url: '' },
    { label: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Berthelot+Kevin%5BAuthor%5D+OR+(Berthelot+K%5BAuthor%5D+AND+(radiotherapy+OR+radiation))' },
    { label: 'Google Scholar', url: '' },
    { label: 'LinkedIn', url: '' },
  ],
};
