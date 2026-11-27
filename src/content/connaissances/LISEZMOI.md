# Carte de connaissances — mode d'emploi

La page « Connaissances » du site (`/connaissances/`) affiche une carte interactive
construite à partir de deux sources, au format JSON v1 de la spécification
« instructions-ia-carte-connaissances.md » :

| Dossier | Contenu | Qui l'alimente |
|---|---|---|
| `graphes/*.json` | Graphes complets (nœuds, liens, groupes). Ex. `sfro-2026.json` : les 264 résumés du congrès SFRO 2026, 33 idées sourcées, 6 questions. | Import en lot (congrès, export d'une IA) |
| `fiches/*.md` | Une fiche de lecture par article, au format de votre modèle `fiche-source`. | Vous, au fil des lectures |

## Ajouter une fiche de lecture

1. Créez la fiche depuis le modèle :

   ```bash
   python3 outils/connaissances.py nouvelle-fiche "Meattini — 2026 — IDEAL" --groupe g-sein
   ```

   ou copiez `fiches/_modele.md` sous un nom court sans espace ni accent.
2. Remplissez l'en-tête (titre, auteurs, DOI, `synthese`) et le corps de la fiche.
3. Déclarez les idées à verser dans la carte sous `idees:` (une idée par élément,
   avec ses limites et, si besoin, des `liens` vers des nœuds existants, chacun justifié).
4. Vérifiez :

   ```bash
   python3 outils/connaissances.py valider
   ```

5. Publiez (commit + push). Au prochain déploiement, la fiche apparaît dans la carte,
   reliée à sa source et à ses idées, avec sa page de lecture complète.

Depuis Claude, il suffit de demander « ajoute cette fiche à ma carte de connaissances »
en joignant l'article ou vos notes : la fiche est créée dans ce dossier au même format.

## Statuts

- Tout ce qui est proposé (par l'IA ou un import) reste `proposed` jusqu'à votre validation.
- Pour valider : passez `statut_revue: accepted` dans la fiche (ou `review_status` dans le JSON).
- `accepted` signifie « accepté dans ma carte », pas « scientifiquement démontré ».
- Un lien `inferred` ou `exploratory` reste `proposed` tant que vous ne l'avez pas changé.

## Groupes disponibles

g-orl, g-sein, g-gyn, g-curie, g-prostate, g-snc, g-thorax, g-digestif, g-reirr, g-hypo,
g-ia, g-adapt, g-stereo, g-orga, g-inclusion, g-transla, g-systemique, g-tolerance,
g-physique, g-pedia, g-benin, g-support, g-qa, g-divers.
Pour en créer un nouveau, ajoutez-le dans la liste `groups` d'un fichier de `graphes/`.

## Exporter pour une IA

```bash
python3 outils/connaissances.py exporter -o carte-complete.json
```

Joignez `carte-complete.json` et la spécification à l'IA ; sa réponse (section 7 de la
spécification) se relit avant d'être intégrée, jamais appliquée directement.

## Contrôles automatiques

La construction du site échoue avec un message explicite si un identifiant est en double,
si un lien vise un nœud absent, si une relation n'existe pas dans la spécification ou si
une idée n'a pas de provenance.
