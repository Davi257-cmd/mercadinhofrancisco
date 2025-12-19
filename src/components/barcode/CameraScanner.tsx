import { useEffect, useRef, useState } from 'react'
import { Box, IconButton, Typography, CircularProgress, alpha } from '@mui/material'
import { Close as CloseIcon, CameraAlt } from '@mui/icons-material'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface CameraScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  enabled?: boolean
}

export function CameraScanner({ onScan, onClose, enabled = true }: CameraScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const scannerId = 'qr-reader'
    
    try {
      // Configuração do scanner
      const scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10, // Frames por segundo
          qrbox: { width: 250, height: 250 }, // Área de escaneamento
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true, // Mostra botão de flash se disponível
          formatsToSupport: [
            0,  // QR_CODE
            1,  // EAN_13
            2,  // EAN_8
            3,  // CODE_39
            4,  // CODE_93
            5,  // CODE_128
            6,  // UPC_A
            7,  // UPC_E
            8,  // ITF
          ],
        },
        false // verbose
      )

      scannerRef.current = scanner

      // Callback de sucesso
      const onScanSuccess = (decodedText: string) => {
        playBeep()
        vibrate()
        onScan(decodedText)
        scanner.clear()
        onClose()
      }

      // Callback de erro (ignorar)
      const onScanFailure = () => {
        // Não fazer nada - é normal falhar enquanto procura código
      }

      // Renderizar o scanner
      scanner.render(onScanSuccess, onScanFailure)
      
      setIsLoading(false)
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err)
      setError('Erro ao acessar a câmera. Verifique as permissões.')
      setIsLoading(false)
    }

    // Cleanup
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [enabled, onScan, onClose])

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: '#000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          bgcolor: alpha('#000', 0.8),
          position: 'relative',
          zIndex: 10000,
        }}
      >
        <Typography variant="h6" color="white">
          Escanear Código
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Loading */}
      {isLoading && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <CircularProgress sx={{ color: 'primary.main' }} />
          <Typography color="white">Iniciando câmera...</Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            p: 3,
            textAlign: 'center',
          }}
        >
          <CameraAlt sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography color="error" variant="h6" gutterBottom>
            {error}
          </Typography>
          <Typography color="grey.500" variant="body2">
            Certifique-se de permitir o acesso à câmera
          </Typography>
        </Box>
      )}

      {/* Scanner Container */}
      <Box
        id="qr-reader"
        sx={{
          flex: 1,
          display: isLoading || error ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& video': {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          },
          '& #qr-shaded-region': {
            border: '3px solid #00d9ff !important',
            borderRadius: '12px !important',
          },
        }}
      />

      {/* Footer hint */}
      {!isLoading && !error && (
        <Box
          sx={{
            p: 2,
            bgcolor: alpha('#000', 0.8),
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="grey.400">
            Posicione o código dentro da área destacada
          </Typography>
        </Box>
      )}
    </Box>
  )
}

function playBeep() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 1200
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (error) {
    console.log('Audio not available:', error)
  }
}

function vibrate() {
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

export default CameraScanner
