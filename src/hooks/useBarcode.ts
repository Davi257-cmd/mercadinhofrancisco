import { useState, useEffect, useCallback, useRef } from 'react'

interface UseBarcodeOptions {
  onScan: (barcode: string) => void
  enabled?: boolean
  timeout?: number // Time in ms to wait for complete barcode
  minLength?: number // Minimum barcode length
}

interface UseBarcodeReturn {
  isListening: boolean
  lastBarcode: string | null
  buffer: string
  reset: () => void
}

export function useBarcode({
  onScan,
  enabled = true,
  timeout = 100,
  minLength = 4,
}: UseBarcodeOptions): UseBarcodeReturn {
  const [buffer, setBuffer] = useState('')
  const [lastBarcode, setLastBarcode] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(enabled)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKeyTimeRef = useRef<number>(0)

  const reset = useCallback(() => {
    setBuffer('')
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const processBuffer = useCallback((currentBuffer: string) => {
    if (currentBuffer.length >= minLength) {
      setLastBarcode(currentBuffer)
      onScan(currentBuffer)
      playBeep()
      vibrate()
    }
    setBuffer('')
  }, [minLength, onScan])

  useEffect(() => {
    if (!enabled) {
      setIsListening(false)
      return
    }

    setIsListening(true)

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now()
      const timeSinceLastKey = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      // If too much time has passed, reset buffer
      if (timeSinceLastKey > 200 && buffer.length > 0) {
        setBuffer('')
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Handle Enter key - process the buffer
      if (e.key === 'Enter') {
        e.preventDefault()
        processBuffer(buffer)
        return
      }

      // Only accept printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Don't capture if focused on an input element (unless it's our hidden input)
        const activeElement = document.activeElement
        if (
          activeElement &&
          (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') &&
          !activeElement.classList.contains('barcode-input')
        ) {
          return
        }

        setBuffer(prev => prev + e.key)

        // Set timeout to process buffer if no more keys come
        timeoutRef.current = setTimeout(() => {
          setBuffer(current => {
            if (current.length >= minLength) {
              processBuffer(current)
            }
            return ''
          })
        }, timeout)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, buffer, timeout, minLength, processBuffer])

  return {
    isListening,
    lastBarcode,
    buffer,
    reset,
  }
}

// Audio feedback
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
    console.log('Audio feedback not available:', error)
  }
}

// Vibration feedback
function vibrate() {
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

export default useBarcode

