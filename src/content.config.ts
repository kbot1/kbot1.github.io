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

export const collections = { travaux, blog, cartes, galerie, veille, revues };
