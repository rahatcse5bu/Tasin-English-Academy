import 'reflect-metadata';
import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import { DeckSchema } from './schemas/deck.schema';
import { seedDecks } from './decks.seed';

/**
 * Standalone deck seeder:  npm run seed:decks        (upsert, keeps isPublished)
 *                          SEED_WIPE=1 npm run seed:decks   (drop first)
 */
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const Deck = mongoose.model('Deck', DeckSchema);
  await seedDecks(Deck as any, {
    wipe: process.env.SEED_WIPE === '1',
    log: (m) => console.log(m),
  });

  await mongoose.disconnect();
  console.log('Deck seed complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
