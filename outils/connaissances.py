#!/usr/bin/env python3
"""Outil local pour la carte de connaissances du site.

Usage (depuis la racine du dépôt) :
  python3 outils/connaissances.py nouvelle-fiche "Meattini — 2026 — IDEAL" [--groupe g-sein]
  python3 outils/connaissances.py valider
  python3 outils/connaissances.py exporter [-o carte-complete.json]
  python3 outils/connaissances.py statut

- nouvelle-fiche : crée une fiche de lecture à partir du modèle (_modele.md).
- valider       : applique les vérifications d'acceptation de la spécification
                  (identifiants uniques, liens vers des nœuds existants, valeurs autorisées).
- exporter      : produit le graphe complet (graphes JSON + fiches) au format JSON v1,
                  à joindre à une IA avec « instructions-ia-carte-connaissances.md ».
- statut        : compte les éléments proposés, acceptés et refusés.

Dépendance : PyYAML (pip install pyyaml) pour lire l'en-tête des fiches.
Aucun fichier original n'est modifié, sauf la fiche créée par « nouvelle-fiche ».
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "src" / "content" / "connaissances"
GRAPHES = DOSSIER / "graphes"
FICHES = DOSSIER / "fiches"

TYPES = {"source", "fiche_source", "idee", "question", "hypothese", "projet", "competence", "prompt", "livrable", "retour"}
RELATIONS = {"documente", "extrait_de", "soutient", "contredit", "nuance", "precise", "analogue_a", "interroge",
             "mobilise", "utilise", "produit_dans", "evalue", "ameliore"}
ORIGINES = {"source_reported", "author_interpretation", "user_interpretation", "ai_inference", "not_applicable"}
REVUE = {"proposed", "accepted", "rejected"}
EPISTEMIQUE = {"reported", "hypothesis", "disputed", "not_applicable"}
BASES = {"explicit", "inferred", "exploratory"}


def slugifier(texte: str) -> str:
    t = unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode()
    t = re.sub(r"[^a-zA-Z0-9]+", "-", t).strip("-").lower()
    return re.sub(r"-{2,}", "-", t)[:80]


def lire_fiche(chemin: Path) -> dict:
    try:
        import yaml  # type: ignore
    except ImportError:
        sys.exit("PyYAML est nécessaire : pip install pyyaml")
    texte = chemin.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", texte, re.S)
    if not m:
        raise ValueError(f"{chemin.name} : en-tête YAML introuvable")
    return yaml.safe_load(m.group(1)) or {}


def fiche_vers_graphe(slug: str, d: dict) -> tuple[list, list]:
    """Même conversion que src/lib-connaissances.ts."""
    vide = lambda v: None if v in (None, "") else v  # noqa: E731
    src_id, fiche_id = f"src-{slug}", f"fiche-{slug}"
    statut = d.get("statut_revue") or "proposed"
    groupes = d.get("groupes") or []
    tags = d.get("tags") or []
    ref = " — ".join(str(x) for x in (vide(d.get("auteurs")), vide(d.get("annee")), vide(d.get("revue"))) if x)
    doi, pmid = vide(d.get("doi")), vide(d.get("pmid"))
    url = vide(d.get("url")) or (f"https://doi.org/{doi}" if doi else f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else None)
    noeuds = [
        {"id": src_id, "type": "source", "title": d.get("titre", slug), "text": ref or "Référence à compléter dans la fiche.",
         "origin": "not_applicable", "review_status": statut, "epistemic_status": "not_applicable", "provenance": [],
         "limits": [], "tags": tags, "group_ids": groupes,
         "metadata": {"doi": doi, "pmid": pmid, "url": url, "source_date": vide(d.get("annee"))}},
        {"id": fiche_id, "type": "fiche_source", "title": f"Fiche de lecture — {d.get('titre', slug)}",
         "text": vide(d.get("synthese")) or "Voir la fiche complète.", "origin": "user_interpretation",
         "review_status": statut, "epistemic_status": "not_applicable",
         "provenance": [{"document_id": src_id, "locator": None, "excerpt": None}], "limits": [],
         "tags": tags, "group_ids": groupes, "metadata": {"fiche": slug, "local_path": f"src/content/connaissances/fiches/{slug}.md"}},
    ]
    liens = [{"id": f"e-{slug}-documente", "source": src_id, "target": fiche_id, "relation": "documente",
              "rationale": "La fiche décrit ce document.", "provenance": [], "review_status": statut, "evidence_basis": "explicit"}]
    for i in d.get("idees") or []:
        loc = vide(i.get("localisation"))
        st = i.get("statut_revue") or "proposed"
        noeuds.append({"id": i["id"], "type": i.get("type") or "idee", "title": i["titre"], "text": i["texte"],
                       "origin": i.get("origine") or "source_reported", "review_status": st,
                       "epistemic_status": i.get("statut_epistemique") or "reported",
                       "provenance": [{"document_id": fiche_id, "locator": loc, "excerpt": vide(i.get("extrait"))}],
                       "limits": i.get("limites") or [], "tags": i.get("tags") or [],
                       "group_ids": i.get("groupes") or groupes, "metadata": {}})
        liens.append({"id": f"e-{i['id']}-extrait", "source": i["id"], "target": fiche_id, "relation": "extrait_de",
                      "rationale": "Proposition extraite de cette fiche de lecture.",
                      "provenance": [{"document_id": fiche_id, "locator": loc, "excerpt": None}],
                      "review_status": st, "evidence_basis": "explicit"})
        for k, l in enumerate(i.get("liens") or [], 1):
            base = l.get("base") or "inferred"
            liens.append({"id": f"e-{i['id']}-{k}", "source": i["id"], "target": l["vers"], "relation": l["relation"],
                          "rationale": l.get("justification", ""),
                          "provenance": [{"document_id": fiche_id, "locator": loc, "excerpt": None}],
                          "review_status": st if base == "explicit" else "proposed", "evidence_basis": base})
    return noeuds, liens


def graphe_complet() -> dict:
    g = {"schema_version": "1.0", "revision": 0, "nodes": [], "edges": [], "groups": []}
    for f in sorted(GRAPHES.glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        g["revision"] = max(g["revision"], d.get("revision", 0))
        g["nodes"] += d["nodes"]
        g["edges"] += d["edges"]
        for gr in d["groups"]:
            ex = next((x for x in g["groups"] if x["id"] == gr["id"]), None)
            if ex:
                ex["member_ids"] += gr["member_ids"]
            else:
                g["groups"].append({**gr, "member_ids": list(gr["member_ids"])})
    for f in sorted(FICHES.glob("[!_]*.md")):
        n, e = fiche_vers_graphe(f.stem, lire_fiche(f))
        g["nodes"] += n
        g["edges"] += e
    for n in g["nodes"]:
        for gid in n["group_ids"]:
            gr = next((x for x in g["groups"] if x["id"] == gid), None)
            if gr and n["id"] not in gr["member_ids"]:
                gr["member_ids"].append(n["id"])
    return g


def valider(g: dict) -> list[str]:
    err: list[str] = []
    ids: set[str] = set()
    for n in g["nodes"]:
        if n["id"] in ids:
            err.append(f"identifiant de nœud en double : {n['id']}")
        ids.add(n["id"])
        for champ, permis in (("type", TYPES), ("origin", ORIGINES), ("review_status", REVUE), ("epistemic_status", EPISTEMIQUE)):
            if n.get(champ) not in permis:
                err.append(f"{n['id']} : {champ} invalide ({n.get(champ)!r})")
        if n["type"] == "idee" and not n.get("provenance"):
            err.append(f"{n['id']} : idée sans provenance")
    groupes = {x["id"] for x in g["groups"]}
    for n in g["nodes"]:
        for gid in n.get("group_ids", []):
            if gid not in groupes:
                err.append(f"{n['id']} : groupe inconnu {gid}")
    eids: set[str] = set()
    paires: set[tuple[str, str]] = set()
    for e in g["edges"]:
        if e["id"] in eids:
            err.append(f"identifiant de lien en double : {e['id']}")
        eids.add(e["id"])
        if e["source"] not in ids:
            err.append(f"{e['id']} : nœud de départ absent ({e['source']})")
        if e["target"] not in ids:
            err.append(f"{e['id']} : nœud d'arrivée absent ({e['target']})")
        if e["relation"] not in RELATIONS:
            err.append(f"{e['id']} : relation inconnue ({e['relation']})")
        if e.get("evidence_basis") not in BASES:
            err.append(f"{e['id']} : evidence_basis invalide")
        if not (e.get("rationale") or "").strip():
            err.append(f"{e['id']} : justification manquante")
        if e["relation"] == "analogue_a":
            p = tuple(sorted((e["source"], e["target"])))
            if p in paires:
                err.append(f"analogue_a en double entre {p[0]} et {p[1]}")
            paires.add(p)
    return err


def cmd_nouvelle_fiche(a):
    slug = slugifier(a.titre)
    cible = FICHES / f"{slug}.md"
    if cible.exists():
        sys.exit(f"La fiche existe déjà : {cible.relative_to(RACINE)}")
    modele = (FICHES / "_modele.md").read_text(encoding="utf-8")
    modele = re.sub(r"^# ─.*?\n(?=type:)", "", modele, count=1, flags=re.S | re.M)
    modele = modele.replace('titre: "Premier auteur — Année — Titre court"', f'titre: "{a.titre}"', 1)
    modele = modele.replace('date_lecture: ""', f'date_lecture: "{date.today().isoformat()}"', 1)
    if a.groupe:
        modele = modele.replace("groupes: []", f"groupes: [{', '.join(a.groupe)}]", 1)
    modele = modele.replace("# [Premier auteur — Année — Titre court]", f"# {a.titre}", 1)
    cible.write_text(modele, encoding="utf-8")
    print(f"Fiche créée : {cible.relative_to(RACINE)}")


def cmd_valider(_a):
    g = graphe_complet()
    err = valider(g)
    if err:
        print(f"{len(err)} problème(s) :")
        for x in err:
            print(" -", x)
        sys.exit(1)
    print(f"Carte valide : {len(g['nodes'])} nœuds, {len(g['edges'])} liens, {len(g['groups'])} groupes.")


def cmd_exporter(a):
    g = graphe_complet()
    err = valider(g)
    if err:
        sys.exit("Export annulé : lancez « valider » pour voir les erreurs.")
    Path(a.o).write_text(json.dumps(g, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Graphe exporté : {a.o} (révision {g['revision']})")


def cmd_statut(_a):
    g = graphe_complet()
    from collections import Counter
    print("Nœuds :", dict(Counter(n["review_status"] for n in g["nodes"])))
    print("Liens :", dict(Counter(e["review_status"] for e in g["edges"])))
    print("Types :", dict(Counter(n["type"] for n in g["nodes"])))


def main():
    p = argparse.ArgumentParser(description="Carte de connaissances du site")
    s = p.add_subparsers(dest="cmd", required=True)
    nf = s.add_parser("nouvelle-fiche", help="créer une fiche de lecture depuis le modèle")
    nf.add_argument("titre")
    nf.add_argument("--groupe", action="append", help="identifiant de groupe (répétable), ex. g-sein")
    nf.set_defaults(f=cmd_nouvelle_fiche)
    s.add_parser("valider", help="vérifier le contrat de données").set_defaults(f=cmd_valider)
    ex = s.add_parser("exporter", help="exporter le graphe complet en JSON")
    ex.add_argument("-o", default="carte-complete.json")
    ex.set_defaults(f=cmd_exporter)
    s.add_parser("statut", help="compter les éléments à valider").set_defaults(f=cmd_statut)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
