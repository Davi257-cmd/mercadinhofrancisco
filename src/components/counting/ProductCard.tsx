import { Box, Card, CardContent, Typography, alpha } from '@mui/material'
import { 
  Inventory2 as ProductIcon,
  QrCode2 as BarcodeIcon,
} from '@mui/icons-material'
import type { Product } from '../../types'

interface ProductCardProps {
  product: Product | null
  barcode?: string
  quantity: number
  isUnknown?: boolean
}

export function ProductCard({ 
  product, 
  barcode, 
  quantity, 
  isUnknown = false 
}: ProductCardProps) {
  return (
    <Card
      sx={{
        bgcolor: isUnknown 
          ? (theme) => alpha(theme.palette.warning.main, 0.1)
          : (theme) => alpha(theme.palette.primary.main, 0.05),
        border: isUnknown
          ? (theme) => `2px solid ${alpha(theme.palette.warning.main, 0.3)}`
          : (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        transition: 'all 0.3s ease',
        animation: 'fadeIn 0.3s ease',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(-10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Product icon */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: isUnknown
                ? (theme) => alpha(theme.palette.warning.main, 0.2)
                : (theme) => alpha(theme.palette.primary.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ProductIcon 
              sx={{ 
                fontSize: 32, 
                color: isUnknown ? 'warning.main' : 'primary.main' 
              }} 
            />
          </Box>

          {/* Product info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: isUnknown ? 'warning.main' : 'text.primary',
              }}
            >
              {isUnknown ? 'Produto não cadastrado' : product?.name}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <BarcodeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                {barcode || product?.barcode || 'N/A'}
              </Typography>
            </Box>

            {product?.sku && (
              <Typography variant="caption" color="text.secondary">
                SKU: {product.sku}
              </Typography>
            )}
          </Box>

          {/* Quantity badge */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 60,
            }}
          >
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}
            >
              Qtd
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                color: isUnknown ? 'warning.main' : 'primary.main',
                lineHeight: 1,
              }}
            >
              {quantity}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
            >
              {product?.unit || 'un'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProductCard

