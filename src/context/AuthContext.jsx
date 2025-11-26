import { createContext, useContext, useState, useEffect } from 'react'
import { isTokenExpired, getUserFromToken } from '../utils/jwt'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // Normalizar user shape
  const normalizeUser = (u) => {
    if (!u) return null
    return {
      id: u.id || u._id || null,
      role: u.role || u.rol || null,
      rol: u.rol || u.role || null,
      name: u.name || u.nombre || '',
      email: u.email || ''
    }
  }

  // Inicializar desde token si existe y es válido
  const initializeAuth = () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        return { user: null, isAuth: false }
      }

      // Verificar si el token ha expirado
      if (isTokenExpired(token)) {
        // Limpiar datos si el token expiró
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('isAuthenticated')
        return { user: null, isAuth: false }
      }

      // Obtener usuario del token
      const userData = getUserFromToken(token)
      
      if (!userData) {
        return { user: null, isAuth: false }
      }

      // Actualizar localStorage con datos del token
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isAuthenticated', 'true')

      return { user: normalizeUser(userData), isAuth: true }
    } catch (e) {
      console.error('Error al inicializar autenticación:', e)
      return { user: null, isAuth: false }
    }
  }

  const { user: initialUser, isAuth: initialAuth } = initializeAuth()
  const [user, setUser] = useState(initialUser)
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth)

  // Roles disponibles
  const ROLES = {
    SUPER_ADMIN: 'super_admin',
    BRANCH: 'branch',
    CLIENT_ADMIN: 'client_admin',
    PARENT: 'parent',
    STAFF: 'staff'
  }

  const login = (userData) => {
    const normalized = normalizeUser(userData)
    setUser(normalized)
    setIsAuthenticated(true)
    // Guardar en localStorage para persistencia
    localStorage.setItem('user', JSON.stringify(normalized))
    localStorage.setItem('isAuthenticated', 'true')
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('token')
  }

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return user?.role === role
  }

  // Verificar si el usuario tiene uno de varios roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
    ROLES
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
