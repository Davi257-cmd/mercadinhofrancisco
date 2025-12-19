import { useState } from 'react'
import {
  Box,
  IconButton,
  TextField,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
} from '@mui/icons-material'

interface QuantityControlProps {
  quantity: number
  onIncrement: () => void
  onDecrement: () => void
  onSetQuantity: (qty: number) => void
  unit?: string
}

export function QuantityControl({
  quantity,
  onIncrement,
  onDecrement,
  onSetQuantity,
  unit = 'un',
}: QuantityControlProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [manualQty, setManualQty] = useState(quantity.toString())

  const handleOpenDialog = () => {
    setManualQty(quantity.toString())
    setDialogOpen(true)
  }

  const handleConfirm = () => {
    const qty = parseInt(manualQty, 10)
    if (!isNaN(qty) && qty >= 0) {
      onSetQuantity(qty)
    }
    setDialogOpen(false)
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          py: 2,
        }}
      >
        {/* Decrement button */}
        <IconButton
          onClick={onDecrement}
          disabled={quantity <= 0}
          sx={{
            width: 56,
            height: 56,
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.15),
            border: (theme) => `2px solid ${alpha(theme.palette.error.main, 0.3)}`,
            color: 'error.main',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.25),
            },
            '&:disabled': {
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.1),
              borderColor: (theme) => alpha(theme.palette.grey[500], 0.2),
              color: 'grey.500',
            },
          }}
        >
          <RemoveIcon sx={{ fontSize: 32 }} />
        </IconButton>

        {/* Quantity display */}
        <Box
          onClick={handleOpenDialog}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            px: 3,
            py: 1,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            border: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
            },
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              color: 'primary.main',
              lineHeight: 1,
              minWidth: 80,
              textAlign: 'center',
            }}
          >
            {quantity}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <EditIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {unit}
            </Typography>
          </Box>
        </Box>

        {/* Increment button */}
        <IconButton
          onClick={onIncrement}
          sx={{
            width: 56,
            height: 56,
            bgcolor: (theme) => alpha(theme.palette.success.main, 0.15),
            border: (theme) => `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
            color: 'success.main',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.25),
            },
          }}
        >
          <AddIcon sx={{ fontSize: 32 }} />
        </IconButton>
      </Box>

      {/* Manual quantity dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Definir quantidade</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="number"
            value={manualQty}
            onChange={(e) => setManualQty(e.target.value)}
            inputProps={{ min: 0, style: { textAlign: 'center', fontSize: '2rem' } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default QuantityControl

