const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: './server/.env' });

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({
    credential: cert(serviceAccount)
  });
}
const db = getFirestore();

async function seed() {
  await db.collection('food').doc('test-food-123').set({
    title: 'Test Samosa',
    price: 15,
    description: 'Delicious test samosa',
    imageUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/samosa.jpg',
    category: 'popular',
    isAvailable: true,
    createdAt: new Date().toISOString()
  });
  console.log('Seeded food item');
}

seed().catch(console.error);
