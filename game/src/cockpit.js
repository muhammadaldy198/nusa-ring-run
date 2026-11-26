// NUSA RING RUN — cockpit.js
// Panel instrumen kokpit: enam jam yang MENYALA — airspeed, attitude,
// altimeter, heading, VSI, fuel — digambar di kanvas 2D di bawah kaca depan.
// Jarum bergerak mengikuti state; bukan gambar mati.
import { knots, feet } from './flight.js';

function dial(ctx, cx, cy, r, label, valueText) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#0d1117';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a4552';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#8a94a3';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8));
    ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
    ctx.stroke();
  }
  ctx.fillStyle = '#e8f0f8';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, -r + 20);
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(valueText, 0, r - 10);
  ctx.restore();
}

function needle(ctx, cx, cy, r, frac, color) {
  const a = -Math.PI * 0.75 + frac * Math.PI * 1.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color || '#ff5a3c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(a) * (r - 12), Math.sin(a) * (r - 12));
  ctx.stroke();
  ctx.restore();
}

export function drawCockpitPanel(canvas, world) {
  const ctx = canvas.getContext('2d');
  const p = world.plane;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  // Panel gelap + tepi atas (glareshield).
  ctx.fillStyle = '#14181f';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(0, 0, W, 12);
  ctx.fillStyle = '#2a2f38';
  ctx.fillRect(0, 12, W, 3);

  const cy = 108;
  const r = 62;
  const xs = [110, 300, 490, 680, 870, 1060];

  // 1. Airspeed.
  dial(ctx, xs[0], cy, r, 'AIRSPEED KT', String(Math.round(knots(p.speed))));
  needle(ctx, xs[0], cy, r, Math.min(1, knots(p.speed) / 220));
  // 2. Attitude (bola horizon kecil).
  ctx.save();
  ctx.translate(xs[1], cy);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.rotate(p.roll);
  const dy = p.pitch * 130;
  ctx.fillStyle = '#3a7bd5';
  ctx.fillRect(-r, -r + dy, r * 2, r);
  ctx.fillStyle = '#7a5a34';
  ctx.fillRect(-r, dy, r * 2, r);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r, dy);
  ctx.lineTo(r, dy);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#3a4552';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(xs[1], cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#e8f0f8';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ATTITUDE', xs[1], cy - r + 20);
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(xs[1] - 22, cy);
  ctx.lineTo(xs[1] + 22, cy);
  ctx.stroke();
  // 3. Altimeter.
  dial(ctx, xs[2], cy, r, 'ALT FT', String(Math.round(feet(p.y))));
  needle(ctx, xs[2], cy, r, (feet(p.y) % 1000) / 1000);
  needle(ctx, xs[2], cy, r - 18, (feet(p.y) % 10000) / 10000, '#ffd23f');
  // 4. Heading.
  const hdgDeg = Math.round(((p.heading * 57.2958) % 360 + 360) % 360);
  dial(ctx, xs[3], cy, r, 'HEADING', `${String(hdgDeg).padStart(3, '0')}°`);
  needle(ctx, xs[3], cy, r, hdgDeg / 360, '#7fd4ff');
  // 5. VSI.
  const vsiFpm = Math.round(feet(p.verticalSpeed));
  dial(ctx, xs[4], cy, r, 'VERT FPM', `${vsiFpm >= 0 ? '+' : ''}${vsiFpm}`);
  needle(ctx, xs[4], cy, r, Math.max(0, Math.min(1, 0.5 + vsiFpm / 2000)));
  // 6. Fuel + damage.
  dial(ctx, xs[5], cy, r, 'FUEL %', `${Math.round(p.fuel)}%`);
  needle(ctx, xs[5], cy, r, p.fuel / 100, p.fuel < 25 ? '#ff2222' : '#2ecc40');
  ctx.fillStyle = p.damage > 60 ? '#ff4444' : '#ff8c1a';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`DMG ${Math.round(p.damage)}%`, xs[5], cy + r - 26);

  // Lampu status kanan bawah panel.
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = p.gear ? '#2ecc40' : '#8a94a3';
  ctx.fillText(`GEAR ${p.gear ? 'DOWN ●' : 'UP ○'}`, 1180, 40);
  ctx.fillStyle = p.flaps ? '#2ecc40' : '#8a94a3';
  ctx.fillText(`FLAPS ${p.flaps ? 'ON ●' : 'OFF ○'}`, 1180, 62);
  ctx.fillStyle = '#e8f0f8';
  ctx.fillText(`SKOR ${world.score}`, 1180, 84);
  ctx.fillText(`RING ${world.nextRing}/10`, 1180, 106);
}
