// NUSA RING RUN — terrain.js
// Kepulauan vulkanik prosedural dari seed tetap: Gunung Merapi berasap,
// sawah terasering, desa nelayan Teluk Nelayan, mercusuar Tanjung, dan
// Lapangan Terbang Nusa. groundHeight() adalah satu-satunya kebenaran
// ketinggian — dipakai mesh DAN model terbang, jadi keduanya selalu cocok.
import { WORLD } from './config.js';
import { fbm2, createRandom } from './random.js';

const RW = WORLD.runway;
const GS = WORLD.grassStrip;

function smoothstep(a, b, t) {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

function inRect(x, z, c, halfLen, halfWid) {
  return Math.abs(x - c.x) < halfLen && Math.abs(z - c.z) < halfWid;
}

/** Ketinggian tanah (meter) di (x, z). Deterministik, tanpa state. */
export function groundHeight(x, z) {
  let h = -8;
  for (const isl of WORLD.islands) {
    const dx = x - isl.x;
    const dz = z - isl.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    const fall = 1 - smoothstep(isl.radius * 0.55, isl.radius, d);
    if (fall <= 0) continue;
    const hills = fbm2(x * 0.0016 + 31, z * 0.0016 + 17, 11) * 55;
    h = Math.max(h, fall * (isl.height * 0.55 + hills) + 2);
  }
  // Kerucut Merapi di atas pulau utama.
  const vdx = x - WORLD.volcano.x;
  const vdz = z - WORLD.volcano.z;
  const vd = Math.sqrt(vdx * vdx + vdz * vdz);
  if (vd < WORLD.volcano.radius) {
    const cone = Math.pow(1 - vd / WORLD.volcano.radius, 1.4) * WORLD.volcano.height;
    h = Math.max(h, cone - 6);
  }
  // Dataran pantai Lapangan Terbang Nusa: apron datar ~6 m di sekitar
  // runway, menyatu ke bukit di radius 650 m — final tidak masuk ngarai.
  const rdx = x - RW.x;
  const rdz = z - RW.z;
  const rd = Math.hypot(rdx, rdz);
  const flat = 1 - smoothstep(260, 950, rd);
  if (flat > 0) h = h * (1 - flat) + 6 * flat;
  // Landasan diratakan: runway + strip rumput.
  if (inRect(x, z, RW, RW.length / 2, RW.width / 2)) return 6;
  if (inRect(x, z, GS, GS.length / 2, GS.width / 2)) return 4;
  const rwEdge = Math.max(Math.abs(x - RW.x) - RW.length / 2, Math.abs(z - RW.z) - RW.width / 2);
  if (rwEdge < 40 && rwEdge > 0) return h * (rwEdge / 40) + 6 * (1 - rwEdge / 40);
  const gsEdge = Math.max(Math.abs(x - GS.x) - GS.length / 2, Math.abs(z - GS.z) - GS.width / 2);
  if (gsEdge < 30 && gsEdge > 0) return h * (gsEdge / 30) + 4 * (1 - gsEdge / 30);
  return h;
}

/** Benar bila (x, z) di atas runway atau strip rumput (boleh mendarat). */
export function isOnStrip(x, z) {
  return (
    inRect(x, z, RW, RW.length / 2 + 6, RW.width / 2 + 6) ||
    inRect(x, z, GS, GS.length / 2 + 6, GS.width / 2 + 6)
  );
}

function colorFor(h, slope, x, z, out) {
  const vd = Math.hypot(x - WORLD.volcano.x, z - WORLD.volcano.z);
  if (vd < 150) return out.setHex(0x4a4038); // kawah gelap
  if (h < 2.5) return out.setHex(0xd9c28a); // pasir pantai
  if (vd < WORLD.volcano.radius && h > 55 && h < 210) {
    // Sawah terasering: pita hijau berselang di lereng Merapi.
    return out.setHex(Math.floor(h / 13) % 2 === 0 ? 0x5da244 : 0x86b95e);
  }
  if (slope > 0.55 || h > 260) return out.setHex(0x8a7f74); // batu
  if (h < 45) return out.setHex(0x5f9c46); // rumput rendah
  return out.setHex(0x4d8a3f); // hutan
}

/** Bangun semua mesh dunia; kembalikan { group, smoke, clouds }. */
export function createTerrain(THREE, seed) {
  const group = new THREE.Group();
  const rng = createRandom(seed);
  const size = WORLD.size;
  const seg = 128;

  // --- tanah: plane 128x128 dengan warna per-vertex ---
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const tmp = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = groundHeight(x, z);
    pos.setY(i, h);
    const hx = groundHeight(x + 8, z) - h;
    const hz = groundHeight(x, z + 8) - h;
    const slope = Math.hypot(hx, hz) / 8;
    colorFor(h, slope, x, z, c);
    // Variasi halus supaya tidak rata.
    const v = 0.92 + fbm2(x * 0.01, z * 0.01, 5) * 0.16;
    colors[i * 3] = c.r * v;
    colors[i * 3 + 1] = c.g * v;
    colors[i * 3 + 2] = c.b * v;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const land = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ vertexColors: true }),
  );
  group.add(land);

  // --- laut ---
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 2.4, size * 2.4),
    new THREE.MeshPhongMaterial({ color: 0x1f6f8f, shininess: 90, specular: 0x88bbcc }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.4;
  group.add(sea);

  // --- runway + marka ---
  const stripMat = new THREE.MeshLambertMaterial({ color: 0x3c3f45 });
  const runway = new THREE.Mesh(new THREE.PlaneGeometry(RW.length, RW.width), stripMat);
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(RW.x, 6.4, RW.z);
  group.add(runway);
  const markMat = new THREE.MeshBasicMaterial({ color: 0xf5f2e8 });
  for (let d = -RW.length / 2 + 40; d < RW.length / 2 - 20; d += 60) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(26, 2.4), markMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(RW.x + d, 6.6, RW.z);
    group.add(dash);
  }
  for (const s of [-1, 1]) {
    for (let k = -2; k <= 2; k += 1) {
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(3, 14), markMat);
      bar.rotation.x = -Math.PI / 2;
      bar.position.set(RW.x + s * (RW.length / 2 - 14), 6.6, RW.z + k * 8);
      group.add(bar);
    }
  }
  // Strip rumput Pulau Rumput.
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(GS.length, GS.width),
    new THREE.MeshLambertMaterial({ color: 0x7fae56 }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(GS.x, 4.4, GS.z);
  group.add(grass);

  // --- menara kontrol + hangar ---
  const towerMat = new THREE.MeshLambertMaterial({ color: 0xe8e2d4 });
  const tower = new THREE.Mesh(new THREE.BoxGeometry(9, 34, 9), towerMat);
  tower.position.set(RW.x - 60, 6 + 17, RW.z - 46);
  group.add(tower);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(14, 7, 14),
    new THREE.MeshPhongMaterial({ color: 0x2a4a66, shininess: 120 }),
  );
  cabin.position.set(RW.x - 60, 6 + 36, RW.z - 46);
  group.add(cabin);
  const hangar = new THREE.Mesh(
    new THREE.BoxGeometry(46, 14, 26),
    new THREE.MeshLambertMaterial({ color: 0xc96a2e }),
  );
  hangar.position.set(RW.x - 120, 6 + 7, RW.z - 60);
  group.add(hangar);

  // --- mercusuar Tanjung ---
  const lh = new THREE.Group();
  const lhBody = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 7, 34, 12),
    new THREE.MeshLambertMaterial({ color: 0xf2ede2 }),
  );
  lhBody.position.y = 17;
  lh.add(lhBody);
  const lhBand = new THREE.Mesh(
    new THREE.CylinderGeometry(5.4, 5.8, 6, 12),
    new THREE.MeshLambertMaterial({ color: 0xc23b2a }),
  );
  lhBand.position.y = 22;
  lh.add(lhBand);
  const lhLamp = new THREE.Mesh(
    new THREE.SphereGeometry(3.4, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8 }),
  );
  lhLamp.position.y = 36;
  lh.add(lhLamp);
  lh.position.set(WORLD.lighthouse.x, groundHeight(WORLD.lighthouse.x, WORLD.lighthouse.z), WORLD.lighthouse.z);
  group.add(lh);

  // --- desa nelayan: rumah panggung + perahu ---
  const houseMat = new THREE.MeshLambertMaterial({ color: 0xd8b98a });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x8a4a2a });
  for (let i = 0; i < 26; i += 1) {
    const hx = WORLD.village.x + (rng() - 0.5) * 260;
    const hz = WORLD.village.z + (rng() - 0.5) * 180;
    const hy = Math.max(2, groundHeight(hx, hz));
    const house = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 8), houseMat);
    base.position.y = 3;
    house.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.5, 4.5, 4), roofMat);
    roof.position.y = 8.2;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);
    house.position.set(hx, hy, hz);
    house.rotation.y = rng() * Math.PI;
    group.add(house);
  }
  const boatMat = new THREE.MeshLambertMaterial({ color: 0x2a6a8a });
  for (let i = 0; i < 7; i += 1) {
    const bx = WORLD.village.x + 140 + rng() * 160;
    const bz = WORLD.village.z + 90 + (rng() - 0.5) * 220;
    const boat = new THREE.Mesh(new THREE.BoxGeometry(14, 2.5, 4), boatMat);
    boat.position.set(bx, 1.2, bz);
    boat.rotation.y = rng() * Math.PI;
    group.add(boat);
  }

  // --- pohon instanced: kelapa + pinus di bukit ---
  const treeCount = 380;
  const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 5, 6);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
  const crownGeo = new THREE.ConeGeometry(3.4, 11, 7);
  const crownMat = new THREE.MeshLambertMaterial({ color: 0x2f6b2a });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
  const m = new THREE.Matrix4();
  let placed = 0;
  let guard = 0;
  while (placed < treeCount && guard < 6000) {
    guard += 1;
    const x = (rng() - 0.5) * size * 0.85;
    const z = (rng() - 0.5) * size * 0.85;
    const h = groundHeight(x, z);
    if (h < 4 || h > 130) continue;
    if (isOnStrip(x, z)) continue;
    const s = 0.8 + rng() * 0.9;
    m.makeScale(s, s, s);
    m.setPosition(x, h + 2.2 * s, z);
    trunks.setMatrixAt(placed, m);
    m.makeScale(s, s, s);
    m.setPosition(x, h + (5 + 5.5) * s - 2.2 * s + 2.2 * s, z);
    m.setPosition(x, h + 9.5 * s, z);
    crowns.setMatrixAt(placed, m);
    placed += 1;
  }
  trunks.count = placed;
  crowns.count = placed;
  group.add(trunks);
  group.add(crowns);

  // --- asap Merapi: kerucut tembus pandang + gumpalan ---
  const smoke = new THREE.Group();
  const smokeMat = new THREE.MeshLambertMaterial({
    color: 0x9a938a, transparent: true, opacity: 0.55,
  });
  for (let i = 0; i < 6; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(26 + i * 9, 10, 8), smokeMat);
    puff.position.set((rng() - 0.5) * 40, 30 + i * 34, (rng() - 0.5) * 40);
    puff.userData.baseY = puff.position.y;
    puff.userData.phase = rng() * Math.PI * 2;
    smoke.add(puff);
  }
  smoke.position.set(WORLD.volcano.x, WORLD.volcano.height - 4, WORLD.volcano.z);
  group.add(smoke);

  // --- awan golden-hour: ellipsoid pipih, v2 lebih banyak + berlapis ---
  const clouds = new THREE.Group();
  for (let i = 0; i < 22; i += 1) {
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xfff2dd, transparent: true, opacity: 0.55 + (i % 5) * 0.09,
    });
    const cl = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), cloudMat);
    const sx = 90 + rng() * 170;
    cl.scale.set(sx, 14 + rng() * 16, 40 + rng() * 40);
    cl.position.set((rng() - 0.5) * 3400, 330 + rng() * 230, (rng() - 0.5) * 3400);
    clouds.add(cl);
  }
  group.add(clouds);

  return { group, smoke, clouds };
}
