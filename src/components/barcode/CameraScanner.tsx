import { useEffect, useRef, useState } from 'react'
import { Box, IconButton, Typography, alpha } from '@mui/material'
import { Close as CloseIcon, CameraAlt, FlashOn, FlashOff } from '@mui/icons-material'
import Quagga from '@ericblade/quagga2'

interface CameraScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  enabled?: boolean
}

export function CameraScanner({ onScan, onClose, enabled = true }: CameraScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!enabled || !scannerRef.current) return

    const config: any = {
      inputStream: {
        type: 'LiveStream' as const,
        target: scannerRef.current,
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: 'environment',
          aspectRatio: { min: 1, max: 2 },
        },
      },
      locator: {
        patchSize: 'medium' as const,
        halfSample: true,
      },
      numOfWorkers: navigator.hardwareConcurrency || 2,
      decoder: {
        readers: [
          'ean_reader',
          'ean_8_reader',
          'code_128_reader',
          'code_39_reader',
          'code_39_vin_reader',
          'codabar_reader',
          'upc_reader',
          'upc_e_reader',
          'i2of5_reader',
          '2of5_reader',
          'code_93_reader',
        ],
        debug: {
          showCanvas: false,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showRemainingPatchLabels: false,
          boxFromPatches: {
            showTransformed: false,
            showTransformedBox: false,
            showBB: false,
          },
        },
      },
      locate: true,
      frequency: 10,
    }

    Quagga.init(config, (err) => {
      if (err) {
        console.error('Erro ao iniciar Quagga:', err)
        setError('Erro ao acessar a câmera. Verifique as permissões.')
        return
      }

      // Verifica suporte a flash
      const stream = Quagga.CameraAccess.getActiveStreamLabel()
      if (stream) {
        const videoTrack = Quagga.CameraAccess.getActiveTrack()
        if (videoTrack) {
          streamRef.current = new MediaStream([videoTrack])
          const capabilities = videoTrack.getCapabilities() as any
          setHasFlash(!!capabilities?.torch)
        }
      }

      Quagga.start()
    })

    // Handler de detecção
    const handleDetected = (result: any) => {
      if (!result || !result.codeResult) return

      const code = result.codeResult.code
      const errors = result.codeResult.decodedCodes
        .filter((x: any) => x.error !== undefined)
        .map((x: any) => x.error)

      const avgError = errors.reduce((a: number, b: number) => a + b, 0) / errors.length

      // Só aceita leituras com boa qualidade
      if (avgError < 0.1) {
        playBeep()
        vibrate()
        onScan(code)
        Quagga.stop()
        onClose()
      }
    }

    Quagga.onDetected(handleDetected)

    return () => {
      Quagga.offDetected(handleDetected)
      Quagga.stop()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [enabled, onScan, onClose])

  const toggleFlash = async () => {
    if (!streamRef.current) return

    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return

    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn } as any],
      })
      setFlashOn(!flashOn)
    } catch (err) {
      console.error('Erro ao alternar flash:', err)
    }
  }

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
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
        }}
      >
        <Typography variant="h6" color="white">
          Escanear Código de Barras
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasFlash && (
            <IconButton onClick={toggleFlash} sx={{ color: 'white' }}>
              {flashOn ? <FlashOff /> : <FlashOn />}
            </IconButton>
          )}
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10001,
            textAlign: 'center',
            p: 3,
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

      {/* Scanner */}
      <Box
        ref={scannerRef}
        sx={{
          flex: 1,
          position: 'relative',
          '& video': {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          },
          '& canvas': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          },
        }}
      />

      {/* Overlay de área de scan */}
      {!error && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: 400,
            height: 200,
            border: '3px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            boxShadow: (theme) => `0 0 0 9999px ${alpha(theme.palette.common.black, 0.5)}`,
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              width: 30,
              height: 30,
              border: '4px solid',
              borderColor: 'primary.main',
            },
            '&::before': {
              top: -4,
              left: -4,
              borderRight: 'none',
              borderBottom: 'none',
              borderTopLeftRadius: 8,
            },
            '&::after': {
              top: -4,
              right: -4,
              borderLeft: 'none',
              borderBottom: 'none',
              borderTopRightRadius: 8,
            },
          }}
        >
          {/* Linha de scan animada */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              bgcolor: 'primary.main',
              boxShadow: (theme) => `0 0 10px ${theme.palette.primary.main}`,
              animation: 'scan 2s ease-in-out infinite',
              '@keyframes scan': {
                '0%, 100%': { top: '10%' },
                '50%': { top: '90%' },
              },
            }}
          />
        </Box>
      )}

      {/* Footer */}
      {!error && (
        <Box
          sx={{
            p: 2,
            bgcolor: alpha('#000', 0.8),
            textAlign: 'center',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <Typography variant="body2" color="grey.400">
            Posicione o código de barras dentro da área destacada
          </Typography>
          <Typography variant="caption" color="grey.600">
            A leitura é automática
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
