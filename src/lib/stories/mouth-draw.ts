import type { MouthStyle } from '@/lib/stories/schemas';

/**
 * Draw an exaggerated cartoon mouth centered on the origin.
 * The caller is responsible for translate / rotate before calling.
 *
 * @param width mouth width in canvas pixels
 * @param open  0 (closed) .. 1 (wide open)
 */
export function drawMouth(
  ctx: CanvasRenderingContext2D,
  style: MouthStyle,
  open: number,
  width: number
): void {
  const clamped = Math.min(1, Math.max(0, open));
  switch (style) {
    case 'duck':
      drawDuckBill(ctx, clamped, width);
      break;
    case 'monster':
      drawMonsterMouth(ctx, clamped, width);
      break;
    default:
      drawCartoonLips(ctx, clamped, width);
  }
}

function drawCartoonLips(
  ctx: CanvasRenderingContext2D,
  open: number,
  width: number
): void {
  const w = width / 2;
  const openHeight = Math.max(width * 0.04, width * 0.55 * open);
  const lip = Math.max(2, width * 0.09);

  ctx.save();
  ctx.lineJoin = 'round';

  // Mouth interior
  ctx.beginPath();
  ctx.ellipse(0, 0, w, openHeight / 2 + lip * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#5b1010';
  ctx.fill();

  if (open > 0.12) {
    // Teeth
    ctx.beginPath();
    ctx.ellipse(0, -openHeight * 0.28, w * 0.8, openHeight * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // Tongue
    ctx.beginPath();
    ctx.ellipse(0, openHeight * 0.3, w * 0.55, openHeight * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e0526e';
    ctx.fill();
  }

  // Lips outline
  ctx.beginPath();
  ctx.ellipse(0, 0, w, openHeight / 2 + lip * 0.4, 0, 0, Math.PI * 2);
  ctx.lineWidth = lip;
  ctx.strokeStyle = '#c62f45';
  ctx.stroke();

  ctx.restore();
}

function drawDuckBill(
  ctx: CanvasRenderingContext2D,
  open: number,
  width: number
): void {
  const w = width / 2;
  const gap = width * 0.4 * open;
  const beakHeight = width * 0.22;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, width * 0.04);
  ctx.strokeStyle = '#b06a00';

  // Inside of the open bill
  if (open > 0.08) {
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.82, gap / 2 + 1, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#7a2b18';
    ctx.fill();
  }

  // Top beak
  ctx.beginPath();
  ctx.moveTo(-w, -gap / 2);
  ctx.quadraticCurveTo(0, -gap / 2 - beakHeight * 1.5, w, -gap / 2);
  ctx.quadraticCurveTo(0, -gap / 2 + beakHeight * 0.4, -w, -gap / 2);
  ctx.fillStyle = '#ffb61e';
  ctx.fill();
  ctx.stroke();

  // Bottom beak
  ctx.beginPath();
  ctx.moveTo(-w * 0.9, gap / 2);
  ctx.quadraticCurveTo(0, gap / 2 + beakHeight * 1.2, w * 0.9, gap / 2);
  ctx.quadraticCurveTo(0, gap / 2 - beakHeight * 0.3, -w * 0.9, gap / 2);
  ctx.fillStyle = '#f59f0a';
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawMonsterMouth(
  ctx: CanvasRenderingContext2D,
  open: number,
  width: number
): void {
  const w = width / 2;
  const openHeight = Math.max(width * 0.06, width * 0.7 * open);
  const teeth = 5;

  ctx.save();
  ctx.lineJoin = 'round';

  // Mouth cavity
  ctx.beginPath();
  ctx.ellipse(0, 0, w, openHeight / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2b0a3d';
  ctx.fill();
  ctx.lineWidth = Math.max(2, width * 0.06);
  ctx.strokeStyle = '#57c94f';
  ctx.stroke();

  // Jagged teeth hanging from the top lip
  if (open > 0.1) {
    ctx.beginPath();
    const toothWidth = (w * 1.7) / teeth;
    const top = -openHeight / 2 + 1;
    const length = Math.min(openHeight * 0.55, width * 0.22);
    for (let i = 0; i < teeth; i++) {
      const x0 = -w * 0.85 + i * toothWidth;
      ctx.moveTo(x0, top);
      ctx.lineTo(x0 + toothWidth / 2, top + length);
      ctx.lineTo(x0 + toothWidth, top);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  ctx.restore();
}
