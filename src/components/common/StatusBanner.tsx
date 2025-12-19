import { Box, Typography, alpha } from '@mui/material'
import {
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon,
  Sync as SyncIcon,
} from '@mui/icons-material'

interface StatusBannerProps {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
}

export function StatusBanner({ isOnline, pendingCount, isSyncing }: StatusBannerProps) {
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        py: 0.5,
        px: 2,
        bgcolor: (theme) => 
          !isOnline 
            ? alpha(theme.palette.warning.main, 0.15)
            : isSyncing
            ? alpha(theme.palette.info.main, 0.15)
            : alpha(theme.palette.secondary.main, 0.15),
        borderBottom: (theme) => 
          `1px solid ${alpha(
            !isOnline 
              ? theme.palette.warning.main 
              : isSyncing
              ? theme.palette.info.main
              : theme.palette.secondary.main, 
            0.3
          )}`,
      }}
    >
      {!isOnline ? (
        <>
          <OfflineIcon sx={{ fontSize: 18, color: 'warning.main' }} />
          <Typography variant="caption" color="warning.main">
            Modo offline - dados salvos localmente
          </Typography>
        </>
      ) : isSyncing ? (
        <>
          <SyncIcon 
            sx={{ 
              fontSize: 18, 
              color: 'info.main',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(360deg)' },
              },
            }} 
          />
          <Typography variant="caption" color="info.main">
            Sincronizando...
          </Typography>
        </>
      ) : pendingCount > 0 ? (
        <>
          <OnlineIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
          <Typography variant="caption" color="secondary.main">
            {pendingCount} evento{pendingCount > 1 ? 's' : ''} aguardando sincronização
          </Typography>
        </>
      ) : null}
    </Box>
  )
}

export default StatusBanner

