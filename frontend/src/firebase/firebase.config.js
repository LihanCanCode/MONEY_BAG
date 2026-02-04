/**
 * @fileoverview Firebase Configuration and Initialization
 * 
 * Configures and initializes the Firebase app instance for the application.
 * Firebase provides backend services including:
 * - Authentication (email/password, Google OAuth, etc.)
 * - Cloud Firestore database
 * - Cloud Storage for files
 * - Cloud Functions for serverless backend logic
 * 
 * All Firebase credentials are stored securely in environment variables.
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"

/**
 * Firebase Configuration Object
 * 
 * Contains all necessary credentials and settings to connect to Firebase services.
 * Values are loaded from environment variables (.env file) for security.
 * Never commit actual credentials to version control.
 * 
 * Environment variables required:
 * - VITE_FIREBASE_API_KEY: Firebase project API key
 * - VITE_FIREBASE_AUTH_DOMAIN: Authentication domain
 * - VITE_FIREBASE_PROJECT_ID: Unique project identifier
 * - VITE_FIREBASE_STORAGE_BUCKET: Cloud Storage bucket URL
 * - VITE_FIREBASE_MESSAGING_SENDER_ID: Cloud Messaging sender ID
 * - VITE_FIREBASE_APP_ID: Firebase app identifier
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/**
 * Initialize Firebase App
 * Creates the main Firebase application instance using the configuration above.
 * This app instance is used to access all Firebase services.
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication Instance
 * 
 * Provides authentication functionality for the application.
 * Exported for use throughout the app via AuthContext.
 * Supports multiple authentication methods:
 * - Email/Password
 * - Google OAuth
 * - Other providers can be added as needed
 */
export const auth = getAuth(app)