import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Read-only pixel inspection: generated PNG originals are never rewritten.
const root = path.resolve('public/images/thoughts');
const styles = ['photo', 'cartoon', 'sketch'];
const mouthNames = {
  photo: ['Glossy rose', 'Natural warm', 'Full brown', 'Crooked peach'],
  cartoon: ['Classic smile', 'Coral lips', 'Buck teeth', 'Crooked grin'],
  sketch: ['Straight line', 'Smile line', 'Zigzag line', 'Pencil lips'],
};
const eyeNames = {
  photo: ['Brown', 'Blue', 'Hazel', 'Sleepy green'],
  cartoon: ['Googly', 'Teal almond', 'Violet lashes', 'Amber skeptical'],
  sketch: ['Round doodle', 'Pencil almond', 'Oval lashes', 'Skeptical'],
};
const staticNames = [
  ['Curls', 'Side part', 'Swoop', 'Wispy', 'Spikes'],
  ['Round ear', 'Long ear', 'Broad ear', 'Elf ear', 'Furry ear'],
  ['Button nose', 'Long nose', 'Broad nose', 'Clown nose', 'Robot nose'],
  ['Round glasses', 'Bucket hat', 'Bow', 'Mustache', 'Eyebrow'],
];
const layers = { ears: 0, head: 10, hair: 20, eyes: 30, nose: 40, mouth: 50, extras: 60 };
const manifest = {
  version: 1,
  generatedOn: '2026-10-30',
  provenance: 'AI-generated original assets using the built-in image_gen tool. Prompts in generation-prompts.json.',
  coordinateSystem: 'Source rectangles in image pixels; pivot and default placement normalized 0–1.',
  animation: {
    mouth: { selector: 'round(clamp(amplitude, 0, 1) * 4)', frames: 5 },
    eyes: { sequence: [0, 1, 2, 3, 0], transitionMs: [60, 70, 60, 90], idleRangeMs: [2400, 5200] },
  },
  sheets: [], parts: [],
};

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

// Find quiet gutters near the requested grid boundaries. This accommodates
// generated sheets whose rows are not precisely evenly spaced.
function cuts(projection, count) {
  const result = [0];
  const size = projection.length;
  for (let n = 1; n < count; n++) {
    const ideal = size * n / count;
    const radius = size / count * 0.18;
    let best = Math.round(ideal), score = Infinity;
    for (let p = Math.ceil(ideal - radius); p <= Math.floor(ideal + radius); p++) {
      const ink = projection[p - 1] + projection[p] + projection[p + 1];
      const candidate = ink + Math.abs(p - ideal) * 0.005;
      if (candidate < score) { score = candidate; best = p; }
    }
    result.push(best);
  }
  result.push(size);
  return result;
}

async function addSheet(style, kind, cols, rows) {
  const file = kind === 'heads' ? 'heads.png' : `${style}-${kind}.png`;
  const { data, info } = await sharp(path.join(root, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const xp = new Float64Array(width), yp = new Float64Array(height);
  let transparent = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const a = data[(y * width + x) * channels + 3];
    if (a === 0) transparent++;
    if (a > 24) { xp[x]++; yp[y]++; }
  }
  if (!transparent) throw new Error(`${file} has no transparent pixels`);
  const ys = cuts(yp, rows);
  const sheetId = file.replace('.png', '');
  manifest.sheets.push({ id: sheetId, src: `/images/thoughts/${file}`, width, height, columns: cols, rows, transparent: true });
  for (let row = 0; row < rows; row++) {
    const rowProjection = new Float64Array(width);
    for (let y = ys[row]; y < ys[row + 1]; y++) for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > 24) rowProjection[x]++;
    }
    const xs = cuts(rowProjection, cols);
    const frames = [];
    for (let col = 0; col < cols; col++) {
      const rect = { x: xs[col], y: ys[row], width: xs[col + 1] - xs[col], height: ys[row + 1] - ys[row] };
      let pixels = 0;
      for (let y = rect.y; y < rect.y + rect.height; y++) for (let x = rect.x; x < rect.x + rect.width; x++) {
        if (data[(y * width + x) * channels + 3] > 24) pixels++;
      }
      if (pixels < 20) throw new Error(`Empty frame ${sheetId}:${row}:${col}`);
      frames.push({ ...rect, index: col });
    }
    if (kind === 'mouths' || kind === 'eyes') {
      const category = kind === 'mouths' ? 'mouth' : 'eyes';
      const name = (kind === 'mouths' ? mouthNames : eyeNames)[style][row];
      manifest.parts.push({
        id: `${style}-${category}-${slug(name)}`, label: name, style, category,
        sheet: sheetId, frames, pivot: { x: 0.5, y: 0.5 }, layer: layers[category],
        animation: kind === 'mouths' ? 'mouth' : 'eyes', mirrorable: kind === 'eyes',
        defaultPlacement: { x: 0.5, y: kind === 'mouths' ? 0.65 : 0.4, scale: kind === 'mouths' ? 0.3 : 0.18, rotation: 0 },
      });
    } else {
      for (let col = 0; col < cols; col++) {
        const category = kind === 'heads' ? 'head' : ['hair', 'ears', 'nose', 'extras'][row];
        const name = kind === 'heads' ? ['Potato', 'Toast', 'Moon', 'Robot'][row * cols + col] : staticNames[row][col];
        manifest.parts.push({
          id: `${kind === 'heads' ? 'base' : style}-${category}-${slug(name)}`, label: name,
          style: kind === 'heads' ? 'mixed' : style, category, sheet: sheetId,
          frames: [{ ...frames[col], index: 0 }], pivot: { x: 0.5, y: 0.5 }, layer: layers[category],
          animation: null, mirrorable: category === 'ears' || name === 'Eyebrow',
          defaultPlacement: { x: 0.5, y: category === 'hair' ? 0.25 : 0.5, scale: category === 'head' ? 0.8 : 0.25, rotation: 0 },
        });
      }
    }
  }
}

for (const style of styles) {
  await addSheet(style, 'mouths', 5, 4);
  await addSheet(style, 'eyes', 4, 4);
  await addSheet(style, 'parts', 5, 4);
}
await addSheet('mixed', 'heads', 2, 2);
if (new Set(manifest.parts.map(p => p.id)).size !== manifest.parts.length) throw new Error('Duplicate IDs');
for (const part of manifest.parts) for (const frame of part.frames) {
  const sheet = manifest.sheets.find(s => s.id === part.sheet);
  if (frame.x < 0 || frame.y < 0 || frame.x + frame.width > sheet.width || frame.y + frame.height > sheet.height) throw new Error(`Invalid frame ${part.id}`);
}
await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Validated ${manifest.sheets.length} transparent sheets, ${manifest.parts.length} parts, ${manifest.parts.reduce((n, p) => n + p.frames.length, 0)} nonempty frames.`);
