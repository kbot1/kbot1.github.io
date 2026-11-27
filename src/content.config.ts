import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * TRAVAUX : articles, posters, communications orales, résumés de congrès.
 * Un fichier Markdown par travail dans src/content/travaux/.
 * Le texte sous l'en-tête (---) est le résumé (abstract).
 */
const travaux = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/travaux' }),
  schema: z.object({
    type: z.enum(['article', 'poster', 'oral', 'resume']),
    title: z.string(),
    title_en: z.string().optional(),
    authors: z.array(z.string()).default([]),
    date: z.coerce.date(),
    datePrecision: z.enum(['year', 'month', 'day']).optional(), // précision de la date affichée
    venue: z.string(), // revue ou congrès
    location: z.string().optional(), // ville du congrès
    volume: z.string().optional(), // ex. « 2024;12(3):45-52 »
    doi: z.string().optional(),
    pmid: z.string().optional(),
    url: z.string().optional(), // lien externe
    pdf: z.string().optional(), // ex. /pdf/mon-article.pdf
    poster: z.string().optional(), // image du poster, ex. /posters/poster.jpg
    slides: z.string().optional(), // PDF du diaporama ou lien (Google Slides, SpeakerDeck…)
    video: z.string().optional(), // lien YouTube / Vimeo ou fichier .mp4
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    example: z.boolean().default(false),
  }),
});

/** BLOG : billets en français ou en anglais. */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    lang: z.enum(['fr', 'en']).default('fr'),
    summary: z.string().default(''),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * CARTES MENTALES : le contenu est une liste Markdown à puces / titres,
 * transformée en carte interactive.
 */
const cartes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cartes' }),
  schema: z.object({
    title: z.string(),
    title_en: z.string().optional(),
    description: z.string().default(''),
    description_en: z.string().optional(),
    date: z.coerce.date(),
    featured: z.boolean().default(false),
    expandLevel: z.number().default(2),
  }),
});

/** GALERIE : photos et vidéos, listées dans src/content/galerie.yaml */
const galerie = defineCollection({
  loader: file('./src/content/galerie.yaml'),
  schema: z.object({
    kind: z.enum(['photo', 'video']).default('photo'),
    src: z.string(), // /galerie/photo.jpg, lien YouTube ou .mp4
    thumb: z.string().optional(), // vignette (facultatif pour les photos)
    title: z.string(),
    title_en: z.string().optional(),
    caption: z.string().optional(),
    caption_en: z.string().optional(),
    album: z.string().default('Divers'),
    date: z.coerce.date().optional(),
  }),
});

/**
 * VEILLE : un billet par publication marquante, dans src/content/veille/fr/ et /en/.
 * Le même nom de fichier dans les deux dossiers relie la version française et anglaise.
 */
const veille = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/veille' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(), // date de publication de l'article
    datePrecision: z.enum(['day', 'month']).default('day'), // 'month' si seul le mois du numéro est connu
    localisation: z.enum(['orl', 'sein', 'gyn']),
    impact: z.enum(['fort', 'modere']),
    etude: z.string().optional(), // acronyme de l'essai
    type: z.string(), // ex. « Phase 3 randomisée »
    journal: z.string(),
    citation: z.string(), // référence complète
    doi: z.string().optional(),
    pmid: z.string().optional(),
    url: z.string().optional(),
    summary: z.string(), // message clé en une phrase
    tags: z.array(z.string()).default([]),
  }),
});

/**
 * REVUES : revues de la littérature thématiques, en français.
 * Un fichier Markdown par revue dans src/content/revues/.
 * `serie` regroupe plusieurs revues d'un même dossier ; `ordre` fixe leur ordre dans la série.
 */
const revues = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/revues' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    serie: z.string().optional(),
    ordre: z.number().default(0),
    localisation: z.enum(['orl', 'sein', 'gyn']).optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});


/**
 * FICHES DE LECTURE : bibliothèque de connaissances.
 * Un fichier Markdown par article lu, dans src/content/connaissances/fiches/
 * (modèle : _modele.md, ignoré car son nom commence par « _ »).
 * Chaque fiche devient un nœud « fiche_source » de la carte de connaissances,
 * relié à sa source et aux idées déclarées dans `idees`.
 */
const lien = z.object({
  vers: z.string(),
  relation: z.enum(['soutient', 'contredit', 'nuance', 'precise', 'analogue_a', 'mobilise', 'utilise']),
  justification: z.string(),
  base: z.enum(['explicit', 'inferred', 'exploratory']).default('inferred'),
});
const vide = (v: unknown) => (v === null || v === '' ? undefined : v);
const fiches = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/connaissances/fiches' }),
  schema: z.object({
    type: z.literal('fiche-source').default('fiche-source'),
    titre: z.string(),
    statut: z.string().default('a-lire'),
    statut_revue: z.enum(['proposed', 'accepted', 'rejected']).default('proposed'),
    date_lecture: z.preprocess(vide, z.coerce.date().optional()),
    auteurs: z.preprocess(vide, z.string().optional()),
    annee: z.preprocess(vide, z.coerce.string().optional()),
    revue: z.preprocess(vide, z.string().optional()),
    doi: z.preprocess(vide, z.string().optional()),
    pmid: z.preprocess(vide, z.coerce.string().optional()),
    url: z.preprocess(vide, z.string().optional()),
    type_etude: z.preprocess(vide, z.string().optional()),
    pathologie: z.preprocess(vide, z.string().optional()),
    projet: z.preprocess(vide, z.string().optional()),
    synthese: z.preprocess(vide, z.string().optional()),
    groupes: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    idees: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/, 'identifiant en minuscules, chiffres et tirets'),
          titre: z.string(),
          texte: z.string(),
          type: z.enum(['idee', 'hypothese', 'question']).default('idee'),
          origine: z.enum(['source_reported', 'author_interpretation', 'user_interpretation', 'ai_inference']).default('source_reported'),
          statut_epistemique: z.enum(['reported', 'hypothesis', 'disputed', 'not_applicable']).default('reported'),
          statut_revue: z.enum(['proposed', 'accepted', 'rejected']).default('proposed'),
          localisation: z.preprocess(vide, z.string().optional()),
          extrait: z.preprocess(vide, z.string().optional()),
          limites: z.array(z.string()).default([]),
          groupes: z.array(z.string()).default([]),
          tags: z.array(z.string()).default([]),
          liens: z.array(lien).default([]),
        }),
      )
      .default([]),
  }),
});

export const collections = { travaux, blog, cartes, galerie, veille, revues, fiches };
