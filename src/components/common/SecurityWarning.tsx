import { Alert, AlertTitle, Box } from '@mui/material'
import { Security as SecurityIcon } from '@mui/icons-material'

export function SecurityWarning() {
  const isSecureContext = window.isSecureContext
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  // Não mostrar aviso em localhost ou em contexto seguro
  if (isLocalhost || isSecureContext) {
    return null
  }

  return (
    <Box sx={{ p: 2 }}>
      <Alert severity="warning" icon={<SecurityIcon />}>
        <AlertTitle>Conexão não segura (HTTP)</AlertTitle>
        Para usar a câmera e instalar o aplicativo, acesse via HTTPS.
        <br />
        <strong>Em produção na Vercel, isso funcionará automaticamente!</strong>
      </Alert>
    </Box>
  )
}

export default SecurityWarning

