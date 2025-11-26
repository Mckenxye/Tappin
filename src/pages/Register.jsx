import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postData, login } from '../services/api'
import { validateForm, isRequired, isValidEmail } from '../utils/validation'
import { ERROR_MESSAGES } from '../constants'
import logger from '../utils/logger'
import { getUserFromToken } from '../utils/jwt'
import { useAuth } from '../context/AuthContext'
import logoTappin from '../assets/logoTappin.png'

const Register = () => {
  const navigate = useNavigate()
  const { login: setAuthUser } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tier: 'Basico',
    max_students: '100'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false)
  const [onboardingUrl, setOnboardingUrl] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Actualizar formData
    const newFormData = {
      ...formData,
      [name]: value
    }
    
    // Auto-fill max_students según tier
    if (name === 'tier') {
      const tierLimits = {
        'Basico': '100',
        'oro': '500',
        'platino': '1000',
        'custom': ''
      }
      newFormData.max_students = tierLimits[value] || ''
    }
    
    setFormData(newFormData)
    
    // Limpiar error del campo específico
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleValidation = () => {
    const rules = {
      name: [
        { validator: isRequired, message: 'El nombre es requerido' }
      ],
      email: [
        { validator: isRequired, message: ERROR_MESSAGES.REQUIRED_FIELD },
        { validator: isValidEmail, message: ERROR_MESSAGES.INVALID_EMAIL }
      ],
      password: [
        { validator: isRequired, message: ERROR_MESSAGES.REQUIRED_FIELD }
      ],
      max_students: [
        { validator: isRequired, message: 'El máximo de estudiantes es requerido' },
        { 
          validator: (value) => {
            const num = parseInt(value)
            return !isNaN(num) && num > 0
          }, 
          message: 'Debe ser un número mayor a 0' 
        }
      ]
    }

    const validationErrors = validateForm(formData, rules)
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!handleValidation()) {
      return
    }

    setIsLoading(true)
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.general
      return newErrors
    })

    try {
      // Preparar datos para enviar al backend
      const clientData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        tier: formData.tier,
        max_students: parseInt(formData.max_students),
        super_admin_id: 1
      }

      logger.info('Registrando nuevo cliente:', clientData)

      // Crear cliente en el backend
      const response = await postData('/client/', clientData)
      logger.info('Cliente creado exitosamente:', response)

      // Hacer login automáticamente con las credenciales
      try {
        const loginResponse = await login({
          email: formData.email,
          password: formData.password
        })

        // Decodificar el token
        const token = loginResponse.token || loginResponse.access_token
        
        if (token) {
          const userData = getUserFromToken(token)
          
          if (userData) {
            // Guardar usuario en localStorage
            localStorage.setItem('user', JSON.stringify(userData))
            localStorage.setItem('isAuthenticated', 'true')
            
            // Guardar usuario en contexto
            setAuthUser(userData)
            
            logger.info('Login automático exitoso después del registro')
          }
        }
      } catch (loginError) {
        logger.error('Error en login automático:', loginError)
        // Si falla el login automático, continuar de todas formas
      }

      // Verificar si viene el link de onboarding de Stripe
      if (response.onboarding_url) {
        setOnboardingUrl(response.onboarding_url)
        setShowStripeOnboarding(true)
      } else {
        // Si no hay onboarding, redirigir al dashboard
        logger.info('Registro completado, redirigiendo al dashboard')
        navigate('/client-admin')
      }

    } catch (error) {
      logger.error('Error al registrar cliente:', error)
      
      let errorMessage = ''
      if (error.response?.status === 409 || error.response?.status === 400) {
        errorMessage = error.response?.data?.detail || 'El email ya está registrado'
      } else if (error.response?.status === 422) {
        errorMessage = 'Datos inválidos. Verifica los campos'
      } else {
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR || 'Error al conectar con el servidor'
      }

      setErrors({ general: errorMessage })
      setIsLoading(false)
    }
  }

  const handleGoToStripe = () => {
    if (onboardingUrl) {
      window.location.href = onboardingUrl
    }
  }

  const handleSkipStripe = () => {
    logger.info('Usuario omitió configuración de Stripe')
    navigate('/client-admin')
  }

  return (
    <div className="min-h-screen max-h-screen bg-light-bg dark:bg-dark-bg flex items-start justify-center px-5 sm:px-6 md:px-8 py-6 sm:py-8 transition-colors duration-200 overflow-y-auto">
      <div className="w-full max-w-[420px] sm:max-w-[480px] md:max-w-[520px] bg-light-bg dark:bg-dark-bg rounded-2xl sm:rounded-[20px] px-5 sm:px-7 md:px-8 py-6 sm:py-7 md:py-9 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-200">
        {/* Logo y Título */}
        <div className="text-center mb-5 sm:mb-6 md:mb-7">
          <div className="flex justify-center items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
            <img 
              src={logoTappin} 
              alt="Tappin Logo" 
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
            />
            <h1 className="text-light-text dark:text-dark-text text-xl sm:text-2xl md:text-3xl font-bold transition-colors duration-200">Tappin</h1>
          </div>
        </div>

        {!showStripeOnboarding ? (
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="text-center mb-3 sm:mb-4">
              <h2 className="text-light-text dark:text-dark-text text-lg sm:text-xl md:text-2xl font-semibold mb-2 transition-colors duration-200">
                Registro de Cliente
              </h2>
              <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px] md:text-sm leading-relaxed">
                Completa los campos para crear tu cuenta
              </p>
            </div>

            {/* Error general */}
            {errors.general && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 md:space-y-5">
              {/* Campo Nombre */}
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder=" "
                  className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                    errors.name 
                      ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                  }`}
                />
                <label 
                  htmlFor="name" 
                  className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                    formData.name 
                      ? 'top-2 text-xs' 
                      : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                  }`}
                >
                  Nombre completo
                </label>
                {errors.name && (
                  <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.name}</p>
                )}
              </div>

              {/* Campo Email */}
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=" "
                  className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                    errors.email 
                      ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                  }`}
                />
                <label 
                  htmlFor="email" 
                  className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                    formData.email 
                      ? 'top-2 text-xs' 
                      : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                  }`}
                >
                  Correo electrónico
                </label>
                {errors.email && (
                  <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.email}</p>
                )}
              </div>

              {/* Campo Contraseña */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder=" "
                  className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                    errors.password 
                      ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                  }`}
                />
                <label 
                  htmlFor="password" 
                  className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                    formData.password
                      ? 'top-2 text-xs' 
                      : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                  }`}
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[18px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10 p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg className="w-[22px] h-[22px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-[22px] h-[22px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.23 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.password}</p>
                )}
              </div>

              {/* Campo Tier */}
              <div className="relative">
                <select
                  id="tier"
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className="peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="Basico">Básico (100 estudiantes)</option>
                  <option value="oro">Oro (500 estudiantes)</option>
                  <option value="platino">Platino (1000 estudiantes)</option>
                  <option value="custom">Custom (personalizado)</option>
                </select>
                <label 
                  htmlFor="tier" 
                  className="absolute left-4 top-2 text-xs text-gray-400 transition-all duration-200 pointer-events-none"
                >
                  Plan de suscripción
                </label>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Campo Máximo de Estudiantes */}
              <div className="relative">
                <input
                  type="number"
                  id="max_students"
                  name="max_students"
                  value={formData.max_students}
                  onChange={handleChange}
                  min="0"
                  readOnly={formData.tier !== 'custom'}
                  placeholder=" "
                  className={`peer w-full px-4 pt-6 pb-2 text-[15px] sm:text-base bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-light-text dark:text-dark-text focus:outline-none transition-all ${
                    formData.tier !== 'custom' 
                      ? 'cursor-not-allowed opacity-60' 
                      : ''
                  } ${
                    errors.max_students 
                      ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border border-gray-300 dark:border-[#3a3a3c] focus:ring-2 focus:ring-[#FDB913] focus:border-transparent'
                  }`}
                />
                <label 
                  htmlFor="max_students" 
                  className={`absolute left-4 text-gray-400 transition-all duration-200 pointer-events-none ${
                    formData.max_students 
                      ? 'top-2 text-xs' 
                      : 'top-[18px] text-[15px] sm:text-base peer-focus:top-2 peer-focus:text-xs'
                  }`}
                >
                  Máximo de Estudiantes
                </label>
                {formData.tier !== 'custom' && (
                  <p className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs mt-1.5 ml-1">
                    Este valor se establece automáticamente según el plan seleccionado
                  </p>
                )}
                {errors.max_students && (
                  <p className="text-red-500 text-[13px] sm:text-sm mt-1.5 ml-1">{errors.max_students}</p>
                )}
              </div>

              {/* Botón Registrarse */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-bold py-3 sm:py-3.5 md:py-4 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:ring-offset-2 mt-2 sm:mt-3 text-sm sm:text-[15px] md:text-base shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </>
                ) : (
                  'Registrarse'
                )}
              </button>

              {/* Volver al login */}
              <div className="text-center mt-3 sm:mt-4">
                <p className="text-light-text-secondary dark:text-gray-400 text-xs sm:text-[13px] md:text-sm transition-colors duration-200 leading-relaxed">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-[#FDB913] hover:text-[#fcc000] font-semibold transition-colors"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              </div>
            </form>
          </div>
        ) : (
          // Pantalla de onboarding de Stripe
          <div className="text-center py-4 sm:py-6 space-y-5">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-12 h-12 sm:w-14 sm:h-14 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h3 className="text-light-text dark:text-dark-text text-xl sm:text-2xl font-bold mb-3">
              ¡Registro Exitoso!
            </h3>

            <p className="text-light-text-secondary dark:text-gray-400 text-sm sm:text-[15px] mb-5 leading-relaxed">
              Tu cuenta ha sido creada. Ahora necesitas configurar tu cuenta de Stripe para procesar pagos.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    Stripe es necesario para procesar pagos de manera segura. Puedes configurarlo ahora o más tarde desde tu panel.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoToStripe}
                className="w-full bg-[#FDB913] hover:bg-[#fcc000] active:bg-[#e5a711] text-black font-bold py-3.5 rounded-lg transition-all duration-200 text-[15px] sm:text-base shadow-sm hover:shadow-md"
              >
                Configurar Stripe ahora
              </button>

              <button
                onClick={handleSkipStripe}
                className="w-full bg-gray-100 dark:bg-[#2a2b2e] hover:bg-gray-200 dark:hover:bg-[#3a3a3c] text-light-text dark:text-dark-text font-medium py-3.5 rounded-lg transition-all duration-200 text-[15px] sm:text-base"
              >
                Configurar más tarde
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Register
