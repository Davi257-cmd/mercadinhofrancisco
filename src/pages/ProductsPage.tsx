import { useState, useEffect, useCallback } from 'react'
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
  InputAdornment,
  IconButton,
  Chip,
  alpha,
  Skeleton,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as ProductIcon,
  QrCode2 as BarcodeIcon,
} from '@mui/icons-material'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/dexie'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import type { Product } from '../types'

export function ProductsPage() {
  const { user, isOnline } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  })

  // Form state
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [sku, setSku] = useState('')
  const [unit, setUnit] = useState('un')
  const [price, setPrice] = useState('')

  const loadProducts = useCallback(async () => {
    try {
      const data = await db.products.toArray()
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name))
      setProducts(sorted)
      setFilteredProducts(sorted)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts(products)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.barcode?.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, products])

  const resetForm = () => {
    setName('')
    setBarcode('')
    setSku('')
    setUnit('un')
    setPrice('')
    setEditingProduct(null)
  }

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setName(product.name)
      setBarcode(product.barcode || '')
      setSku(product.sku || '')
      setUnit(product.unit)
      setPrice(product.price.toString())
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleSaveProduct = async () => {
    if (!name) return

    try {
      const now = new Date().toISOString()
      const productData: Product = {
        id: editingProduct?.id || uuidv4(),
        company_id: user?.companyId || '00000000-0000-0000-0000-000000000001',
        name,
        barcode: barcode || undefined,
        sku: sku || undefined,
        unit: unit || 'un',
        price: parseFloat(price) || 0,
        active: true,
        created_at: editingProduct?.created_at || now,
        updated_at: now,
      }

      // Save locally
      await db.products.put(productData)

      // Try to sync if online
      if (isOnline) {
        try {
          if (editingProduct) {
            await supabase.from('products').update({
              name: productData.name,
              barcode: productData.barcode,
              sku: productData.sku,
              unit: productData.unit,
              price: productData.price,
              updated_at: productData.updated_at,
            }).eq('id', productData.id)
          } else {
            await supabase.from('products').insert(productData)
          }
        } catch (error) {
          console.error('Error syncing product:', error)
        }
      }

      setDialogOpen(false)
      resetForm()
      await loadProducts()
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await db.products.delete(productId)

      if (isOnline) {
        try {
          await supabase.from('products').update({ active: false }).eq('id', productId)
        } catch (error) {
          console.error('Error syncing delete:', error)
        }
      }

      setDeleteConfirm({ open: false, productId: null })
      await loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" gutterBottom>
        Produtos
      </Typography>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Buscar por nome, código ou SKU..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Products list */}
      {isLoading ? (
        <Box>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={80} sx={{ mb: 1, borderRadius: 2 }} />
          ))}
        </Box>
      ) : filteredProducts.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <ProductIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </Typography>
            {!searchQuery && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Adicione seu primeiro produto para começar
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Novo Produto
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        filteredProducts.map((product) => (
          <Card key={product.id} sx={{ mb: 1.5 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ProductIcon sx={{ color: 'primary.main' }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={500} noWrap>
                    {product.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {product.barcode && (
                      <Chip
                        icon={<BarcodeIcon sx={{ fontSize: 14 }} />}
                        label={product.barcode}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        }}
                      />
                    )}
                    {product.sku && (
                      <Chip
                        label={`SKU: ${product.sku}`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                        }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      R$ {product.price.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(product)}
                    sx={{ color: 'primary.main' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteConfirm({ open: true, productId: product.id })}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Stats */}
      {products.length > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {filteredProducts.length} de {products.length} produtos
          </Typography>
        </Box>
      )}

      {/* FAB */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nome do Produto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Código de Barras"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BarcodeIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
            <TextField
              fullWidth
              label="Unidade"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="un, kg, l, cx..."
            />
          </Box>
          <TextField
            fullWidth
            label="Preço"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveProduct} variant="contained" disabled={!name}>
            {editingProduct ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        confirmColor="error"
        onConfirm={() => deleteConfirm.productId && handleDeleteProduct(deleteConfirm.productId)}
        onCancel={() => setDeleteConfirm({ open: false, productId: null })}
      />
    </Box>
  )
}

export default ProductsPage

