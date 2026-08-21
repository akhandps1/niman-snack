const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('/Users/akhandpratapsingh/Downloads/niman-snacks-admin-2026-firebase-adminsdk-fbsvc-229386f128.json');

const app = initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth(app);
const db = getFirestore(app);

async function fixAdmin() {
  try {
    const email = 'admin@nimansnacks.com';
    const user = await auth.getUserByEmail(email);
    console.log("User UID:", user.uid);
    
    await db.collection('users').doc(user.uid).set({
      email: email,
      role: 'admin',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log("Successfully fixed admin role in Firestore!");
    process.exit(0);
  } catch(e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

fixAdmin();
