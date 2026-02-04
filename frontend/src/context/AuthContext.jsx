/**
 * @fileoverview Authentication Context Provider
 * 
 * Manages global authentication state and provides authentication methods
 * to all components throughout the application. Uses Firebase Authentication
 * for user management.
 */

/* eslint-disable react-refresh/only-export-components */
import {  createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/firebase.config";
import { 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    signOut 
} from "firebase/auth";

// Create authentication context
const AuthContext =  createContext();

/**
 * Custom hook to access authentication context
 * 
 * Provides easy access to authentication state and methods from any component.
 * Must be used within AuthProvide component tree.
 * 
 * @returns {Object} Authentication context value with user state and auth methods
 * @throws {Error} If used outside of AuthProvide component
 */
export const useAuth = () => {
    return useContext(AuthContext)
}

// Initialize Google authentication provider
const googleProvider = new GoogleAuthProvider();

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication context to all child components.
 * Manages:
 * - Current user state
 * - Loading state during auth operations
 * - Email/password registration and login
 * - Google OAuth sign-in
 * - User logout
 * - Automatic auth state persistence
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to auth context
 * @returns {JSX.Element} Provider component wrapping children
 */
export const AuthProvide = ({children}) => {
    // Current authenticated user object (null if not logged in)
    const [currentUser, setCurrentUser] = useState(null);
    
    // Loading state for auth operations (prevents premature redirects)
    const [loading, setLoading] = useState(true);

    /**
     * Register a new user with email and password
     * 
     * @param {string} email - User's email address
     * @param {string} password - User's password (will be hashed by Firebase)
     * @returns {Promise} Firebase user creation promise
     */
    const registerUser = async (email, password) => {
        return await createUserWithEmailAndPassword(auth, email, password);
    }

    /**
     * Log in an existing user with email and password
     * 
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Promise} Firebase sign-in promise
     */
    const loginUser = async (email, password) => {
        return await signInWithEmailAndPassword(auth, email, password)
    }

    /**
     * Sign in using Google OAuth popup
     * 
     * Opens a popup window for Google authentication.
     * Automatically creates account if user is new.
     * 
     * @returns {Promise} Firebase sign-in with popup promise
     */
    const signInWithGoogle = async () => {
        return await signInWithPopup(auth, googleProvider)
    }

    /**
     * Log out the current user
     * 
     * Signs out the user from Firebase and clears the auth state.
     * 
     * @returns {Promise} Firebase sign-out promise
     */
    const logout = () => {
        return signOut(auth)
    }

    /**
     * Effect: Monitor authentication state changes
     * 
     * Sets up a listener for Firebase auth state changes.
     * Automatically updates currentUser when user logs in/out.
     * Persists authentication across page refreshes.
     */
    useEffect(() => {
        const unsubscribe =  onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);

            // Extract user data if authenticated
            if(user) {
                const {email, displayName, photoURL} = user;
                // eslint-disable-next-line no-unused-vars
                const userData = {
                    email, 
                    username: displayName, 
                    photo: photoURL
                } 
            }
        })

        // Cleanup: Unsubscribe from auth state listener on unmount
        return () => unsubscribe();
    }, [])

    /**
     * Context value object
     * Contains all authentication state and methods available to consumers
     */
    const value = {
        currentUser,      // Current user object or null
        loading,          // Loading state for auth operations
        registerUser,     // Function to register new users
        loginUser,        // Function to log in existing users
        signInWithGoogle, // Function for Google OAuth
        logout            // Function to log out users
    }
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}