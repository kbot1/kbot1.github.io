/**
 * Carte de connaissances — assemblage et validation au moment de la construction.
 *
 * Sources de données :
 *   1. src/content/connaissances/graphes/*.json : graphes au format JSON v1
 *      (spécification « instructions-ia-carte-connaissances.md »).
 *   2. src/content/connaissances/fiches/*.md : fiches de lecture. Chaque fiche
 *      ajoute un nœud « source », un nœud « fiche_source » et ses idées.
 *
 * Les erreurs de contrat (identifiant en double, lien vers un nœud absent,
 * valeur hors liste) arrêtent la construction du site avec un message explicite.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export const NODE_TYPES = [
  'source', 'fiche_source', 'idee', 'question', 'hypothese',
  'projet', 'competence', 'prompt', 'livrable', 'retour',
] as const;
export const RELATIONS = [
  'documente', 'extrait_de', 'soutient', 'contredit', 'nuance', 'precise', 'analogue_a',
  'interroge', 'mobilise', 'utilise', 'produit_dans', 'evalue', 'ameliore',
] as const;
const ORIGINS = ['source_reported', 'author_interpretation', 'user_interpretation', 'ai_inference', 'not_applicable'];
const REVIEW = ['proposed', 'accepted', 'rejected'];
const EPISTEMIC = ['reported', 'hypothesis', 'disputed', 'not_applicable'];
const BASIS = ['explicit', 'inferred', 'exploratory'];

export type Provenance = { document_id: string; locator: string | null; excerpt: string | null };
export type KNode = {
  id: string;
  type: (typeof NODE_TYPES)[number];
  title: string;
  text: string;
  origin: string;
  review_status: string;
  epistemic_status: string;
  provenance: Provenance[];
  limits: string[];
  tags: string[];
  group_ids: string[];
  metadata: Record<string, unknown>;
};
export type KEdge = {
  id: string;
  source: string;
  target: string;
  relation: (typeof RELATIONS)[number];
  rationale: string;
  provenance: Provenance[];
  review_status: string;
  evidence_basis: string;
};
export type KGroup = { id: string; label: string; description: string; member_ids: string[]; review_status: string };
export type Graph = {
  schema_version: string;
  revision: number;
  title?: string;
  description?: string;
  nodes: KNode[];
  edges: KEdge[];
  groups: KGroup[];
};

const graphFiles = import.meta.glob<Graph>('./content/connaissances/graphes/*.json', { eager: true, import: 'default' });

type Fiche = CollectionEntry<'fiches'>;

/** Transforme une fiche de lecture en nœuds et liens du graphe. */
function ficheToGraph(f: Fiche): { nodes: KNode[]; edges: KEdge[] } {
  const d = f.data;
  const slug = f.id.replace(/\.md$/, '');
  const srcId = `src-${slug}`;
  const ficheId = `fiche-${slug}`;
  const ref = [d.auteurs, d.annee, d.revue].filter(Boolean).join(' — ');
  const nodes: KNode[] = [
    {
      id: srcId,
      type: 'source',
      title: d.titre,
      text: ref || 'Référence à compléter dans la fiche.',
      origin: 'not_applicable',
      review_status: d.statut_revue,
      epistemic_status: 'not_applicable',
      provenance: [],
      limits: [],
      tags: d.tags,
      group_ids: d.groupes,
      metadata: {
        doi: d.doi ?? null,
        pmid: d.pmid ?? null,
        url: d.url ?? (d.doi ? `https://doi.org/${d.doi}` : d.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${d.pmid}/` : null),
        source_date: d.annee ?? null,
        study_type: d.type_etude ?? null,
      },
    },
    {
      id: ficheId,
      type: 'fiche_source',
      title: `Fiche de lecture — ${d.titre}`,
      text: d.synthese ?? 'Voir la fiche complète.',
      origin: 'user_interpretation',
      review_status: d.statut_revue,
      epistemic_status: 'not_applicable',
      provenance: [{ document_id: srcId, locator: null, excerpt: null }],
      limits: [],
      tags: [...d.tags, `statut:${d.statut}`],
      group_ids: d.groupes,
      metadata: { fiche: slug, statut_lecture: d.statut, date_lecture: d.date_lecture?.toISOString().slice(0, 10) ?? null, projet: d.projet ?? null },
    },
  ];
  const edges: KEdge[] = [
    {
      id: `e-${slug}-documente`,
      source: srcId,
      target: ficheId,
      relation: 'documente',
      rationale: 'La fiche décrit ce document.',
      provenance: [],
      review_status: d.statut_revue,
      evidence_basis: 'explicit',
    },
  ];
  for (const i of d.idees) {
    const type = i.type === 'hypothese' ? 'hypothese' : i.type;
    nodes.push({
      id: i.id,
      type,
      title: i.titre,
      text: i.texte,
      origin: i.origine,
      review_status: i.statut_revue,
      epistemic_status: i.statut_epistemique,
      provenance: [{ document_id: ficheId, locator: i.localisation ?? null, excerpt: i.extrait ?? null }],
      limits: i.limites,
      tags: i.tags,
      group_ids: i.groupes.length ? i.groupes : d.groupes,
      metadata: {},
    });
    edges.push({
      id: `e-${i.id}-extrait`,
      source: i.id,
      target: ficheId,
      relation: 'extrait_de',
      rationale: 'Proposition extraite de cette fiche de lecture.',
      provenance: [{ document_id: ficheId, locator: i.localisation ?? null, excerpt: null }],
      review_status: i.statut_revue,
      evidence_basis: 'explicit',
    });
    i.liens.forEach((l, k) =>
      edges.push({
        id: `e-${i.id}-${k + 1}`,
        source: i.id,
        target: l.vers,
        relation: l.relation,
        rationale: l.justification,
        provenance: [{ document_id: ficheId, locator: i.localisation ?? null, excerpt: null }],
        // un lien inféré ou exploratoire reste « proposé » tant que vous ne l'avez pas validé
        review_status: l.base === 'explicit' ? i.statut_revue : 'proposed',
        evidence_basis: l.base,
      }),
    );
  }
  return { nodes, edges };
}

function fail(msg: string): never {
  throw new Error(`[carte de connaissances] ${msg}`);
}

/** Vérifications d'acceptation de la spécification (section 11). */
function validate(g: Graph) {
  const ids = new Set<string>();
  for (const n of g.nodes) {
    if (ids.has(n.id)) fail(`identifiant de nœud en double : « ${n.id} »`);
    ids.add(n.id);
    if (!NODE_TYPES.includes(n.type)) fail(`type inconnu « ${n.type} » pour le nœud ${n.id}`);
    if (!ORIGINS.includes(n.origin)) fail(`origin invalide pour ${n.id}`);
    if (!REVIEW.includes(n.review_status)) fail(`review_status invalide pour ${n.id}`);
    if (!EPISTEMIC.includes(n.epistemic_status)) fail(`epistemic_status invalide pour ${n.id}`);
    if (['idee'].includes(n.type) && n.provenance.length === 0) fail(`l'idée ${n.id} n'a pas de provenance`);
  }
  const groupIds = new Set(g.groups.map((x) => x.id));
  for (const n of g.nodes) for (const gid of n.group_ids) if (!groupIds.has(gid)) fail(`le nœud ${n.id} référence un groupe absent : ${gid}`);
  const eids = new Set<string>();
  const pairs = new Set<string>();
  for (const e of g.edges) {
    if (eids.has(e.id)) fail(`identifiant de lien en double : « ${e.id} »`);
    eids.add(e.id);
    if (!ids.has(e.source)) fail(`le lien ${e.id} part d'un nœud absent : ${e.source}`);
    if (!ids.has(e.target)) fail(`le lien ${e.id} vise un nœud absent : ${e.target}`);
    if (!RELATIONS.includes(e.relation)) fail(`relation inconnue « ${e.relation} » (lien ${e.id})`);
    if (!BASIS.includes(e.evidence_basis)) fail(`evidence_basis invalide (lien ${e.id})`);
    if (!e.rationale?.trim()) fail(`le lien ${e.id} n'a pas de justification`);
    if (e.relation === 'analogue_a') {
      const key = [e.source, e.target].sort().join('|');
      if (pairs.has(key)) fail(`relation analogue_a en double entre ${e.source} et ${e.target}`);
      pairs.add(key);
    }
  }
}

let cache: Graph | undefined;

/** Graphe complet : tous les graphes JSON + toutes les fiches, validé. */
export async function getKnowledgeGraph(): Promise<Graph> {
  if (cache) return cache;
  const merged: Graph = { schema_version: '1.0', revision: 0, nodes: [], edges: [], groups: [] };
  for (const g of Object.values(graphFiles)) {
    merged.revision = Math.max(merged.revision, g.revision ?? 0);
    merged.nodes.push(...g.nodes);
    merged.edges.push(...g.edges);
    for (const gr of g.groups) {
      const existing = merged.groups.find((x) => x.id === gr.id);
      if (existing) existing.member_ids.push(...gr.member_ids);
      else merged.groups.push({ ...gr, member_ids: [...gr.member_ids] });
    }
  }
  const fiches = await getCollection('fiches');
  for (const f of fiches) {
    const { nodes, edges } = ficheToGraph(f);
    merged.nodes.push(...nodes);
    merged.edges.push(...edges);
  }
  // Les groupes déclarés dans les fiches enrichissent la liste des membres.
  for (const n of merged.nodes)
    for (const gid of n.group_ids) {
      const gr = merged.groups.find((x) => x.id === gid);
      if (gr && !gr.member_ids.includes(n.id)) gr.member_ids.push(n.id);
    }
  validate(merged);
  cache = merged;
  return merged;
}

export async function getFiches() {
  return (await getCollection('fiches')).sort((a, b) => a.data.titre.localeCompare(b.data.titre, 'fr'));
}
