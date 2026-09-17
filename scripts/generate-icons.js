import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Official VraiPrix Maroc PWA & Application Icon
// Based exactly on official logo uploaded:
// - White rounded squircle background
// - 4 Moroccan Red (#C1272D) rounded scanner corner brackets
// - Dark slate vertical barcode
// - Angled Moroccan Red price tag with white circular hole
// - Green Moroccan 5-pointed pentagram star on the tag
// - No text inside the icon (as instructed: no "VraiPrix Maroc" text or slogan in PWA icons)
// - Safe margin for Android maskable icon

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Soft shadow for price tag depth -->
    <filter id="tagShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="-2" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.22" />
    </filter>
  </defs>

  <!-- Clean white rounded background (squircle) -->
  <rect width="512" height="512" rx="112" fill="#FFFFFF" />

  <!-- 1. FOUR MOROCCAN RED SCANNER CORNERS -->
  <g fill="none" stroke="#C1272D" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
    <!-- Top-Left Bracket -->
    <path d="M 100,166 L 100,132 A 32 32 0 0 1 132,100 L 166,100" />
    <!-- Top-Right Bracket -->
    <path d="M 346,100 L 380,100 A 32 32 0 0 1 412,132 L 412,166" />
    <!-- Bottom-Left Bracket -->
    <path d="M 100,346 L 100,380 A 32 32 0 0 0 132,412 L 166,412" />
    <!-- Bottom-Right Bracket -->
    <path d="M 346,412 L 380,412 A 32 32 0 0 0 412,380 L 412,346" />
  </g>

  <!-- 2. VERTICAL BARCODE IN DARK CHARCOAL SLATE -->
  <g fill="#1E293B">
    <!-- Vertical bars with rounded caps (rx=4 to 6) -->
    <rect x="138" y="142" width="22" height="228" rx="6" />
    <rect x="170" y="142" width="12" height="228" rx="5" />
    <rect x="192" y="142" width="18" height="228" rx="6" />
    <rect x="220" y="142" width="22" height="228" rx="6" />
    <rect x="252" y="142" width="10" height="228" rx="4" />
    <rect x="272" y="142" width="18" height="228" rx="6" />
    <rect x="300" y="142" width="12" height="228" rx="5" />
    <rect x="322" y="142" width="22" height="228" rx="6" />
    <rect x="354" y="142" width="14" height="228" rx="5" />
  </g>

  <!-- 3. ANGLED RED PRICE TAG OVERLAY -->
  <g transform="translate(330, 280) rotate(-33)" filter="url(#tagShadow)">
    <!-- Tag Body: Chamfered top with rounded bottom -->
    <path d="
      M -68,96 
      L 68,96 
      A 26 26 0 0 0 94,70 
      L 94,-10 
      L 52,-82 
      A 20 20 0 0 0 34,-92 
      L -34,-92 
      A 20 20 0 0 0 -52,-82 
      L -94,-10 
      L -94,70 
      A 26 26 0 0 0 -68,96 
      Z" 
      fill="#C1272D" 
    />

    <!-- White Circular Tag Hole -->
    <circle cx="0" cy="-62" r="14" fill="#FFFFFF" />

    <!-- Moroccan Green 5-pointed Pentagram Star -->
    <!-- Pentagram drawn with continuous lines: 5 vertices on circle r=46 -->
    <!-- Vertices: 0: (0, -46), 1: (43.7, -14.2), 2: (27.0, 37.2), 3: (-27.0, 37.2), 4: (-43.7, -14.2) -->
    <!-- Order of stars points: 0 -> 2 -> 4 -> 1 -> 3 -> 0 -->
    <g transform="translate(0, 24)">
      <!-- Green filled & stroked pentagram star for vibrant visibility -->
      <polygon 
        points="0,-48 28.2,38.8 -45.6,-14.8 45.6,-14.8 -28.2,38.8" 
        fill="#006233" 
        stroke="#006233" 
        stroke-width="7" 
        stroke-linejoin="round" 
        stroke-linecap="round"
      />
      <!-- Fine inner contrast line matching official Moroccan emblem style -->
      <polygon 
        points="0,-48 28.2,38.8 -45.6,-14.8 45.6,-14.8 -28.2,38.8" 
        fill="none" 
        stroke="#004D27" 
        stroke-width="3" 
        stroke-linejoin="round"
      />
    </g>
  </g>
</svg>`;

fs.writeFileSync('public/icon.svg', iconSvg);
console.log('Written public/icon.svg');

async function generateAllIcons() {
  const svgBuffer = Buffer.from(iconSvg);

  // 1. pwa-192x192.png (192x192)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Created public/pwa-192x192.png (192x192)');

  // 2. pwa-512x512.png (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Created public/pwa-512x512.png (512x512)');

  // 3. pwa-maskable-512x512.png (512x512 with safe margin: icon inside 410x410 centered with white background)
  // According to Android PWA standards, maskable icons must keep essential content within the center 80% safe circle.
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#FFFFFF',
    })
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('Created public/pwa-maskable-512x512.png (512x512 maskable safe zone)');

  // 4. apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Created public/apple-touch-icon.png (180x180)');

  // 5. favicon.png (64x64)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile('public/favicon.png');
  console.log('Created public/favicon.png (64x64)');

  console.log('All PWA icons successfully generated!');
}

generateAllIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
