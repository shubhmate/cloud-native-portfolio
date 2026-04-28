// One-time script to compress profile.png
// Run: node automation/compress-image.js
// Then delete this file (it's a one-time utility)

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const INPUT  = path.join(__dirname, '../src/assets/img/profile.png');
const OUTPUT = path.join(__dirname, '../src/assets/img/profile.webp');

async function compress() {
    const before = fs.statSync(INPUT).size;

    await sharp(INPUT)
        .resize(400, 400, { fit: 'cover', position: 'top' })
        .webp({ quality: 82 })
        .toFile(OUTPUT);

    const after = fs.statSync(OUTPUT).size;
    console.log(`✔ Compressed: ${(before/1024/1024).toFixed(2)}MB → ${(after/1024).toFixed(0)}KB`);
    console.log(`✔ Saved as: ${OUTPUT}`);
    console.log('\nNext: update PROFILE_IMAGE in site-config.json to "assets/img/profile.webp"');
}

compress().catch(console.error);
