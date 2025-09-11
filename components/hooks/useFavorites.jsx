'use client'

import { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vwv-favorites');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch {
          setFavorites([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('vwv-favorites', JSON.stringify(favorites));
    }
  }, [favorites, isHydrated]);

  const toggleFavorite = (product) => {
    setFavorites(items => {
      const exists = items.find(item => item._id === product._id);
      if (exists) {
        return items.filter(item => item._id !== product._id);
      }
      return [...items, product];
    });
  };

  const isFavorite = (productId) => {
    return favorites.some(item => item._id === productId);
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      toggleFavorite,
      isFavorite,
      isHydrated,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}
