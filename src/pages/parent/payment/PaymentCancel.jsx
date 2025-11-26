import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logger from '../../../utils/logger'

export default function PaymentCancel() {
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar si hay sesión activa
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    logger.info('=== PAYMENT CANCEL PAGE ===')
    logger.info('Token exists:', !!token)
    logger.info('User exists:', !!user)
    
    if (!token || !user) {
      logger.warn('No hay sesión activa, redirigiendo al login')
      navigate('/', { replace: true })
      return
    }
  }, [navigate])

  const handleGoBack = () => {
    const userDataStr = localStorage.getItem('user')
    if (userDataStr) {
      const userData = JSON.parse(userDataStr)
      const role = userData.role || userData.rol
      
      if (role === 'staff') {
        navigate('/staff')
      } else {
        navigate('/parent')
      }
    } else {
      navigate('/parent')
    }
  }

  const handleRetry = () => {
    navigate(-1) // Volver a la página anterior
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl p-8 border border-yellow-200 dark:border-yellow-900">
          <div className="text-center">
            {/* Icono de advertencia */}
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              Pago Cancelado
            </h1>

            <p className="text-light-text dark:text-dark-text mb-6">
              El proceso de pago fue cancelado. No se realizó ningún cargo.
            </p>

            {/* Información adicional */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-light-text dark:text-dark-text">
                <span className="font-semibold">Nota:</span> Puedes intentar realizar el pago nuevamente cuando lo desees.
              </p>
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-[#FDB913] hover:bg-[#e5a710] text-dark-bg font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Intentar de Nuevo
              </button>
              
              <button
                onClick={handleGoBack}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-light-text dark:text-dark-text font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Información de ayuda */}
        <div className="mt-4 text-center">
          <p className="text-xs text-light-text-secondary dark:text-gray-400">
            Si tienes problemas para completar el pago, contacta a soporte
          </p>
        </div>
      </div>
    </div>
  )
}
