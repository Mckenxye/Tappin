import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logger from '../../../utils/logger'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [studentName, setStudentName] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay sesión activa
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    logger.info('=== PAYMENT SUCCESS PAGE ===')
    logger.info('Token exists:', !!token)
    logger.info('User exists:', !!user)
    
    if (!token || !user) {
      logger.warn('No hay sesión activa, redirigiendo al login')
      navigate('/', { replace: true })
      return
    }
    
    // Extraer parámetros de la URL
    const name = searchParams.get('student_name')
    const amt = searchParams.get('amount')
    
    logger.info('Student Name:', name)
    logger.info('Amount:', amt)
    
    setStudentName(name ? decodeURIComponent(name) : '')
    setAmount(amt || '')
    
    // Dar tiempo para que el webhook procese
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }, [searchParams, navigate])

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

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl p-8 border border-green-200 dark:border-green-900">
          <div className="text-center">
            {/* Icono de éxito */}
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
              ¡Pago Exitoso!
            </h1>

            {isLoading ? (
              <>
                <p className="text-light-text dark:text-dark-text mb-6">
                  Estamos procesando tu pago...
                </p>
                <div className="flex justify-center mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FDB913]"></div>
                </div>
              </>
            ) : (
              <>
                <p className="text-light-text dark:text-dark-text mb-2">
                  Los créditos se han acreditado automáticamente
                </p>
                
                {studentName && amount && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 my-6">
                    <p className="text-sm text-light-text dark:text-dark-text mb-2">
                      <span className="font-semibold">Estudiante:</span> {studentName}
                    </p>
                    <p className="text-sm text-light-text dark:text-dark-text">
                      <span className="font-semibold">Monto:</span> ${amount} MXN
                    </p>
                  </div>
                )}

                <p className="text-xs text-light-text-secondary dark:text-gray-400 mb-6">
                  Puedes verificar el saldo actualizado en tu dashboard
                </p>
              </>
            )}

            {/* Botón de volver */}
            <button
              onClick={handleGoBack}
              disabled={isLoading}
              className="w-full bg-[#FDB913] hover:bg-[#e5a710] text-dark-bg font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Información de ayuda */}
        <div className="mt-4 text-center">
          <p className="text-xs text-light-text-secondary dark:text-gray-400">
            Si tienes alguna duda o problema, contacta a soporte
          </p>
        </div>
      </div>
    </div>
  )
}
