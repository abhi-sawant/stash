import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BookmarksProvider } from './contexts/BookmarksContext';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import { initDB } from './lib/db';
import './index.css';

// Initialize database
initDB().catch(console.error);

// Set basename for GitHub Pages deployment
const basename = import.meta.env.MODE === 'production' ? '/bookmark' : '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <AuthProvider>
          <BookmarksProvider>
            <App />
          </BookmarksProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
