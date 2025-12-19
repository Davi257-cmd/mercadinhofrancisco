import { useState, useEffect } from 'react'
import { Box, Button, IconButton, Snackbar, Alert } from '@mui/material'
import { 
  GetApp as InstallIcon,
  Close as CloseIcon,
} from '@mui/icons-material'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [showSnackbar, setShowSnackbar] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowSnackbar(true)
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA instalado')
    }

    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  const handleDismiss = () => {
    setShowInstallButton(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Não mostrar se foi dismissado
  if (localStorage.getItem('pwa-install-dismissed') === 'true') {
    return null
  }

  if (!showInstallButton) {
    return null
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 80,
          left: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: 8,
            border: (theme) => `2px solid ${theme.palette.primary.main}`,
            maxWidth: 400,
            width: '100%',
          }}
        >
          <InstallIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ fontWeight: 600, mb: 0.5 }}>Instalar App</Box>
            <Box sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
              Use offline e acesse rapidamente
            </Box>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={handleInstallClick}
            sx={{ minWidth: 80 }}
          >
            Instalar
          </Button>
          <IconButton size="small" onClick={handleDismiss}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setShowSnackbar(false)}>
          Para instalar: No Chrome, toque no menu (⋮) e selecione "Instalar app"
        </Alert>
      </Snackbar>
    </>
  )
}

export default InstallPWA

