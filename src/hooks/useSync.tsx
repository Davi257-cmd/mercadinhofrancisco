import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useRef,
  type ReactNode 
} from 'react'
import { supabase } from '../services/supabase'
import { db, getPendingEvents, updateEventSyncStatus } from '../db/dexie'
import type { SyncPullResponse, SyncPushResponse, SyncState, LocalEvent } from '../types'

interface SyncContextType {
  syncState: SyncState
  isSyncing: boolean
  lastSyncError: string | null
  syncNow: () => Promise<void>
  pushEvents: () => Promise<{ success: boolean; inserted: number }>
  pullData: () => Promise<boolean>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

const DEVICE_ID = (() => {
  let deviceId = localStorage.getItem('stockcount_device_id')
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('stockcount_device_id', deviceId)
  }
  return deviceId
})()

export function SyncProvider({ children }: { children: ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>({
    deviceId: DEVICE_ID,
    isOnline: navigator.onLine,
    pendingCount: 0,
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true }))
    }
    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update pending count periodically
  useEffect(() => {
    async function updatePendingCount() {
      const pending = await getPendingEvents()
      setSyncState(prev => ({ ...prev, pendingCount: pending.length }))
    }

    updatePendingCount()
    const interval = setInterval(updatePendingCount, 5000)
    return () => clearInterval(interval)
  }, [])

  const pushEvents = useCallback(async (): Promise<{ success: boolean; inserted: number }> => {
    try {
      const pendingEvents = await getPendingEvents()
      
      if (pendingEvents.length === 0) {
        return { success: true, inserted: 0 }
      }

      // Format events for the RPC call
      const eventsPayload = pendingEvents.map((event: LocalEvent) => ({
        id: event.id,
        session_id: event.session_id,
        product_id: event.product_id,
        barcode: event.barcode,
        type: event.type,
        qty_delta: event.qty_delta,
        qty_absolute: event.qty_absolute,
        reason: event.reason,
        device_id: DEVICE_ID,
        user_id: event.user_id,
        client_time: event.client_time,
      }))

      const { data, error } = await supabase.rpc('sync_push', {
        p_events: eventsPayload,
      }) as { data: SyncPushResponse | null; error: Error | null }

      if (error) {
        console.error('Push error:', error)
        // Mark events as failed
        for (const event of pendingEvents) {
          await updateEventSyncStatus(event.id, 'failed', error.message)
        }
        return { success: false, inserted: 0 }
      }

      if (data?.success) {
        // Mark events as synced
        for (const event of pendingEvents) {
          await updateEventSyncStatus(event.id, 'synced')
        }
        return { success: true, inserted: data.inserted }
      }

      return { success: false, inserted: 0 }
    } catch (error) {
      console.error('Push error:', error)
      return { success: false, inserted: 0 }
    }
  }, [])

  const pullData = useCallback(async (): Promise<boolean> => {
    try {
      const lastSyncAt = syncState.lastSyncAt || null

      const { data, error } = await supabase.rpc('sync_pull', {
        p_device_id: DEVICE_ID,
        p_last_sync_at: lastSyncAt,
      }) as { data: SyncPullResponse | null; error: Error | null }

      if (error) {
        console.error('Pull error:', error)
        return false
      }

      if (data?.success) {
        // Update local products
        if (data.products && data.products.length > 0) {
          await db.products.bulkPut(data.products)
        }

        // Update local sessions
        if (data.sessions && data.sessions.length > 0) {
          for (const session of data.sessions) {
            await db.sessions.put({
              ...session,
              syncStatus: 'synced',
            })
          }
        }

        // Update local locations
        if (data.locations && data.locations.length > 0) {
          await db.locations.bulkPut(data.locations)
        }

        // Update sync state
        setSyncState(prev => ({
          ...prev,
          lastSyncAt: data.server_time,
        }))

        return true
      }

      return false
    } catch (error) {
      console.error('Pull error:', error)
      return false
    }
  }, [syncState.lastSyncAt])

  const syncNow = useCallback(async () => {
    if (isSyncing || !syncState.isOnline) return

    setIsSyncing(true)
    setLastSyncError(null)

    try {
      // Push first, then pull
      const pushResult = await pushEvents()
      if (!pushResult.success && syncState.pendingCount > 0) {
        setLastSyncError('Erro ao enviar dados')
      }

      const pullSuccess = await pullData()
      if (!pullSuccess) {
        setLastSyncError('Erro ao receber dados')
      }

      // Update pending count
      const pending = await getPendingEvents()
      setSyncState(prev => ({ ...prev, pendingCount: pending.length }))
    } catch (error) {
      console.error('Sync error:', error)
      setLastSyncError('Erro na sincronização')
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, syncState.isOnline, syncState.pendingCount, pushEvents, pullData])

  // Auto-sync when online
  useEffect(() => {
    if (syncState.isOnline) {
      // Sync immediately when coming online
      syncNow()

      // Set up periodic sync every 1 hour
      syncIntervalRef.current = setInterval(syncNow, 3600000) // Every 1 hour
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [syncState.isOnline, syncNow])

  return (
    <SyncContext.Provider
      value={{
        syncState,
        isSyncing,
        lastSyncError,
        syncNow,
        pushEvents,
        pullData,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}

