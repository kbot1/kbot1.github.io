// Chiffre le contenu de l'espace privé (dossier prive-source/, jamais publié)
// et écrit public/prive/coffre.json, seul fichier publié.
//
// Usage :  node outils/chiffrer-prive.mjs "identifiant" "mot de passe"
//
// Pour ajouter une page : déposer le fichier .html dans prive-source/,
// l'ajouter à prive-source/contenu.json, relancer ce script, puis committer
// public/prive/coffre.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const [login, pass] = process.argv.slice(2);
if (!login || !pass) {
  console.error('Usage : node outils/chiffrer-prive.mjs "identifiant" "mot de passe"');
  process.exit(1);
}
const ITER = 600000;
const b64 = (u8) => Buffer.from(u8).toString('base64');
const list = JSON.parse(readFileSync('prive-source/contenu.json', 'utf8'));
const items = list.map((it) => ({ ...it, html: readFileSync('prive-source/' + it.fichier, 'utf8') }));
const plain = new TextEncoder().encode(JSON.stringify({ items }));

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const secret = new TextEncoder().encode(login.trim().toLowerCase() + '\n' + pass);
const base = await crypto.subtle.importKey('raw', secret, 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));

writeFileSync('public/prive/coffre.json', JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) }));
console.log(`OK : ${items.length} élément(s) chiffré(s) dans public/prive/coffre.json`);
