# kbot1.github.io

Site personnel de Kevin Berthelot (oncologie-radiothérapie), construit avec [Astro](https://astro.build) et publié automatiquement sur GitHub Pages à chaque modification de la branche principale.

Page d'accueil : veille bibliographique en radiothérapie ORL, sein et gynécologique (un billet par article, filtres, flux RSS `/rss.xml`). Bilingue français / anglais (`/` et `/en/`), thème clair / sombre.

## Ajouter du contenu (directement depuis GitHub, sans rien installer)

Sur github.com, ouvrez le dossier voulu, cliquez sur **Add file → Create new file** (ou **Upload files** pour les images, PDF et vidéos), puis **Commit changes**. Le site se met à jour en 1 à 2 minutes (onglet **Actions**).

| Je veux ajouter… | Où | Comment |
|---|---|---|
| Un **billet de veille** (page d'accueil) | `src/content/veille/fr/` et `src/content/veille/en/` | Copier un billet existant, **même nom de fichier** dans les deux dossiers. Champs : `localisation` (orl, sein, gyn), `impact` (fort, modere), `date` = date de publication de l'article |
| Une **revue de la littérature** (rubrique Revues) | `src/content/revues/` | Copier une revue existante. Champs : `title`, `date`, `summary`, `serie` (facultatif, regroupe plusieurs revues), `ordre` (position dans la série) |
| Mes infos (bio, liens ORCID, PubMed, e-mail, photo) | `src/site.config.ts` | Modifier les champs |
| Un **article** | `src/content/travaux/` | Copier `2025-exemple-article.md`, `type: article` |
| Un **poster** | `src/content/travaux/` + image dans `public/posters/` | `type: poster`, `poster: /posters/mon-poster.jpg` |
| Une **communication orale** | `src/content/travaux/` + PDF dans `public/pdf/` | `type: oral`, `slides:` et/ou `video:` |
| Un **résumé de congrès** | `src/content/travaux/` | `type: resume`, le texte du résumé sous l'en-tête |
| Une **carte mentale** | `src/content/cartes/` | Liste Markdown : `#` sujet, `##` branches, puces pour les sous-niveaux |
| Une **photo / vidéo** | fichier dans `public/galerie/` + entrée dans `src/content/galerie.yaml` | `kind: photo` ou `video` (lien YouTube, Vimeo ou `.mp4`) |
| Un **billet de blog** | `src/content/blog/` | `lang: fr` ou `en`, `draft: true` pour un brouillon |

### Champs d'un travail (`src/content/travaux/*.md`)

```yaml
---
type: article            # article | poster | oral | resume
title: "Titre original"
title_en: "English title"  # facultatif
authors: ["Berthelot K", "Dupont A"]
date: 2025-10-08
venue: "Congrès de la SFRO"  # revue ou congrès
location: "Paris"            # facultatif
volume: "2025;29(2):101-8"   # articles
doi: "10.xxxx/xxxx"
pmid: "12345678"
pdf: /pdf/fichier.pdf
poster: /posters/poster.jpg
slides: /pdf/diapos.pdf      # ou lien Google Slides / SpeakerDeck
video: https://youtu.be/xxxxxxxxxxx
tags: ["sein", "dosimétrie"]
---
Texte du résumé (Markdown).
```

Les fichiers d'exemple portent `example: true` et un badge rouge « Exemple – à remplacer » : supprimez-les quand vous ajoutez vos vrais travaux.

> Vidéos : GitHub refuse les fichiers de plus de 100 Mo. Pour les vidéos longues, utilisez un lien YouTube (même « non répertorié »).

## Travailler en local (facultatif)

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # génère dist/
```

## Mise en ligne

Dans **Settings → Pages**, la source doit être **GitHub Actions**. Le workflow `.github/workflows/deploy.yml` construit et publie le site.

L'ancien site Jekyll reste consultable dans l'historique git.
