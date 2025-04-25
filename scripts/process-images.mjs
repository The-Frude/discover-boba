import sharp from 'sharp';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const sizes = [320, 640, 1024, 1536];
const inputDir = 'public/images';
const outputDir = 'public/optimized';

// Create output directory if it doesn't exist
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Process all JPG/PNG images
async function processImages() {
  const files = readdirSync(inputDir).filter(f => /\.(jpe?g|png)$/i.test(f));
  
  for (const file of files) {
    for (const size of sizes) {
      const outputPath = join(outputDir, `${file.replace(/\.[^/.]+$/, '')}-${size}w.webp`);
      if (!existsSync(outputPath)) {
        await sharp(join(inputDir, file))
          .resize(size)
          .webp({ quality: 85 })
          .toFile(outputPath);
      }
    }
  }
}

processImages().catch(err => {
  console.error('Error processing images:', err);
  process.exit(1);
});
