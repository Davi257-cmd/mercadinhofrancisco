export type UserRole = 'admin' | 'operator'
export type SessionStatus = 'open' | 'closed'
export type EventType = 'SCAN_ADD' | 'COUNT_SET' | 'ADJUST' | 'PENDING_UNKNOWN'
export type SyncStatus = 'pending' | 'synced' | 'failed'
export type LocationType = 'store' | 'warehouse' | 'other'

export interface Company {
  id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  company_id: string
  role: UserRole
  name: string
  pin_hash?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  company_id: string
  name: string
  type: LocationType
  active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  company_id: string
  sku?: string
  name: string
  barcode?: string
  unit: string
  price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CountSession {
  id: string
  location_id: string
  title: string
  status: SessionStatus
  notes?: string
  created_by?: string
  created_at: string
  closed_at?: string
  updated_at: string
}

export interface InventoryEvent {
  id: string
  session_id: string
  product_id?: string
  barcode?: string
  type: EventType
  qty_delta: number
  qty_absolute?: number
  reason?: string
  device_id?: string
  user_id?: string
  client_time: string
  server_received_at?: string
}

// Local types for IndexedDB
export interface LocalEvent extends InventoryEvent {
  syncStatus: SyncStatus
  syncAttempts: number
  lastSyncError?: string
}

export interface LocalSession extends CountSession {
  syncStatus: SyncStatus
  itemCount?: number
  totalQuantity?: number
}

export interface LocalAuth {
  id: string
  userId: string
  email: string
  name: string
  role: UserRole
  companyId: string
  pin?: string
  lastLoginAt: string
}

export interface SyncState {
  deviceId: string
  lastSyncAt?: string
  isOnline: boolean
  pendingCount: number
}

// API Response types
export interface SyncPullResponse {
  success: boolean
  events: InventoryEvent[]
  products: Product[]
  sessions: CountSession[]
  locations: Location[]
  server_time: string
}

export interface SyncPushResponse {
  success: boolean
  inserted: number
  skipped: number
  server_time: string
}

export interface SessionReportItem {
  product_id: string
  product_name: string
  sku?: string
  barcode?: string
  total_qty: number
  last_counted_at: string
}

export interface SessionReport {
  session: CountSession
  items: SessionReportItem[]
  totals: {
    total_products: number
    total_scans: number
    total_quantity: number
  }
}

