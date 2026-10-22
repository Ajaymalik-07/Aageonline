import fs from 'node:fs';
import path from 'node:path';

const appChunksDir = path.resolve('.next/static/chunks/app');
if (fs.existsSync(appChunksDir)) {
  const files = fs.readdirSync(appChunksDir);
  const currentLayout = files.find((f) => f.startsWith('layout-') && f.endsWith('.js'));
  if (currentLayout) {
    const historicalHashes = [
      'layout-7fde4ded90dce7e9.js',
      'layout-267c7c42efd1c339.js',
      'layout-41098e0af5146fc4.js',
    ];
    for (const h of historicalHashes) {
      const dest = path.join(appChunksDir, h);
      try {
        fs.copyFileSync(path.join(appChunksDir, currentLayout), dest);
        console.log(`[ChunkPreserver] Aliased ${h} to ${currentLayout}`);
      } catch (e) {
        // Silently continue
      }
    }
  }
}
