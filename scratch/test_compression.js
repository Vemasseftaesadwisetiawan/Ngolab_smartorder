import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCompression() {
  const rawPath = path.join(__dirname, 'raw_test.png');
  const webpPath = path.join(__dirname, 'compressed_test.webp');

  const width = 2000;
  const height = 2000;
  const svg = `<svg width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#ea580c"/>
    <circle cx="1000" cy="1000" r="800" fill="#ffffff"/>
    <text x="1000" y="1050" font-size="100" font-weight="bold" text-anchor="middle" fill="#1c1917">Bukti Bayar Test</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(rawPath);

  const rawStat = fs.statSync(rawPath);

  await sharp(rawPath)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(webpPath);

  const webpStat = fs.statSync(webpPath);

  console.log(`Original PNG Size: ${(rawStat.size / 1024).toFixed(2)} KB`);
  console.log(`Compressed WebP Size: ${(webpStat.size / 1024).toFixed(2)} KB`);
  const reduction = ((1 - webpStat.size / rawStat.size) * 100).toFixed(1);
  console.log(`Compression Reduction: ${reduction}%`);

  fs.unlinkSync(rawPath);
  fs.unlinkSync(webpPath);
}

testCompression().catch(console.error);
