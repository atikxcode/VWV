'use client'
import React, { createContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth'
import app from '../Firebase/firebase.config'

export const AuthContext = createContext(null)
const auth = getAuth(app)

const AuthProvider = ({ children }) => {
  // Google Provider
  const googleProvider = new GoogleAuthProvider()

  // Apple Provider
  const appleProvider = new OAuthProvider('apple.com')

  // Google Sign-in
  const handleGoogleSignIn = () => {
    return signInWithPopup(auth, googleProvider)
  }

  // Apple Sign-in
  const handleAppleSignIn = () => {
    return signInWithPopup(auth, appleProvider)
  }

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const createUser = (email, password) => {
    setLoading(true)
    return createUserWithEmailAndPassword(auth, email, password)
  }

  const logOut = () => {
    setLoading(true)
    return signOut(auth)
  }

  const updateUser = (user, name, photo) => {
    return updateProfile(user, {
      displayName: name,
      photoURL: photo,
    })
  }

  const signIn = (email, password) => {
    setLoading(true)
    return signInWithEmailAndPassword(auth, email, password)
  }

  const passwordReset = (email) => {
    setLoading(true)
    return sendPasswordResetEmail(auth, email)
  }

  const verifyEmail = () => {
    setLoading(true)
    return sendEmailVerification(auth.currentUser)
  }

  useEffect(() => {
    const unSubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => {
      unSubscribe()
    }
  }, [])

  const authInfo = {
    user,
    createUser,
    logOut,
    signIn,
    handleGoogleSignIn,
    handleAppleSignIn,
    loading,
    updateUser,
    verifyEmail,
    passwordReset,
  }

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  )
}

export default AuthProvider
