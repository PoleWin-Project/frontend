#!/usr/bin/env node
/**
 * Garde-fou App Store (Guideline 2.3.6 / « simulated gambling ») :
 * échoue si un terme de pari apparaît dans le CODE de l'app (textes affichés, noms
 * d'API…). Les commentaires sont ignorés : on peut y expliquer pourquoi ces
 * termes sont interdits.
 *
 *   npm run check:wording
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['app', 'components', 'context', 'hooks', 'lib'];
const FORBIDDEN = [
    /\bparis?\b/i, /\bparier\b/i, /\bparie\b/i, /\bmises?\b/i, /\bmisée?s?\b/i, /\bmiser\b/i,
    /\bcotes?\b/i, /\bsolde\b/i, /gain potentiel/i, /\bgains?\b/i, /\bpertes?\b/i, /\bbilan\b/i,
    /\bstakes?\b/i, /\bpointsStaked\b/, /\bnetGain\b/, /\bbet(s|ting)?\b/i, /\bwager/i, /\bodds\b/i,
    /\bwallet\b/i, /\bpayout\b/i, /\bmultiplier\b/i, /\bjackpot\b/i, /\bcasino\b/i,
    /\bCoins\b/, /['"`]x\d(\.\d)?['"`]/,
];
// Faux positifs connus (expressions sans rapport avec le pari).
const ALLOWED = [/Europe\/Paris/, /mises? à jour/i];

/** Retire les commentaires // et /* *\/ en conservant les numéros de ligne. */
function stripComments(src) {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p, out);
        else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(p);
    }
    return out;
}

const hits = [];
for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;
    for (const file of walk(root)) {
        const lines = stripComments(fs.readFileSync(file, 'utf8')).split('\n');
        lines.forEach((line, i) => {
            if (ALLOWED.some((re) => re.test(line))) return;
            const term = FORBIDDEN.find((re) => re.test(line));
            if (term) hits.push(`${file}:${i + 1}  ${line.trim().slice(0, 120)}`);
        });
    }
}

if (hits.length) {
    console.error(`❌ ${hits.length} occurrence(s) de vocabulaire de pari :\n` + hits.join('\n'));
    process.exit(1);
}
console.log('✅ Aucun vocabulaire de pari dans le code de l’app.');
