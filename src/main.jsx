import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Telegram Web App init
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#060911');
  tg.setBackgroundColor('#060911');
}

// Storage: Telegram CloudStorage (persists across devices) with localStorage fallback
window.storage = {
  async get(key) {
    return new Promise((resolve) => {
      if (tg?.CloudStorage) {
        tg.CloudStorage.getItem(key, (err, val) => {
          if (err || !val) {
            // fallback to localStorage
            const v = localStorage.getItem(key);
            resolve(v ? { value: v } : null);
          } else {
            resolve({ value: val });
          }
        });
      } else {
        const v = localStorage.getItem(key);
        resolve(v ? { value: v } : null);
      }
    });
  },
  async set(key, value) {
    // Always save to localStorage as backup
    localStorage.setItem(key, value);
    return new Promise((resolve) => {
      if (tg?.CloudStorage) {
        tg.CloudStorage.setItem(key, value, (err) => {
          resolve(err ? null : { key, value });
        });
      } else {
        resolve({ key, value });
      }
    });
  },
  async delete(key) {
    localStorage.removeItem(key);
    return new Promise((resolve) => {
      if (tg?.CloudStorage) {
        tg.CloudStorage.removeItem(key, () => resolve({ deleted: true }));
      } else {
        resolve({ deleted: true });
      }
    });
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
