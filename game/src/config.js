// NUSA RING RUN — config.js
// Satu sumber kebenaran untuk semua angka yang bisa disetel: dunia, pesawat,
// misi, bahan bakar, dan batas pendaratan. Tidak ada angka ajaib di file lain.
export const WORLD_SEED = 20261126;

export const WORLD = {
  size: 3400,
  oceanLevel: 0,
  volcano: { x: -950, z: -750, height: 430, radius: 620 },
  runway: { x: 0, z: 720, headingDeg: 90, length: 700, width: 42 },
  grassStrip: { x: 1560, z: -1180, headingDeg: 90, length: 420, width: 30 },
  lighthouse: { x: 980, z: -520 },
  village: { x: 520, z: 330 },
  islands: [
    { x: 0, z: 0, radius: 1150, height: 150 },
    { x: 1560, z: -1180, radius: 420, height: 60 },
    { x: -1520, z: 950, radius: 520, height: 110 },
  ],
};

export const PLANE = {
  maxThrustAccel: 14,
  dragBase: 0.012,
  dragFlaps: 0.035,
  dragGear: 0.02,
  stallSpeed: 27,
  maxSpeed: 95,
  climbLift: 0.9,
  turnRate: 0.55,
  rollRate: 1.9,
  pitchRate: 0.85,
  yawRate: 0.22,
  fuelBurnBase: 0.02,
  fuelBurnThrottle: 0.22,
  startFuel: 100,
};

export const LANDING = {
  maxSpeed: 58,
  maxSink: 4.5,
  maxRollDeg: 12,
  maxPitchDeg: 9,
  touchdownBonus: 800,
};

export const RING_NAMES = [
  'GERBANG MERAPI',
  'LEMBAH SAWAH',
  'TANJUNG MERCUSUAR',
  'TELUK NELAYAN',
  'PULAU RUMPUT',
  'KARANG SELATAN',
  'PUNCAK AWAN',
  'MUARA EMAS',
  'PENDEKATAN AKHIR',
  'GERBANG NUSA',
];

export const RING_POINTS = [
  [-620, 210, -420],
  [-260, 170, -180],
  [620, 190, -380],
  [430, 150, 120],
  [1420, 140, -980],
  [-1080, 230, 620],
  [-420, 320, -60],
  [760, 160, 420],
  [-180, 120, 560],
  [120, 110, 700],
];

export const MISSIONS = {
  ring: {
    id: 'ring',
    name: 'RING RUN',
    title: 'NUSA RING RUN',
    goal: 'Terbang 10 ring bernama lalu mendarat di Lapangan Terbang Nusa.',
    winLine: 'MENANG: 10/10 ring + mendarat mulus',
    loseLine: 'KALAH: jatuh / bahan bakar habis / rusak 100%',
    ringRadius: 22,
    scoreMult: 1,
    fog: 0xf2c184,
    fogNear: 900,
    fogFar: 5200,
  },
  hop: {
    id: 'hop',
    name: 'ISLAND HOP',
    title: 'ISLAND HOP — KARGO NUSA',
    goal: 'Antar kargo ke Pulau Rumput dan Pulau Karang, kembali ke Nusa.',
    winLine: 'MENANG: 3 pengiriman + kembali ke Nusa',
    loseLine: 'KALAH: jatuh / bahan bakar habis / rusak 100%',
    ringRadius: 26,
    scoreMult: 1.2,
    fog: 0xf2c184,
    fogNear: 900,
    fogFar: 5200,
  },
  storm: {
    id: 'storm',
    name: 'STORM RESCUE',
    title: 'STORM RESCUE — BADAI MERAPI',
    goal: '10 ring dalam badai: jarak pandang pendek, angin kencang.',
    winLine: 'MENANG: 10/10 ring + mendarat di badai',
    loseLine: 'KALAH: jatuh / bahan bakar habis / rusak 100%',
    ringRadius: 30,
    scoreMult: 1.5,
    fog: 0x8a7a68,
    fogNear: 120,
    fogFar: 700,
    wind: 9,
  },
};

export const SCORE = {
  ring: 250,
  delivery: 400,
  comboStep: 50,
  timeBonusPerSecond: 4,
};
