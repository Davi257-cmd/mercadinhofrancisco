import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  Snackbar,
  Alert,
  alpha,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  CameraAlt as CameraIcon,
  Keyboard as KeyboardIcon,
  Undo as UndoIcon,
  Check as CheckIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { v4 as uuidv4 } from 'uuid'
import { db, getSessionById, getSessionEvents, getProductByBarcode, saveEvent } from '../db/dexie'
import { useAuth } from '../hooks/useAuth'
import { KeyboardWedge } from '../components/barcode/KeyboardWedge'
import { CameraScanner } from '../components/barcode/CameraScanner'
import { ProductCard } from '../components/counting/ProductCard'
import { QuantityControl } from '../components/counting/QuantityControl'
import { StatusBanner } from '../components/common/StatusBanner'
import { useSync } from '../hooks/useSync'
import type { LocalSession, LocalEvent, Product } from '../types'

interface CountedItem {
  barcode: string
  product: Product | null
  quantity: number
  events: LocalEvent[]
}

export function CountingPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user, isOnline } = useAuth()
  const { syncState, isSyncing } = useSync()

  const [session, setSession] = useState<LocalSession | null>(null)
  const [countedItems, setCountedItems] = useState<Map<string, CountedItem>>(new Map())
  const [currentBarcode, setCurrentBarcode] = useState<string | null>(null)
  const [scanMode, setScanMode] = useState<'keyboard' | 'camera'>('keyboard')
  const [showCamera, setShowCamera] = useState(false)
  const [lastAction, setLastAction] = useState<LocalEvent | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  })
  const [unknownBarcodeDialog, setUnknownBarcodeDialog] = useState<{
    open: boolean
    barcode: string
  }>({ open: false, barcode: '' })
  const [newProductName, setNewProductName] = useState('')

  // Load session and events
  useEffect(() => {
    if (!sessionId) return

    async function loadData() {
      const sessionData = await getSessionById(sessionId)
      if (!sessionData || sessionData.status === 'closed') {
        navigate('/sessions')
        return
      }
      setSession(sessionData)

      // Load existing events
      const events = await getSessionEvents(sessionId)
      const itemsMap = new Map<string, CountedItem>()

      for (const event of events) {
        const barcode = event.barcode || event.product_id || ''
        if (!barcode) continue

        if (itemsMap.has(barcode)) {
          const item = itemsMap.get(barcode)!
          item.quantity += event.qty_delta
          item.events.push(event)
        } else {
          const product = event.product_id 
            ? await db.products.get(event.product_id) 
            : await getProductByBarcode(barcode)
          
          itemsMap.set(barcode, {
            barcode,
            product: product || null,
            quantity: event.qty_delta,
            events: [event],
          })
        }
      }

      setCountedItems(itemsMap)
    }

    loadData()
  }, [sessionId, navigate])

  const handleScan = useCallback(async (barcode: string) => {
    if (!session || !sessionId) return

    // Find product by barcode
    const product = await getProductByBarcode(barcode)

    if (!product) {
      // Unknown barcode - ask to create product
      setUnknownBarcodeDialog({ open: true, barcode })
      return
    }

    // Create event
    const event: LocalEvent = {
      id: uuidv4(),
      session_id: sessionId,
      product_id: product.id,
      barcode,
      type: 'SCAN_ADD',
      qty_delta: 1,
      client_time: new Date().toISOString(),
      user_id: user?.userId,
      device_id: localStorage.getItem('stockcount_device_id') || undefined,
      syncStatus: 'pending',
      syncAttempts: 0,
    }

    await saveEvent(event)
    setLastAction(event)

    // Update counted items
    setCountedItems(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(barcode)
      
      if (existing) {
        newMap.set(barcode, {
          ...existing,
          quantity: existing.quantity + 1,
          events: [...existing.events, event],
        })
      } else {
        newMap.set(barcode, {
          barcode,
          product,
          quantity: 1,
          events: [event],
        })
      }
      
      return newMap
    })

    setCurrentBarcode(barcode)
    setSnackbar({
      open: true,
      message: `+1 ${product.name}`,
      severity: 'success',
    })
  }, [session, sessionId, user?.userId])

  const handleQuantityChange = useCallback(async (barcode: string, delta: number) => {
    if (!session || !sessionId) return

    const item = countedItems.get(barcode)
    if (!item) return

    const event: LocalEvent = {
      id: uuidv4(),
      session_id: sessionId,
      product_id: item.product?.id,
      barcode,
      type: 'ADJUST',
      qty_delta: delta,
      client_time: new Date().toISOString(),
      user_id: user?.userId,
      device_id: localStorage.getItem('stockcount_device_id') || undefined,
      syncStatus: 'pending',
      syncAttempts: 0,
    }

    await saveEvent(event)
    setLastAction(event)

    setCountedItems(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(barcode)!
      newMap.set(barcode, {
        ...existing,
        quantity: existing.quantity + delta,
        events: [...existing.events, event],
      })
      return newMap
    })
  }, [session, sessionId, countedItems, user?.userId])

  const handleSetQuantity = useCallback(async (barcode: string, newQuantity: number) => {
    if (!session || !sessionId) return

    const item = countedItems.get(barcode)
    if (!item) return

    const currentQty = item.quantity
    const delta = newQuantity - currentQty

    if (delta === 0) return

    const event: LocalEvent = {
      id: uuidv4(),
      session_id: sessionId,
      product_id: item.product?.id,
      barcode,
      type: 'COUNT_SET',
      qty_delta: delta,
      qty_absolute: newQuantity,
      client_time: new Date().toISOString(),
      user_id: user?.userId,
      device_id: localStorage.getItem('stockcount_device_id') || undefined,
      syncStatus: 'pending',
      syncAttempts: 0,
    }

    await saveEvent(event)
    setLastAction(event)

    setCountedItems(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(barcode)!
      newMap.set(barcode, {
        ...existing,
        quantity: newQuantity,
        events: [...existing.events, event],
      })
      return newMap
    })
  }, [session, sessionId, countedItems, user?.userId])

  const handleUndo = useCallback(async () => {
    if (!lastAction) return

    // Create reverse event
    const undoEvent: LocalEvent = {
      id: uuidv4(),
      session_id: lastAction.session_id,
      product_id: lastAction.product_id,
      barcode: lastAction.barcode,
      type: 'ADJUST',
      qty_delta: -lastAction.qty_delta,
      reason: 'Desfazer ação anterior',
      client_time: new Date().toISOString(),
      user_id: user?.userId,
      device_id: localStorage.getItem('stockcount_device_id') || undefined,
      syncStatus: 'pending',
      syncAttempts: 0,
    }

    await saveEvent(undoEvent)

    const barcode = lastAction.barcode || lastAction.product_id || ''
    setCountedItems(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(barcode)
      if (existing) {
        const newQty = existing.quantity - lastAction.qty_delta
        if (newQty <= 0) {
          newMap.delete(barcode)
        } else {
          newMap.set(barcode, {
            ...existing,
            quantity: newQty,
            events: [...existing.events, undoEvent],
          })
        }
      }
      return newMap
    })

    setLastAction(null)
    setSnackbar({
      open: true,
      message: 'Ação desfeita',
      severity: 'info',
    })
  }, [lastAction, user?.userId])

  const handleCreateUnknownProduct = useCallback(async () => {
    if (!newProductName || !unknownBarcodeDialog.barcode) return

    const product: Product = {
      id: uuidv4(),
      company_id: user?.companyId || '00000000-0000-0000-0000-000000000001',
      name: newProductName,
      barcode: unknownBarcodeDialog.barcode,
      unit: 'un',
      price: 0,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await db.products.put(product)
    setUnknownBarcodeDialog({ open: false, barcode: '' })
    setNewProductName('')

    // Now scan the product
    handleScan(unknownBarcodeDialog.barcode)
  }, [newProductName, unknownBarcodeDialog.barcode, user?.companyId, handleScan])

  const currentItem = useMemo(() => {
    if (!currentBarcode) return null
    return countedItems.get(currentBarcode) || null
  }, [currentBarcode, countedItems])

  const totalItems = useMemo(() => countedItems.size, [countedItems])
  const totalQuantity = useMemo(() => {
    return Array.from(countedItems.values()).reduce((sum, item) => sum + item.quantity, 0)
  }, [countedItems])

  if (!session) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <IconButton onClick={() => navigate('/sessions')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" noWrap>
            {session.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              size="small"
              label={`${totalItems} itens`}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                color: 'primary.main',
              }}
            />
            <Chip
              size="small"
              label={`${totalQuantity} unidades`}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.2),
                color: 'secondary.main',
              }}
            />
          </Box>
        </Box>
        <IconButton
          onClick={handleUndo}
          disabled={!lastAction}
          sx={{ color: lastAction ? 'warning.main' : 'grey.500' }}
        >
          <UndoIcon />
        </IconButton>
      </Box>

      {/* Status Banner */}
      <StatusBanner
        isOnline={isOnline}
        pendingCount={syncState.pendingCount}
        isSyncing={isSyncing}
      />

      {/* Scanner Mode Toggle */}
      <Box sx={{ display: 'flex', gap: 1, p: 2, justifyContent: 'center' }}>
        <Button
          variant={scanMode === 'keyboard' ? 'contained' : 'outlined'}
          startIcon={<KeyboardIcon />}
          onClick={() => setScanMode('keyboard')}
          size="small"
        >
          USB/Bluetooth
        </Button>
        <Button
          variant={scanMode === 'camera' ? 'contained' : 'outlined'}
          startIcon={<CameraIcon />}
          onClick={() => {
            setScanMode('camera')
            setShowCamera(true)
          }}
          size="small"
        >
          Câmera
        </Button>
      </Box>

      {/* Scanner Input */}
      {scanMode === 'keyboard' && (
        <Box sx={{ px: 2 }}>
          <KeyboardWedge onScan={handleScan} enabled={true} />
        </Box>
      )}

      {/* Current Item */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {currentItem ? (
          <Box>
            <ProductCard
              product={currentItem.product}
              barcode={currentItem.barcode}
              quantity={currentItem.quantity}
              isUnknown={!currentItem.product}
            />
            <QuantityControl
              quantity={currentItem.quantity}
              onIncrement={() => handleQuantityChange(currentItem.barcode, 1)}
              onDecrement={() => handleQuantityChange(currentItem.barcode, -1)}
              onSetQuantity={(qty) => handleSetQuantity(currentItem.barcode, qty)}
              unit={currentItem.product?.unit}
            />
          </Box>
        ) : (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto 16px',
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <KeyboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aguardando leitura
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Escaneie um código de barras para começar
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Recent items list */}
        {countedItems.size > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Itens contados ({countedItems.size})
            </Typography>
            {Array.from(countedItems.values())
              .reverse()
              .slice(0, 10)
              .map((item) => (
                <Box
                  key={item.barcode}
                  onClick={() => setCurrentBarcode(item.barcode)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: currentBarcode === item.barcode
                      ? (theme) => alpha(theme.palette.primary.main, 0.15)
                      : (theme) => alpha(theme.palette.background.paper, 0.5),
                    border: currentBarcode === item.barcode
                      ? (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
                      : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {item.product?.name || item.barcode}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.barcode}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      color: 'primary.main',
                    }}
                  >
                    {item.quantity}
                  </Typography>
                </Box>
              ))}
          </Box>
        )}
      </Box>

      {/* Finish FAB */}
      <Fab
        color="success"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate('/sessions')}
      >
        <CheckIcon />
      </Fab>

      {/* Camera Scanner */}
      {showCamera && (
        <CameraScanner
          onScan={(barcode) => {
            handleScan(barcode)
            setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Unknown Barcode Dialog */}
      <Dialog
        open={unknownBarcodeDialog.open}
        onClose={() => setUnknownBarcodeDialog({ open: false, barcode: '' })}
      >
        <DialogTitle>Produto não encontrado</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            O código <strong>{unknownBarcodeDialog.barcode}</strong> não está cadastrado.
            Deseja criar um novo produto?
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Nome do produto"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            placeholder="Ex: Arroz 5kg"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setUnknownBarcodeDialog({ open: false, barcode: '' })}
            variant="outlined"
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateUnknownProduct}
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!newProductName}
          >
            Criar e Contar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            width: '100%',
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CountingPage

