import { useState, useEffect, useRef } from 'react'
import { 
  Box, 
  IconButton, 
  Typography, 
  CircularProgress,
  alpha 
} from '@mui/material'
import { 
  FlashOn, 
  FlashOff, 
  Close as CloseIcon,
  CameraAlt 
} from '@mui/icons-material'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface CameraScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  enabled?: boolean
}

export function CameraScanner({ onScan, onClose, enabled = true }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [hasFlash, setHasFlash] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!enabled) return

    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    const startScanning = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')
        
        // Prefer back camera on mobile
        const backCamera = videoDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('traseira')
        )
        
        const deviceId = backCamera?.deviceId || videoDevices[0]?.deviceId

        if (!deviceId) {
          throw new Error('Nenhuma câmera encontrada')
        }

        await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              const barcode = result.getText()
              onScan(barcode)
              playBeep()
              vibrate()
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error('Scan error:', err)
            }
          }
        )

        // Check for flash support
        if (videoRef.current?.srcObject) {
          streamRef.current = videoRef.current.srcObject as MediaStream
          const track = streamRef.current.getVideoTracks()[0]
          const capabilities = track?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean }
          setHasFlash(!!capabilities?.torch)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Camera error:', err)
        setError(err instanceof Error ? err.message : 'Erro ao acessar câmera')
        setIsLoading(false)
      }
    }

    startScanning()

    return () => {
      reader.reset()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [enabled, onScan])

  const toggleFlash = async () => {
    if (!streamRef.current) return

    const track = streamRef.current.getVideoTracks()[0]
    if (track) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as MediaTrackConstraintSet]
        })
        setFlashEnabled(!flashEnabled)
      } catch (err) {
        console.error('Flash toggle error:', err)
      }
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
          bgcolor: alpha('#000', 0.5),
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      >
        <Typography variant="h6" color="white">
          Escanear Código
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasFlash && (
            <IconButton onClick={toggleFlash} sx={{ color: 'white' }}>
              {flashEnabled ? <FlashOff /> : <FlashOn />}
            </IconButton>
          )}
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Video */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {isLoading && (
          <Box sx={{ position: 'absolute', zIndex: 2 }}>
            <CircularProgress sx={{ color: 'primary.main' }} />
          </Box>
        )}

        {error && (
          <Box
            sx={{
              position: 'absolute',
              zIndex: 2,
              textAlign: 'center',
              p: 3,
            }}
          >
            <CameraAlt sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography color="error" variant="h6">
              {error}
            </Typography>
            <Typography color="grey.500" variant="body2" sx={{ mt: 1 }}>
              Verifique as permissões da câmera
            </Typography>
          </Box>
        )}

        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          playsInline
          muted
        />

        {/* Scanning overlay */}
        {!isLoading && !error && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              maxWidth: 300,
              height: 200,
              border: '3px solid',
              borderColor: 'primary.main',
              borderRadius: 2,
              boxShadow: (theme) => `0 0 0 9999px ${alpha(theme.palette.common.black, 0.5)}`,
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                width: 20,
                height: 20,
                border: '3px solid',
                borderColor: 'primary.main',
              },
              '&::before': {
                top: -3,
                left: -3,
                borderRight: 'none',
                borderBottom: 'none',
                borderTopLeftRadius: 8,
              },
              '&::after': {
                top: -3,
                right: -3,
                borderLeft: 'none',
                borderBottom: 'none',
                borderTopRightRadius: 8,
              },
            }}
          >
            {/* Scanning line animation */}
            <Box
              sx={{
                position: 'absolute',
                left: 10,
                right: 10,
                height: 2,
                bgcolor: 'primary.main',
                boxShadow: (theme) => `0 0 10px ${theme.palette.primary.main}`,
                animation: 'scan 2s ease-in-out infinite',
                '@keyframes scan': {
                  '0%, 100%': { top: 10 },
                  '50%': { top: 'calc(100% - 12px)' },
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Footer hint */}
      <Box
        sx={{
          p: 2,
          bgcolor: alpha('#000', 0.5),
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="grey.400">
          Posicione o código de barras dentro da área
        </Typography>
      </Box>
    </Box>
  )
}

function playBeep() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
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

