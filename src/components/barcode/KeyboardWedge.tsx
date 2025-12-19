import { useRef, useEffect } from 'react'
import { Box, Typography, alpha } from '@mui/material'
import { Keyboard as KeyboardIcon } from '@mui/icons-material'

interface KeyboardWedgeProps {
  onScan: (barcode: string) => void
  enabled?: boolean
  showIndicator?: boolean
}

export function KeyboardWedge({ 
  onScan, 
  enabled = true, 
  showIndicator = true 
}: KeyboardWedgeProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const bufferRef = useRef('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (enabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [enabled])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (bufferRef.current.length >= 4) {
        onScan(bufferRef.current)
        playBeep()
        vibrate()
      }
      bufferRef.current = ''
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      return
    }

    // Set timeout to clear buffer if no more keys
    timeoutRef.current = setTimeout(() => {
      if (bufferRef.current.length >= 4) {
        onScan(bufferRef.current)
        playBeep()
        vibrate()
      }
      bufferRef.current = ''
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }, 100)
  }

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value
    bufferRef.current = value
  }

  const handleBlur = () => {
    // Re-focus after a short delay
    setTimeout(() => {
      if (enabled && inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  return (
    <>
      {/* Hidden input for keyboard wedge */}
      <input
        ref={inputRef}
        className="barcode-input"
        type="text"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onBlur={handleBlur}
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          width: 0,
          height: 0,
        }}
        disabled={!enabled}
      />

      {/* Visual indicator */}
      {showIndicator && enabled && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
            border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
          }}
        >
          <KeyboardIcon 
            sx={{ 
              color: 'success.main',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }} 
          />
          <Typography variant="body2" color="success.main">
            Scanner USB/Bluetooth ativo
          </Typography>
        </Box>
      )}
    </>
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

export default KeyboardWedge

