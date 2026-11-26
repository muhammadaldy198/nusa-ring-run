// NUSA RING RUN v2 — entrypoint program/v1 (Node 22, hanya stdlib).
// Tugas file ini sempit: salin game/ + screenshots/ dari sebelah file ini
// ke direktori output, lalu tulis dossier.json dari buildDossier di
// vendor/makefun-game.ts (salinan kit yang tidak diubah). Di luar grader,
// direktori output diganti lewat MAKEFUN_OUTPUT_DIR:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// Output harus sama persis bila dijalankan dua kali dari input yang sama:
// tidak ada jam, tidak ada acak, tidak ada apa pun yang berubah antar run.

import { chmodSync, cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(rootDir, 'game'), join(outDir, 'game'), { recursive: true });
const shotDir = join(outDir, 'screenshots');
mkdirSync(shotDir, { recursive: true });
if (existsSync(join(rootDir, 'screenshots'))) {
  cpSync(join(rootDir, 'screenshots'), shotDir, { recursive: true });
}

// Dossier ditulis dari isi output yang baru disalin, lalu dikunci modenya
// supaya grader membaca file yang sama persis di kedua run.
// v2: tidak ada perubahan perilaku di sini — yang berubah adalah isi
// game/ (HUD chase lebih padat, strip gauge, checklist, burung) dan
// screenshots/ yang di-stage ulang; entrypoint ini hanya menyalinnya.
const dossierFile = join(outDir, 'dossier.json');
writeFileSync(dossierFile, buildDossier(outDir, dossierLimits));
chmodSync(dossierFile, 0o644);
