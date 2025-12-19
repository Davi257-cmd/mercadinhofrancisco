import { z } from 'zod'

export const userRoleSchema = z.enum(['admin', 'operator'])
export const sessionStatusSchema = z.enum(['open', 'closed'])
export const eventTypeSchema = z.enum(['SCAN_ADD', 'COUNT_SET', 'ADJUST', 'PENDING_UNKNOWN'])
export const syncStatusSchema = z.enum(['pending', 'synced', 'failed'])
export const locationTypeSchema = z.enum(['store', 'warehouse', 'other'])

export const productSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  sku: z.string().optional().nullable(),
  name: z.string().min(1),
  barcode: z.string().optional().nullable(),
  unit: z.string().default('un'),
  price: z.number().default(0),
  active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
})

export const locationSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  name: z.string().min(1),
  type: locationTypeSchema.default('store'),
  active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
})

export const sessionSchema = z.object({
  id: z.string().uuid(),
  location_id: z.string().uuid(),
  title: z.string().min(1),
  status: sessionStatusSchema.default('open'),
  notes: z.string().optional().nullable(),
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string(),
  closed_at: z.string().optional().nullable(),
  updated_at: z.string(),
})

export const inventoryEventSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  product_id: z.string().uuid().optional().nullable(),
  barcode: z.string().optional().nullable(),
  type: eventTypeSchema,
  qty_delta: z.number().int().default(0),
  qty_absolute: z.number().int().optional().nullable(),
  reason: z.string().optional().nullable(),
  device_id: z.string().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  client_time: z.string(),
  server_received_at: z.string().optional().nullable(),
})

export const localEventSchema = inventoryEventSchema.extend({
  syncStatus: syncStatusSchema.default('pending'),
  syncAttempts: z.number().default(0),
  lastSyncError: z.string().optional(),
})

export const localSessionSchema = sessionSchema.extend({
  syncStatus: syncStatusSchema.default('pending'),
  itemCount: z.number().optional(),
  totalQuantity: z.number().optional(),
})

export const loginFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const createSessionFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  location_id: z.string().uuid('Selecione uma localização'),
  notes: z.string().optional(),
})

export const createProductFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().default('un'),
  price: z.number().min(0).default(0),
})

export type ProductFormData = z.infer<typeof createProductFormSchema>
export type SessionFormData = z.infer<typeof createSessionFormSchema>
export type LoginFormData = z.infer<typeof loginFormSchema>

