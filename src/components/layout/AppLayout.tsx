import { type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Chip,
  alpha,
} from '@mui/material'
import {
  Home as HomeIcon,
  Assignment as SessionsIcon,
  Inventory as ProductsIcon,
  Assessment as ReportsIcon,
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
  CloudOff as OfflineIcon,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { useSync } from '../../hooks/useSync'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isOnline } = useAuth()
  const { syncState, isSyncing, syncNow } = useSync()

  const navItems = [
    { label: 'Início', icon: <HomeIcon />, path: '/' },
    { label: 'Sessões', icon: <SessionsIcon />, path: '/sessions' },
    { label: 'Produtos', icon: <ProductsIcon />, path: '/products' },
    { label: 'Relatórios', icon: <ReportsIcon />, path: '/reports' },
  ]

  const currentPath = location.pathname
  const currentIndex = navItems.findIndex(item => 
    currentPath === item.path || currentPath.startsWith(item.path + '/')
  )

  // Hide bottom nav on counting page
  const hideBottomNav = currentPath.startsWith('/counting/')

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      pb: hideBottomNav ? 0 : 7,
    }}>
      {/* Top AppBar */}
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: '"JetBrains Mono", monospace',
                background: 'linear-gradient(135deg, #00d9ff 0%, #ff6b35 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
              }}
            >
              StockCount
            </Typography>
            
            {/* Offline indicator */}
            {!isOnline && (
              <Chip
                icon={<OfflineIcon sx={{ fontSize: 16 }} />}
                label="Offline"
                size="small"
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.2),
                  color: 'warning.main',
                  border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.5)}`,
                  '& .MuiChip-icon': { color: 'warning.main' },
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Pending events indicator */}
            {syncState.pendingCount > 0 && (
              <Chip
                label={`${syncState.pendingCount} pendente${syncState.pendingCount > 1 ? 's' : ''}`}
                size="small"
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.2),
                  color: 'secondary.main',
                }}
              />
            )}

            {/* Sync button */}
            <IconButton 
              onClick={syncNow}
              disabled={!isOnline || isSyncing}
              sx={{
                color: isOnline ? 'primary.main' : 'grey.500',
                animation: isSyncing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  from: { transform: 'rotate(0deg)' },
                  to: { transform: 'rotate(360deg)' },
                },
              }}
            >
              {isOnline ? <SyncIcon /> : <SyncDisabledIcon />}
            </IconButton>

            {/* User info */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {user?.name}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation */}
      {!hideBottomNav && (
        <BottomNavigation
          value={currentIndex >= 0 ? currentIndex : 0}
          onChange={(_, newValue) => {
            navigate(navItems[newValue]?.path || '/')
          }}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
              sx={{
                minWidth: 'auto',
                '&.Mui-selected': {
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.75rem',
                  },
                },
              }}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  )
}

export default AppLayout

