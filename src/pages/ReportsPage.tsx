import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  alpha,
  Skeleton,
  Divider,
} from '@mui/material'
import {
  Download as DownloadIcon,
  Assessment as ReportIcon,
  Inventory as ProductIcon,
} from '@mui/icons-material'
import { db, getAllSessions, getSessionEvents } from '../db/dexie'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import type { LocalSession, LocalEvent, Product, SessionReport } from '../types'

interface ReportItem {
  productId: string
  productName: string
  barcode: string
  sku: string
  totalQty: number
  scanCount: number
}

export function ReportsPage() {
  const { isOnline } = useAuth()
  const [sessions, setSessions] = useState<LocalSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [reportItems, setReportItems] = useState<ReportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [totals, setTotals] = useState({ products: 0, scans: 0, quantity: 0 })

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await getAllSessions()
        setSessions(data)
        if (data.length > 0) {
          setSelectedSessionId(data[0]?.id || '')
        }
      } catch (error) {
        console.error('Error loading sessions:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSessions()
  }, [])

  const loadReport = useCallback(async () => {
    if (!selectedSessionId) return

    setIsLoadingReport(true)
    try {
      // Try to get report from server first
      if (isOnline) {
        try {
          const { data } = await supabase.rpc('get_session_report', {
            p_session_id: selectedSessionId,
          }) as { data: SessionReport | null }

          if (data && data.items) {
            const items: ReportItem[] = data.items.map((item) => ({
              productId: item.product_id,
              productName: item.product_name || 'Desconhecido',
              barcode: item.barcode || '',
              sku: item.sku || '',
              totalQty: item.total_qty,
              scanCount: 1, // Server doesn't return scan count per item
            }))

            setReportItems(items)
            setTotals({
              products: data.totals.total_products,
              scans: data.totals.total_scans,
              quantity: data.totals.total_quantity,
            })
            setIsLoadingReport(false)
            return
          }
        } catch (error) {
          console.error('Error fetching server report:', error)
        }
      }

      // Fallback to local data
      const events = await getSessionEvents(selectedSessionId)
      const productsMap = new Map<string, ReportItem>()

      for (const event of events) {
        const key = event.product_id || event.barcode || ''
        if (!key) continue

        if (productsMap.has(key)) {
          const item = productsMap.get(key)!
          item.totalQty += event.qty_delta
          item.scanCount += 1
        } else {
          let product: Product | undefined
          if (event.product_id) {
            product = await db.products.get(event.product_id)
          } else if (event.barcode) {
            product = await db.products.where('barcode').equals(event.barcode).first()
          }

          productsMap.set(key, {
            productId: event.product_id || key,
            productName: product?.name || 'Produto não cadastrado',
            barcode: event.barcode || product?.barcode || '',
            sku: product?.sku || '',
            totalQty: event.qty_delta,
            scanCount: 1,
          })
        }
      }

      const items = Array.from(productsMap.values()).sort((a, b) =>
        a.productName.localeCompare(b.productName)
      )

      setReportItems(items)
      setTotals({
        products: items.length,
        scans: events.length,
        quantity: items.reduce((sum, item) => sum + item.totalQty, 0),
      })
    } catch (error) {
      console.error('Error loading report:', error)
    } finally {
      setIsLoadingReport(false)
    }
  }, [selectedSessionId, isOnline])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const exportCSV = () => {
    if (reportItems.length === 0) return

    const session = sessions.find((s) => s.id === selectedSessionId)
    const headers = ['Produto', 'Código de Barras', 'SKU', 'Quantidade', 'Scans']
    const rows = reportItems.map((item) => [
      item.productName,
      item.barcode,
      item.sku,
      item.totalQty.toString(),
      item.scanCount.toString(),
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `contagem_${session?.title?.replace(/\s+/g, '_') || 'relatorio'}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Relatórios
      </Typography>

      {isLoading ? (
        <Skeleton height={56} sx={{ mb: 2 }} />
      ) : sessions.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhuma sessão disponível
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Crie uma sessão de contagem para gerar relatórios
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Session selector */}
          <TextField
            select
            fullWidth
            label="Selecionar Sessão"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            sx={{ mb: 3 }}
          >
            {sessions.map((session) => (
              <MenuItem key={session.id} value={session.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography>{session.title}</Typography>
                  <Chip
                    size="small"
                    label={session.status === 'open' ? 'Aberta' : 'Fechada'}
                    sx={{
                      ml: 'auto',
                      bgcolor:
                        session.status === 'open'
                          ? (theme) => alpha(theme.palette.success.main, 0.2)
                          : (theme) => alpha(theme.palette.grey[500], 0.2),
                      color: session.status === 'open' ? 'success.main' : 'grey.500',
                    }}
                  />
                </Box>
              </MenuItem>
            ))}
          </TextField>

          {/* Summary cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Card sx={{ flex: 1, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary.main" fontWeight={700}>
                  {isLoadingReport ? '-' : totals.products}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Produtos
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1) }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="secondary.main" fontWeight={700}>
                  {isLoadingReport ? '-' : totals.quantity}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unidades
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, bgcolor: (theme) => alpha(theme.palette.info.main, 0.1) }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="info.main" fontWeight={700}>
                  {isLoadingReport ? '-' : totals.scans}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Scans
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Session info */}
          {selectedSession && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Detalhes da Sessão
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Criada em
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedSession.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                  {selectedSession.closed_at && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Fechada em
                      </Typography>
                      <Typography variant="body2">
                        {new Date(selectedSession.closed_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  )}
                  {selectedSession.notes && (
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Observações
                      </Typography>
                      <Typography variant="body2">{selectedSession.notes}</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Export button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportCSV}
            disabled={reportItems.length === 0 || isLoadingReport}
            sx={{ mb: 3 }}
          >
            Exportar CSV
          </Button>

          {/* Report table */}
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell align="right">Qtd</TableCell>
                    <TableCell align="right">Scans</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingReport ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton />
                        </TableCell>
                        <TableCell>
                          <Skeleton />
                        </TableCell>
                        <TableCell>
                          <Skeleton />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : reportItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <ProductIcon
                          sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }}
                        />
                        <Typography color="text.secondary">
                          Nenhum item contado nesta sessão
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportItems.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {item.productName}
                          </Typography>
                          {item.barcode && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: '"JetBrains Mono", monospace' }}
                            >
                              {item.barcode}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="primary.main"
                            sx={{ fontFamily: '"JetBrains Mono", monospace' }}
                          >
                            {item.totalQty}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontFamily: '"JetBrains Mono", monospace' }}
                          >
                            {item.scanCount}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  )
}

export default ReportsPage

