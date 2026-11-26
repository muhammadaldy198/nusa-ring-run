// NUSA RING RUN — main.ts (Node 22, standard library only).
// Entrypoint program/v1: menyalin game/ dan screenshots/ dari samping file
// ini ke /output lalu menulis /output/dossier.json dengan buildDossier dari
// vendor/makefun-game.ts (salinan kit, tidak diubah). Di luar grader,
// MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Deterministik: hanya menyalin file + membangun dossier dari input yang
// sama, tanpa tanggal, tanpa acak — dua run menulis byte yang sama.

import { chmodSync, cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Batas gate (reference/gate.json): dossier teks max 160 KiB, max 4
// screenshot @ 256 KiB, game/ max 993 file / 48 MiB / path 1000 byte.
const dossierPath = join(out, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
chmodSync(dossierPath, 0o644);
// Catatan determinisme: tidak ada tanggal/acak di jalur ini — dua run dari
// input yang sama menulis byte yang sama (gate menjalankan main.ts 2x).
