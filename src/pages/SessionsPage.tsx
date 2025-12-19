import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  alpha,
  Skeleton,
} from '@mui/material'
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  Lock as CloseIcon,
  Delete as DeleteIcon,
  Assignment as SessionIcon,
} from '@mui/icons-material'
import { v4 as uuidv4 } from 'uuid'
import { db, getAllSessions, getSessionEvents } from '../db/dexie'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSync } from '../hooks/useSync'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import type { LocalSession, Location } from '../types'

export function SessionsPage() {
  const navigate = useNavigate()
  const { user, isOnline } = useAuth()
  const { syncNow } = useSync()
  const [sessions, setSessions] = useState<LocalSession[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    sessionId: string | null
    action: 'close' | 'delete'
  }>({ open: false, sessionId: null, action: 'close' })
  const [sessionCounts, setSessionCounts] = useState<Record<string, { items: number; qty: number }>>({})

  // Form state
  const [title, setTitle] = useState('')
  const [locationId, setLocationId] = useState('')
  const [notes, setNotes] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [sessionsData, locationsData] = await Promise.all([
        getAllSessions(),
        db.locations.toArray(),
      ])

      setSessions(sessionsData)
      setLocations(locationsData)

      // Load counts for each session
      const counts: Record<string, { items: number; qty: number }> = {}
      for (const session of sessionsData) {
        const events = await getSessionEvents(session.id)
        const productSet = new Set(events.map(e => e.product_id || e.barcode))
        const totalQty = events.reduce((sum, e) => sum + e.qty_delta, 0)
        counts[session.id] = { items: productSet.size, qty: totalQty }
      }
      setSessionCounts(counts)
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateSession = async () => {
    if (!title || !locationId) return

    try {
      const sessionId = uuidv4()
      const now = new Date().toISOString()

      const newSession: LocalSession = {
        id: sessionId,
        location_id: locationId,
        title,
        status: 'open',
        notes: notes || undefined,
        created_by: user?.userId,
        created_at: now,
        updated_at: now,
        syncStatus: 'pending',
      }

      // Save locally
      await db.sessions.put(newSession)

      // Try to save to server if online
      if (isOnline) {
        try {
          await supabase.rpc('create_count_session', {
            p_location_id: locationId,
            p_title: title,
            p_created_by: user?.userId,
            p_notes: notes || null,
          })
          await db.sessions.update(sessionId, { syncStatus: 'synced' })
        } catch (error) {
          console.error('Error syncing session:', error)
        }
      }

      setDialogOpen(false)
      setTitle('')
      setLocationId('')
      setNotes('')
      await loadData()

      // Navigate to counting page
      navigate(`/counting/${sessionId}`)
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  const handleCloseSession = async (sessionId: string) => {
    try {
      const now = new Date().toISOString()
      await db.sessions.update(sessionId, {
        status: 'closed',
        closed_at: now,
        updated_at: now,
      })

      if (isOnline) {
        try {
          await supabase.rpc('close_count_session', {
            p_session_id: sessionId,
          })
          await syncNow()
        } catch (error) {
          console.error('Error syncing session close:', error)
        }
      }

      setConfirmDialog({ open: false, sessionId: null, action: 'close' })
      await loadData()
    } catch (error) {
      console.error('Error closing session:', error)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await db.events.where('session_id').equals(sessionId).delete()
      await db.sessions.delete(sessionId)
      setConfirmDialog({ open: false, sessionId: null, action: 'delete' })
      await loadData()
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || 'Local desconhecido'
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" gutterBottom>
        Sessões de Contagem
      </Typography>

      {isLoading ? (
        <Box>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height={120} sx={{ mb: 2, borderRadius: 2 }} />
          ))}
        </Box>
      ) : sessions.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <SessionIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma sessão criada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Crie sua primeira sessão de contagem para começar
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Nova Sessão
            </Button>
          </CardContent>
        </Card>
      ) : (
        sessions.map((session) => (
          <Card
            key={session.id}
            sx={{
              mb: 2,
              border: session.status === 'open'
                ? (theme) => `2px solid ${alpha(theme.palette.success.main, 0.5)}`
                : undefined,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6">{session.title}</Typography>
                    <Chip
                      size="small"
                      label={session.status === 'open' ? 'Aberta' : 'Fechada'}
                      sx={{
                        bgcolor: session.status === 'open'
                          ? (theme) => alpha(theme.palette.success.main, 0.2)
                          : (theme) => alpha(theme.palette.grey[500], 0.2),
                        color: session.status === 'open' ? 'success.main' : 'grey.500',
                      }}
                    />
                    {session.syncStatus === 'pending' && (
                      <Chip
                        size="small"
                        label="Pendente"
                        sx={{
                          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.2),
                          color: 'warning.main',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getLocationName(session.location_id)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Criado em {new Date(session.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>

                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant="body2" color="primary.main">
                      {sessionCounts[session.id]?.items || 0} itens
                    </Typography>
                    <Typography variant="body2" color="secondary.main">
                      {sessionCounts[session.id]?.qty || 0} unidades
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {session.status === 'open' && (
                    <>
                      <IconButton
                        onClick={() => navigate(`/counting/${session.id}`)}
                        sx={{
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                        }}
                      >
                        <StartIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => setConfirmDialog({
                          open: true,
                          sessionId: session.id,
                          action: 'close',
                        })}
                        sx={{
                          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                          color: 'warning.main',
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </>
                  )}
                  <IconButton
                    onClick={() => setConfirmDialog({
                      open: true,
                      sessionId: session.id,
                      action: 'delete',
                    })}
                    sx={{
                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                      color: 'error.main',
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* FAB */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
        }}
        onClick={() => setDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Session Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nova Sessão de Contagem</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Título da Sessão"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Contagem Mensal - Dezembro"
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            select
            fullWidth
            label="Localização"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            sx={{ mb: 2 }}
          >
            {locations.map((location) => (
              <MenuItem key={location.id} value={location.id}>
                {location.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Observações (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={!title || !locationId}
          >
            Criar e Iniciar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.action === 'close' ? 'Fechar Sessão' : 'Excluir Sessão'}
        message={
          confirmDialog.action === 'close'
            ? 'Tem certeza que deseja fechar esta sessão? Não será possível adicionar mais itens.'
            : 'Tem certeza que deseja excluir esta sessão? Todos os dados serão perdidos.'
        }
        confirmText={confirmDialog.action === 'close' ? 'Fechar' : 'Excluir'}
        confirmColor={confirmDialog.action === 'close' ? 'warning' : 'error'}
        onConfirm={() => {
          if (confirmDialog.sessionId) {
            if (confirmDialog.action === 'close') {
              handleCloseSession(confirmDialog.sessionId)
            } else {
              handleDeleteSession(confirmDialog.sessionId)
            }
          }
        }}
        onCancel={() => setConfirmDialog({ open: false, sessionId: null, action: 'close' })}
      />
    </Box>
  )
}

export default SessionsPage

