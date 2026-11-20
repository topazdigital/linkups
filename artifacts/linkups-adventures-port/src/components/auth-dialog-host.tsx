import { useEffect } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useGetAuthSession } from '@workspace/api-client-react'
import { useLocation } from 'wouter'
import LoginPage from '@/app/login/page'
import RegisterPage from '@/app/register/page'
import { useAuthModal } from '@/components/auth-modal-context'

export function AuthDialogHost() {
  const { mode, closeAuth, setAuthMode } = useAuthModal()
  const [location, setLocation] = useLocation()
  const session = useGetAuthSession()

  useEffect(() => {
    if (session.data?.authenticated) closeAuth()
  }, [closeAuth, session.data?.authenticated])

  function handleOpenChange(open: boolean) {
    if (open) return
    closeAuth()
    if (location === '/login' || location === '/register') setLocation('/')
  }

  return (
    <DialogPrimitive.Root open={mode !== null} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="auth-dialog-overlay" />
        <DialogPrimitive.Content className="auth-dialog-content" data-testid="dialog-auth">
          <DialogPrimitive.Title className="auth-dialog-hidden-title">
            {mode === 'register' ? 'Create your LinkUps account' : 'Sign in to LinkUps'}
          </DialogPrimitive.Title>
          <button
            type="button"
            className="auth-dialog-close"
            aria-label="Close sign-in dialog"
            data-testid="button-close-auth"
            onClick={() => handleOpenChange(false)}
          >
            <X aria-hidden="true" />
          </button>
          {mode === 'register' ? (
            <RegisterPage
              inDialog
              onSwitchMode={setAuthMode}
              onSuccess={closeAuth}
            />
          ) : mode === 'login' ? (
            <LoginPage
              inDialog
              onSwitchMode={setAuthMode}
              onSuccess={closeAuth}
            />
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
