const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You'll need to add your Firebase service account key
// Download it from Firebase Console > Project Settings > Service Accounts
// For now, we'll initialize without credentials (you'll add them later)

if (!admin.apps.length) {
  try {
    // Temporary solution: Initialize without service account for development
    // This will work for token verification if you provide project ID
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id-here',
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.log('Firebase admin initialization error', error);
  }
}

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Unauthorized: No token provided' 
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Attach user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null
    };

    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ 
      message: 'Unauthorized: Invalid token',
      error: error.message 
    });
  }
};

module.exports = { verifyFirebaseToken };
