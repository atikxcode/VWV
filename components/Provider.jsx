'use client'

import AuthProvider from '../Provider/AuthProvider'
import { CartProvider } from './hooks/useCart'
import { FavoritesProvider } from './hooks/useFavorites'

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          {children}
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  )
}
