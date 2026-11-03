import fs from 'node:fs';
import path from 'node:path';
import { PinterestSearchProvider } from '../packages/worker/src/providers/pinterest.js';
import { QuoteAgent } from '../packages/worker/src/agent/quotes.js';
import { CardRenderer } from '../packages/worker/src/renderer/card.js';

async function main() {
  console.log('--- STARTING LIVE CARD GENERATION TEST ---');

  // 1. AI Quote Generation
  console.log('1. Generating AI quote for niche: "Couple Romance"...');
  const agent = new QuoteAgent();
  const idea = await agent.generateIdea({ nicheName: 'Couple Romance' });
  console.log(`✓ Quote: "${idea.quote}"`);
  console.log(`✓ Caption: "${idea.caption.slice(0, 80)}..."`);

  // 2. Pinterest Aesthetic Discovery
  console.log('2. Searching aesthetic visual backgrounds...');
  const pinterest = new PinterestSearchProvider();
  const bgCandidates = await pinterest.search({
    query: idea.bg_queries[0] || 'vintage 90s film couple',
    limit: 3,
  });
  console.log(`✓ Found ${bgCandidates.length} high-res visual candidates`);
  const chosenBg = bgCandidates[0];
  console.log(`✓ Selected visual: ${chosenBg.title} (${chosenBg.url})`);

  // 3. Card Rendering (1080x1350 Instagram Portrait)
  console.log('3. Rendering 1080x1350 aesthetic card with Sharp & SVG overlays...');
  const renderer = new CardRenderer();
  const card = await renderer.render({
    imageUrl: chosenBg.url,
    quoteText: idea.quote,
    authorOrBrand: '@your_creator_page',
    aspectRatio: '4/5',
    scrimOpacity: 0.55,
  });

  const outDir = path.resolve(process.cwd(), 'assets');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'sample-card.jpg');
  fs.writeFileSync(outPath, card.buffer);

  console.log(`✓ Render SUCCESS! Size: ${(card.sizeBytes / 1024).toFixed(1)} KB`);
  console.log(`✓ File saved to: ${outPath}`);
  console.log('--- TEST FINISHED SUCCESSFULLY ---');
}

main().catch(console.error);

