import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  alpha,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'
import { SecurityWarning } from '../components/common/SecurityWarning'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, isOnline } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Preencha todos os campos')
      return
    }

    const result = await login(email, password)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error || 'Erro ao fazer login')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: `
          radial-gradient(circle at 20% 20%, ${alpha('#00d9ff', 0.1)} 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, ${alpha('#ff6b35', 0.1)} 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0f 0%, #12121a 100%)
        `,
      }}
    >
      <SecurityWarning />
      
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #00d9ff 0%, #ff6b35 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: `0 8px 32px ${alpha('#00d9ff', 0.3)}`,
              }}
            >
              <InventoryIcon sx={{ fontSize: 40, color: '#000' }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00d9ff 0%, #ff6b35 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              StockCount
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Contagem de Inventário
            </Typography>
          </Box>

          {/* Offline warning */}
          {!isOnline && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Você está offline. O login requer conexão com a internet.
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || !isOnline}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || !isOnline}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading || !isOnline}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: 'inherit' }} />
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Footer */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 4,
            }}
          >
            Mercadinho Aratuba © 2024
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginPage

