import React from 'react'
import { AlertTriangle, X, Trash2, CheckCircle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case 'info':
        return <CheckCircle className="w-6 h-6 text-blue-600" />
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-600" />
    }
  }

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      default:
        return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleBackdropClick}
      >
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        ></div>

        {/* Centrage vertical */}
        <span 
          className="hidden sm:inline-block sm:align-middle sm:h-screen" 
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 animate-fade-in">
          {/* Bouton de fermeture */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={onClose}
              disabled={isLoading}
            >
              <span className="sr-only">Fermer</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            {/* Icône */}
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
              type === 'danger' ? 'bg-red-100' :
              type === 'warning' ? 'bg-yellow-100' :
              type === 'info' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {getIcon()}
            </div>

            {/* Contenu */}
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 
                className="text-lg leading-6 font-medium text-gray-900" 
                id="modal-title"
              >
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getButtonStyles()}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Suppression...
                </>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook pour gérer l'état du dialog
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<{
    title: string
    message: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
  } | null>(null)

  const openDialog = (dialogConfig: {
    title: string
    message: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
  }) => {
    setConfig(dialogConfig)
    setIsOpen(true)
  }

  const closeDialog = () => {
    setIsOpen(false)
    setConfig(null)
  }

  const confirmDialog = config ? (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={closeDialog}
      onConfirm={() => {
        config.onConfirm()
        closeDialog()
      }}
      title={config.title}
      message={config.message}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      type={config.type}
    />
  ) : null

  return {
    openDialog,
    closeDialog,
    confirmDialog
  }
}
