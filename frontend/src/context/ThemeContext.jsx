/**
 * @fileoverview Theme Context Provider
 *
 * Manages the application's color theme (dark / light mode) via
 * React Context, with persistence in localStorage and automatic
 * respect for the user's OS-level color-scheme preference on first visit.
 *
 * Usage:
 *  - Wrap the app in <ThemeProvider> (done in main.jsx)
 *  - In any component: const { isDarkMode, toggleTheme } = useTheme();
 *
 * @module context/ThemeContext
 */
import { createContext, useContext, useState, useEffect } from 'react';

/** @type {React.Context<{ isDarkMode: boolean, toggleTheme: Function }>} */
const ThemeContext = createContext();

/**
 * Custom hook for consuming the theme context.
 * @returns {{ isDarkMode: boolean, toggleTheme: Function }}
 */
export const useTheme = () => useContext(ThemeContext);

/**
 * ThemeProvider Component
 *
 * Provides `isDarkMode` state and a `toggleTheme` function to the
 * entire component tree. The initial theme is resolved from:
 *  1. localStorage ('theme' key) — if the user previously chose one
 *  2. OS-level prefers-color-scheme media query
 *  3. Defaults to dark mode
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const ThemeProvider = ({ children }) => {
    /**
     * isDarkMode state — initialized lazily via callback so
     * localStorage / matchMedia reads happen only once.
     */
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            // 1. Check localStorage for a previously saved preference
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                return savedTheme === 'dark';
            }
            // 2. Fall back to the operating system's color scheme
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return true; // 3. Default to dark mode (SSR or unknown env)
    });

    /**
     * Effect: Sync the <html> element's class list and localStorage
     * whenever isDarkMode changes, so Tailwind's `dark:` variants
     * and CSS selectors respond accordingly.
     */
    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    /** Toggle between dark and light mode */
    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
