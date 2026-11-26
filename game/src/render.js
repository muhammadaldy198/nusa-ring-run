// NUSA RING RUN — render.js
// Scene Three.js + golden hour: matahari rendah hangat, kabut senja,
// langit satu gaya dengan terrain. Juga debu touchdown + asap Merapi yang
// bergerak mengikuti jam dunia (deterministik dalam mode shot).
import * as THREE from 'three';
import { createTerrain } from './terrain.js';
import { createAircraft, poseAircraft } from './aircraft.js';
import { addRingsToScene, paintRings } from './rings.js';
import { WORLD_SEED } from './config.js';
import { createRandom } from './random.js';

export function createRenderer(canvas, mission) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7b96a);
  scene.fog = new THREE.Fog(mission.fog, mission.fogNear, mission.fogFar);

  // Golden hour: matahari rendah dari barat, hangat.
  const sun = new THREE.DirectionalLight(0xffd9a0, 1.5);
  sun.position.set(-1800, 700, 900);
  scene.add(sun);
  // Cakram matahari di barat — langit senja tidak kosong.
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(150, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8, fog: false }),
  );
  sunDisc.position.set(-3400, 620, 1500);
  sunDisc.lookAt(0, 0, 0);
  scene.add(sunDisc);
  const hemi = new THREE.HemisphereLight(0xffd9b0, 0x3a5a3a, 0.75);
  scene.add(hemi);

  const terrain = createTerrain(THREE, WORLD_SEED);
  scene.add(terrain.group);

  // Kawanan burung v2 — langit tidak lagi kosong: 9 burung formasi-V yang
  // melayang di atas kepulauan, posisi dari RNG tetap (deterministik).
  const birds = new THREE.Group();
  const birdRng = createRandom(4242);
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x2a2620, fog: false });
  for (let i = 0; i < 9; i += 1) {
    const bird = new THREE.Group();
    const wingGeo = new THREE.BoxGeometry(9, 0.8, 2);
    const wl = new THREE.Mesh(wingGeo, birdMat);
    wl.position.x = -4.4;
    wl.rotation.z = 0.35;
    const wr = new THREE.Mesh(wingGeo, birdMat);
    wr.position.x = 4.4;
    wr.rotation.z = -0.35;
    bird.add(wl);
    bird.add(wr);
    bird.userData.wl = wl;
    bird.userData.wr = wr;
    bird.userData.baseY = 195 + birdRng() * 30;
    bird.userData.phase = birdRng() * Math.PI * 2;
    const row = Math.floor(i / 3);
    const col = i % 3;
    // Formasi di sumbu pandang kamera cover: ~200 m di depan kamera,
    // ~40 m di atasnya — di langit atas frame, tidak terpotong tepi dan
    // tidak di belakang frustum. (Kamera cover ~(593,155,-23), pandang
    // ke (-0.75,0,0.66); kanan = (-0.66,0,-0.75).)
    const bx = 398 - (col - 1) * 46 - (row - 1) * 37;
    const bz = 149 - (col - 1) * 52 + (row - 1) * 33;
    bird.position.set(bx, bird.userData.baseY, bz);
    birds.add(bird);
  }
  scene.add(birds);

  const aircraft = createAircraft(THREE);
  scene.add(aircraft.group);

  // Debu touchdown: 90 partikel, posisi dari RNG tetap.
  const dustRng = createRandom(99);
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(90 * 3);
  const dustVel = [];
  for (let i = 0; i < 90; i += 1) {
    dustVel.push({
      x: (dustRng() - 0.5) * 14,
      y: dustRng() * 5 + 1,
      z: (dustRng() - 0.5) * 14,
    });
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xd9c8a8, size: 3.2, transparent: true, opacity: 0 }),
  );
  scene.add(dust);
  let dustOrigin = null;
  let dustAge = 99;

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 9000);
  camera.position.set(0, 20, -30);

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  return {
    renderer, scene, camera, terrain, aircraft, dust,
    spawnDust(x, y, z) {
      dustOrigin = new THREE.Vector3(x, y, z);
      dustAge = 0;
    },
    draw(world, rig, time) {
      const p = world.plane;
      poseAircraft(aircraft, p, 1 / 60, time);
      paintRings(world.rings, world.nextRing);
      // Ring aktif berdenyut pelan.
      const active = world.rings[world.nextRing];
      if (active) {
        const s = 1 + Math.sin(time * 3) * 0.03;
        active.mesh.scale.setScalar(s);
      }
      // Asap Merapi naik + bergeser dengan angin.
      terrain.smoke.children.forEach((puff) => {
        const cyc = (time * 6 + puff.userData.phase * 12) % 120;
        puff.position.y = puff.userData.baseY + cyc;
        puff.position.x = Math.sin(puff.userData.phase + time * 0.2) * 24;
        puff.material.opacity = 0.55 * (1 - cyc / 160);
      });
      // Awan hanyut pelan.
      terrain.clouds.children.forEach((cl, i) => {
        cl.position.x += 0.35 + (i % 3) * 0.12;
        if (cl.position.x > 1800) cl.position.x = -1800;
      });
      // Burung: hanyut pelan ke timur + naik-turun lembut + kepak sayap.
      birds.children.forEach((b, i) => {
        b.position.x += 0.55;
        if (b.position.x > 1800) b.position.x = -1800;
        b.position.y = b.userData.baseY + Math.sin(time * 0.7 + b.userData.phase) * 6;
        const flap = 0.2 + Math.sin(time * 5 + b.userData.phase) * 0.12;
        b.userData.wl.rotation.z = flap;
        b.userData.wr.rotation.z = -flap;
      });
      // Debu: mekar 1,6 detik lalu hilang.
      if (dustOrigin && dustAge < 1.6) {
        dustAge += 1 / 60;
        const posAttr = dust.geometry.attributes.position;
        for (let i = 0; i < 90; i += 1) {
          const v = dustVel[i];
          posAttr.setXYZ(
            i,
            dustOrigin.x + v.x * dustAge,
            dustOrigin.y + v.y * dustAge - dustAge * dustAge * 2,
            dustOrigin.z + v.z * dustAge,
          );
        }
        posAttr.needsUpdate = true;
        dust.material.opacity = Math.max(0, 0.85 * (1 - dustAge / 1.6));
      } else {
        dust.material.opacity = 0;
      }
      rig.camera = camera;
      renderer.render(scene, camera);
    },
  };
}

/** Pasang ring kursus ke scene (dipanggil sekali setelah world dibuat). */
export function attachRingsToScene(renderCtx, rings) {
  addRingsToScene(renderCtx.scene, rings);
}
