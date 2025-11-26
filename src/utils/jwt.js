import { jwtDecode } from 'jwt-decode'
import logger from './logger'

/**
 * Decodifica un token JWT
 * @param {string} token - Token JWT a decodificar
 * @returns {Object|null} - Payload decodificado o null si hay error
 */
export const decodeToken = (token) => {
  try {
    if (!token) {
      logger.error('Token vacío o no proporcionado')
      return null
    }

    const decoded = jwtDecode(token)
    logger.info('Token decodificado exitosamente')
    
    return decoded
  } catch (error) {
    logger.error('Error al decodificar el token:', error)
    return null
  }
}

/**
 * Verifica si un token ha expirado
 * @param {string} token - Token JWT a verificar
 * @returns {boolean} - true si el token ha expirado
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token)
    
    if (!decoded || !decoded.exp) {
      return true
    }

    // exp viene en segundos, Date.now() en milisegundos
    const currentTime = Date.now() / 1000
    
    return decoded.exp < currentTime
  } catch (error) {
    logger.error('Error al verificar expiración del token:', error)
    return true
  }
}

/**
 * Obtiene información del usuario desde el token
 * @param {string} token - Token JWT
 * @returns {Object|null} - Información del usuario o null
 */
export const getUserFromToken = (token) => {
  try {
    const decoded = decodeToken(token)
    
    if (!decoded) {
      return null
    }

    // Normalizar el rol
    let normalizedRole = decoded.rol || decoded.role
    if (normalizedRole === 'client') {
      normalizedRole = 'client_admin'
    }

    return {
      id: decoded.id || decoded.sub,
      role: normalizedRole,
      rol: normalizedRole,
      email: decoded.email,
      name: decoded.name || '',
      stripe_account_id: decoded.stripe_account_id || null,
      exp: decoded.exp
    }
  } catch (error) {
    logger.error('Error al obtener usuario del token:', error)
    return null
  }
}

export default {
  decodeToken,
  isTokenExpired,
  getUserFromToken
}
