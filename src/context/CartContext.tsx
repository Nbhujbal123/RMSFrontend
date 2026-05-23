import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  image: string
  description: string
  foodType: 'veg' | 'non-veg'
  spiceLevel: 'mild' | 'medium' | 'hot'
}

export interface CartItem extends MenuItem {
  quantity: number
  spiceLevel: 'mild' | 'medium' | 'hot'
}

interface CartContextType {
  cart: CartItem[]
  cartAnimation: boolean
  showToast: boolean
  lastAddedItem: string | null
  tableNumber: string | null
  addToCart: (item: MenuItem, spiceLevel?: 'mild' | 'medium' | 'hot') => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  hideToast: () => void
  setTableNumber: (table: string | null) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartAnimation, setCartAnimation] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null)
  const [tableNumber, setTableNumber] = useState<string | null>(null)

  // Detect table from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tableParam = urlParams.get('table')
    if (tableParam) {
      setTableNumber(tableParam)
      localStorage.setItem('tableNumber', tableParam)
    } else {
      // Check localStorage for previously saved table
      const savedTable = localStorage.getItem('tableNumber')
      if (savedTable) {
        setTableNumber(savedTable)
      }
    }
  }, [])

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    console.log('Loading cart from localStorage:', savedCart)
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      console.log('Parsed cart:', parsedCart)
      setCart(parsedCart)
    } else {
      console.log('No cart in localStorage')
    }
  }, [])

  useEffect(() => {
    console.log('Saving cart to localStorage:', cart)
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])



  const addToCart = (item: MenuItem, spiceLevel: 'mild' | 'medium' | 'hot' = 'medium') => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id && cartItem.spiceLevel === spiceLevel)
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id && cartItem.spiceLevel === spiceLevel
          
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      } else {
        return [...prevCart, { ...item, quantity: 1, spiceLevel }]
      }
    })
    // Trigger bounce animation
    setCartAnimation(true)
    setTimeout(() => setCartAnimation(false), 600)
    // Show toast notification
    setLastAddedItem(item.name)
    setShowToast(true)
  }

  const hideToast = () => {
    setShowToast(false)
  }

  const removeFromCart = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      )
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const value: CartContextType = {
    cart,
    cartAnimation,
    showToast,
    lastAddedItem,
    tableNumber,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    hideToast,
    setTableNumber: (table: string | null) => {
      setTableNumber(table)
      if (table) {
        localStorage.setItem('tableNumber', table)
      } else {
        localStorage.removeItem('tableNumber')
      }
    }
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}