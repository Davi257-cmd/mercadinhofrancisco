import Dexie, { type EntityTable } from 'dexie'
import type { 
  Product, 
  LocalSession, 
  LocalEvent, 
  LocalAuth, 
  Location 
} from '../types'

class StockCountDB extends Dexie {
  products!: EntityTable<Product, 'id'>
  sessions!: EntityTable<LocalSession, 'id'>
  events!: EntityTable<LocalEvent, 'id'>
  locations!: EntityTable<Location, 'id'>
  auth!: EntityTable<LocalAuth, 'id'>
  syncQueue!: EntityTable<{ id: string; eventId: string; createdAt: string }, 'id'>

  constructor() {
    super('StockCountDB')
    
    this.version(1).stores({
      products: 'id, company_id, barcode, sku, name, updated_at',
      sessions: 'id, location_id, status, created_at, syncStatus',
      events: 'id, session_id, product_id, barcode, type, client_time, syncStatus',
      locations: 'id, company_id, name',
      auth: 'id, userId, email',
      syncQueue: 'id, eventId, createdAt',
    })
  }
}

export const db = new StockCountDB()

// Helper functions
export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  return db.products.where('barcode').equals(barcode).first()
}

export async function getSessionEvents(sessionId: string): Promise<LocalEvent[]> {
  return db.events.where('session_id').equals(sessionId).toArray()
}

export async function getPendingEvents(): Promise<LocalEvent[]> {
  return db.events.where('syncStatus').equals('pending').toArray()
}

export async function getOpenSessions(): Promise<LocalSession[]> {
  return db.sessions.where('status').equals('open').toArray()
}

export async function getAllSessions(): Promise<LocalSession[]> {
  return db.sessions.orderBy('created_at').reverse().toArray()
}

export async function getSessionById(id: string): Promise<LocalSession | undefined> {
  return db.sessions.get(id)
}

export async function saveEvent(event: LocalEvent): Promise<string> {
  await db.events.put(event)
  return event.id
}

export async function updateEventSyncStatus(
  eventId: string, 
  status: 'pending' | 'synced' | 'failed',
  error?: string
): Promise<void> {
  await db.events.update(eventId, { 
    syncStatus: status,
    lastSyncError: error,
    syncAttempts: status === 'failed' 
      ? ((await db.events.get(eventId))?.syncAttempts || 0) + 1 
      : 0
  })
}

export async function clearDatabase(): Promise<void> {
  await db.products.clear()
  await db.sessions.clear()
  await db.events.clear()
  await db.locations.clear()
  await db.auth.clear()
  await db.syncQueue.clear()
}

export async function getLocalAuth(): Promise<LocalAuth | undefined> {
  return db.auth.toArray().then(arr => arr[0])
}

export async function saveLocalAuth(auth: LocalAuth): Promise<void> {
  await db.auth.clear()
  await db.auth.put(auth)
}

export async function clearLocalAuth(): Promise<void> {
  await db.auth.clear()
}

export default db

