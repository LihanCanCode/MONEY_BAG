/**
 * @fileoverview Material-UI Theme Configuration
 * 
 * Defines the global theme settings for Material-UI components including:
 * - Color palette (primary, secondary, success, error, warning, info)
 * - Typography settings and font families
 * - Shape properties (border radius)
 * - Component styling defaults
 */

import { createTheme } from '@mui/material/styles';

/**
 * Custom Material-UI Theme
 * 
 * Creates a modern, cohesive design system with:
 * - Indigo primary color for main UI elements
 * - Pink secondary color for accent elements
 * - Soft gray background for comfortable viewing
 * - Consistent border radius for modern look
 * - Custom typography with Inter font family
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    
    // Primary color - Used for main actions and important UI elements
    primary: {
      main: '#6366f1', // Indigo - Modern and professional
      contrastText: '#fff',
    },
    
    // Secondary color - Used for accents and highlights
    secondary: {
      main: '#f472b6', // Pink - Eye-catching and friendly
      contrastText: '#fff',
    },
    
    // Background colors for different surfaces
    background: {
      default: '#0f172a', // Dark navy
      paper: '#1e293b', // Elevated dark surface
    },
    
    text: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
    },
    
    // Semantic colors for user feedback
    success: {
      main: '#22c55e', // Green - Positive actions and confirmations
    },
    error: {
      main: '#ef4444', // Red - Errors and destructive actions
    },
    warning: {
      main: '#f59e42', // Orange - Warnings and cautions
    },
    info: {
      main: '#38bdf8', // Light blue - Informational messages
    },
  },
  
  // Typography configuration for consistent text styling
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h1: { fontWeight: 700 }, // Bold headings for main titles
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 }, // Semi-bold for section headings
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 }, // Medium weight for smaller headings
    h6: { fontWeight: 500 },
    button: { 
      textTransform: 'none', // Disable uppercase transformation for readability
      fontWeight: 600 
    },
  },
  
  // Shape configuration for border radius
  shape: {
    borderRadius: 16, // Rounded corners for modern appearance
  },
});

export default theme;
