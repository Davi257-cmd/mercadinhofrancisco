import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  alpha,
  Skeleton,
} from '@mui/material'
import {
  Assignment as SessionIcon,
  Inventory as ProductIcon,
  CloudDone as SyncedIcon,
  CloudQueue as PendingIcon,
  Add as AddIcon,
  PlayArrow as StartIcon,
} from '@mui/icons-material'
import { db, getAllSessions, getPendingEvents } from '../db/dexie'
import { useAuth } from '../hooks/useAuth'
import { useSync } from '../hooks/useSync'
import type { LocalSession } from '../types'

interface DashboardStats {
  openSessions: number
  closedSessions: number
  totalProducts: number
  pendingEvents: number
  syncedEvents: number
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, isOnline } = useAuth()
  const { syncState, isSyncing } = useSync()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentSessions, setRecentSessions] = useState<LocalSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [sessions, products, pendingEvents] = await Promise.all([
          getAllSessions(),
          db.products.count(),
          getPendingEvents(),
        ])

        const syncedEvents = await db.events.where('syncStatus').equals('synced').count()

        setStats({
          openSessions: sessions.filter(s => s.status === 'open').length,
          closedSessions: sessions.filter(s => s.status === 'closed').length,
          totalProducts: products,
          pendingEvents: pendingEvents.length,
          syncedEvents,
        })

        setRecentSessions(sessions.slice(0, 3))
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [syncState.pendingCount])

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }: {
    title: string
    value: number | string
    icon: React.ReactNode
    color: string
    subtitle?: string
  }) => (
    <Card
      sx={{
        height: '100%',
        bgcolor: alpha(color, 0.1),
        border: `1px solid ${alpha(color, 0.3)}`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                color,
              }}
            >
              {isLoading ? <Skeleton width={60} /> : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(color, 0.2),
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ p: 2 }}>
      {/* Welcome */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Olá, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <StatCard
            title="Sessões Abertas"
            value={stats?.openSessions ?? 0}
            icon={<SessionIcon />}
            color="#00d9ff"
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            title="Produtos"
            value={stats?.totalProducts ?? 0}
            icon={<ProductIcon />}
            color="#ff6b35"
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            title="Sincronizados"
            value={stats?.syncedEvents ?? 0}
            icon={<SyncedIcon />}
            color="#39ff14"
            subtitle="eventos"
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            title="Pendentes"
            value={stats?.pendingEvents ?? 0}
            icon={<PendingIcon />}
            color="#ffd700"
            subtitle={isSyncing ? 'sincronizando...' : 'aguardando'}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Ações Rápidas
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/sessions')}
            >
              Nova Sessão
            </Button>
            <Button
              variant="outlined"
              startIcon={<ProductIcon />}
              onClick={() => navigate('/products')}
            >
              Gerenciar Produtos
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Sessões Recentes
            </Typography>
            <Button size="small" onClick={() => navigate('/sessions')}>
              Ver todas
            </Button>
          </Box>

          {isLoading ? (
            <Box>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} height={60} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : recentSessions.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: 'text.secondary',
              }}
            >
              <SessionIcon sx={{ fontSize: 48, opacity: 0.5, mb: 1 }} />
              <Typography>Nenhuma sessão ainda</Typography>
              <Button
                variant="text"
                startIcon={<AddIcon />}
                onClick={() => navigate('/sessions')}
                sx={{ mt: 1 }}
              >
                Criar primeira sessão
              </Button>
            </Box>
          ) : (
            recentSessions.map((session) => (
              <Box
                key={session.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  },
                }}
                onClick={() => {
                  if (session.status === 'open') {
                    navigate(`/counting/${session.id}`)
                  }
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {session.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(session.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  {session.status === 'open' && (
                    <StartIcon sx={{ color: 'primary.main' }} />
                  )}
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      {/* Connection status */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: isOnline
            ? (theme) => alpha(theme.palette.success.main, 0.1)
            : (theme) => alpha(theme.palette.warning.main, 0.1),
          border: isOnline
            ? (theme) => `1px solid ${alpha(theme.palette.success.main, 0.3)}`
            : (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: isOnline ? 'success.main' : 'warning.main' }}
        >
          {isOnline ? '🟢 Conectado' : '🟡 Modo Offline'}
        </Typography>
      </Box>
    </Box>
  )
}

export default DashboardPage

