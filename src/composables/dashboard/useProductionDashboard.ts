import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getProductionSummary, createFactoryReport, getWorkOrderList } from '@/api/production/production'
import type { ProductionAggregateResponse, WorkOrderOption } from '@/schemas/production/production'
import { usePermission } from '@/composables/usePermission'
import { formatNumber } from '@/lib/formatter'

export function useProductionDashboard() {
  const { hasPermission } = usePermission()

  // ─── State ─────────────────────────────────────────────
  const data = ref<ProductionAggregateResponse[]>([])
  const totalCount = ref(0)
  const isLoading = ref(false)
  const workOrders = ref<WorkOrderOption[]>([])
  const selectedWoId = ref<string>('0')
  const now = ref(new Date())

  // ─── Timer for Live Reactive Clock ─────────────────────
  let timerId: any = null
  onMounted(() => {
    timerId = setInterval(() => {
      now.value = new Date()
    }, 10000)
  })

  onUnmounted(() => {
    if (timerId) clearInterval(timerId)
  })

  // ─── Helpers ───────────────────────────────────────────
  const formatAngka = formatNumber

  const hitungProgresBobot = (target: number, prod: any) => {
    if (!target || target <= 0) return 0
    const c = prod?.cutting || 0
    const s = prod?.sewing || 0
    const q = prod?.qc_pass || 0
    const p = prod?.packing || 0
    const d = prod?.shipped || 0
    const totalProgress = (c + s + q + p + d) / (5 * target) * 100
    return parseFloat(totalProgress.toFixed(1))
  }

  // ─── Fetch ─────────────────────────────────────────────
  const fetchWorkOrders = async () => {
    if (!hasPermission('WO_READ')) {
      workOrders.value = []
      return
    }
    try {
      workOrders.value = await getWorkOrderList()
    } catch (error) {
      console.error('Gagal mengambil daftar Work Order:', error)
    }
  }

  const fetchData = async (params?: { page?: number; pageSize?: number; filter?: string }) => {
    isLoading.value = true
    try {
      const woId = Number(selectedWoId.value)
      const response = await getProductionSummary({
        limit: params?.pageSize ?? 20,
        page: params?.page ?? 1,
        search: params?.filter ?? '',
        id_wo: woId > 0 ? woId : undefined,
      })
      if (response) {
        data.value = response.items || []
        totalCount.value = response.pagination?.total || response.items?.length || 0
      }
    } catch (error) {
      console.error('Gagal mengambil ringkasan produksi:', error)
    } finally {
      isLoading.value = false
    }
  }

  const onWoChange = (val: string | number | bigint | Record<string, any> | null) => {
    selectedWoId.value = String(val ?? '0')
  }

  // ─── Computed: WO Info ─────────────────────────────────
  const selectedWoInfo = computed(() => {
    if (selectedWoId.value === '0') return null
    return workOrders.value.find(wo => wo.id_wo === Number(selectedWoId.value)) || null
  })

  // ─── Computed: Totals ──────────────────────────────────
  const totals = computed(() => {
    const r = { target_qty: 0, cutting: 0, sewing: 0, qc_pass: 0, packing: 0, shipped: 0 }
    data.value.forEach(item => {
      r.target_qty += item.target_qty || 0
      if (item.production) {
        r.cutting += item.production.cutting || 0
        r.sewing += item.production.sewing || 0
        r.qc_pass += item.production.qc_pass || 0
        r.packing += item.production.packing || 0
        r.shipped += item.production.shipped || 0
      }
    })
    return r
  })

  // ─── Card: Overall Progress (big card) ─────────────────
  const overallProgress = computed(() => {
    const t = totals.value
    const target = t.target_qty || 1
    const persen = hitungProgresBobot(target, t)
    return {
      persen: Math.min(persen, 100),
      targetProduksi: formatAngka(t.target_qty),
      jumlahDikirim: formatAngka(t.shipped),
    }
  })

  // ─── Card 1: Tahap Aktif ──────────────────────────────
  const kamusStatus: Record<string, string> = {
    'Not Started': 'Belum Mulai',
    'Cutting Stage': 'Potong Kain',
    'Sewing Stage': 'Jahit (Sewing)',
    'QC Stage': 'Cek Kualitas (QC)',
    'Packing Stage': 'Kemas/Packing',
    'Shipping Stage': 'Pengiriman',
    'Completed': 'Selesai Semua',
  }

  const activeStageInfo = computed(() => {
    const t = totals.value
    const target = t.target_qty

    let statusBackend = 'Not Started'
    if (target > 0 && t.shipped >= target) statusBackend = 'Completed'
    else if (t.shipped > 0 || (target > 0 && t.packing >= target)) statusBackend = 'Shipping Stage'
    else if (t.packing > 0 || (target > 0 && t.qc_pass >= target)) statusBackend = 'Packing Stage'
    else if (t.qc_pass > 0 || (target > 0 && t.sewing >= target)) statusBackend = 'QC Stage'
    else if (t.sewing > 0 || (target > 0 && t.cutting >= target)) statusBackend = 'Sewing Stage'
    else if (t.cutting > 0) statusBackend = 'Cutting Stage'

    let jumlahDiTahapAktif = 0
    if (statusBackend === 'Cutting Stage') jumlahDiTahapAktif = t.cutting
    else if (statusBackend === 'Sewing Stage') jumlahDiTahapAktif = t.sewing
    else if (statusBackend === 'QC Stage') jumlahDiTahapAktif = t.qc_pass
    else if (statusBackend === 'Packing Stage') jumlahDiTahapAktif = t.packing
    else if (statusBackend === 'Shipping Stage') jumlahDiTahapAktif = t.shipped

    return {
      value: kamusStatus[statusBackend] || 'Bekerja',
      subtitle: jumlahDiTahapAktif > 0
        ? `Hasil tahap ini: ${formatAngka(jumlahDiTahapAktif)}`
        : 'Belum ada data',
    }
  })

  // ─── Card 2: Jumlah Target ────────────────────────────
  const targetInfo = computed(() => {
    const totalTarget = totals.value.target_qty
    const targetPerShift = Math.round(totalTarget / 3)
    return {
      value: formatAngka(totalTarget),
      subtitle: `Jumlah per shift: ${formatAngka(targetPerShift)}`,
    }
  })

  // ─── Card 3: Progres (active stage-based) ─────────────
  const progressInfo = computed(() => {
    const t = totals.value
    const target = t.target_qty

    let statusBackend = 'Not Started'
    if (target > 0 && t.shipped >= target) statusBackend = 'Completed'
    else if (t.shipped > 0 || (target > 0 && t.packing >= target)) statusBackend = 'Shipping Stage'
    else if (t.packing > 0 || (target > 0 && t.qc_pass >= target)) statusBackend = 'Packing Stage'
    else if (t.qc_pass > 0 || (target > 0 && t.sewing >= target)) statusBackend = 'QC Stage'
    else if (t.sewing > 0 || (target > 0 && t.cutting >= target)) statusBackend = 'Sewing Stage'
    else if (t.cutting > 0) statusBackend = 'Cutting Stage'

    let title = 'Progres Produksi'
    let currentQty = 0
    let suffix = 'Unit lagi'

    if (statusBackend === 'Completed') {
      title = 'Progres Selesai'
      currentQty = t.shipped
      suffix = ''
    } else if (statusBackend === 'Shipping Stage') {
      title = 'Progres Pengiriman'
      currentQty = t.shipped
      suffix = 'Kirim lagi'
    } else if (statusBackend === 'Packing Stage') {
      title = 'Progres Packing'
      currentQty = t.packing
      suffix = 'Packing lagi'
    } else if (statusBackend === 'QC Stage') {
      title = 'Progres QC'
      currentQty = t.qc_pass
      suffix = 'QC lagi'
    } else if (statusBackend === 'Sewing Stage') {
      title = 'Progres Jahit'
      currentQty = t.sewing
      suffix = 'Jahit lagi'
    } else {
      // 'Cutting Stage' or 'Not Started'
      title = 'Progres Potong'
      currentQty = t.cutting
      suffix = 'Potong lagi'
    }

    const persen = target > 0 ? parseFloat(((currentQty / target) * 100).toFixed(1)) : 0
    const sisa = target > 0 ? Math.max(0, target - currentQty) : 0

    let subtitle = 'Target Selesai!'
    if (statusBackend !== 'Completed') {
      subtitle = sisa > 0 ? `Kurang: ${formatAngka(sisa)} ${suffix}` : 'Tahap Ini Selesai!'
    }

    return {
      title,
      value: `${persen}%`,
      persen: Math.min(persen, 100),
      subtitle,
    }
  })

  // ─── Card 4: Update Terakhir ──────────────────────────
  function dapatkanWaktuRelatif(isoString: string): { utama: string; bawah: string } {
    if (!isoString) return { utama: '--:--', bawah: 'Belum ada laporan' }

    const waktuData = new Date(isoString)
    const sekarang = now.value
    const selisihMs = sekarang.getTime() - waktuData.getTime()

    const menit = Math.floor(selisihMs / (1000 * 60))
    const jam = Math.floor(selisihMs / (1000 * 60 * 60))
    const hari = Math.floor(selisihMs / (1000 * 60 * 60 * 24))

    if (menit < 1) return { utama: 'Baru saja', bawah: 'Data paling baru' }
    if (menit < 60) {
      return { utama: `${menit} Menit`, bawah: 'Yang lalu' }
    }
    if (jam < 24) {
      return { utama: `${jam} Jam`, bawah: 'Yang lalu' }
    }
    return { utama: `${hari} Hari`, bawah: 'Yang lalu' }
  }

  const lastUpdateInfo = computed(() => {
    let latestDate: Date | null = null
    for (const item of data.value) {
      if (item.last_updated) {
        const d = new Date(item.last_updated)
        if (latestDate === null || d > latestDate) latestDate = d
      }
    }
    const isoStr = latestDate !== null ? latestDate.toISOString() : ''
    return dapatkanWaktuRelatif(isoStr)
  })

  // ─── Chart Data ────────────────────────────────────────
  const chartData = computed(() => {
    const t = totals.value
    const maxVal = Math.max(t.cutting, t.sewing, t.qc_pass, t.packing, t.shipped, 1)
    return [
      { label: 'Potong', value: t.cutting, percent: Math.round((t.cutting / maxVal) * 100) },
      { label: 'Jahit', value: t.sewing, percent: Math.round((t.sewing / maxVal) * 100) },
      { label: 'QC', value: t.qc_pass, percent: Math.round((t.qc_pass / maxVal) * 100) },
      { label: 'Packing', value: t.packing, percent: Math.round((t.packing / maxVal) * 100) },
      { label: 'Kirim', value: t.shipped, percent: Math.round((t.shipped / maxVal) * 100) },
    ]
  })

  // ─── Row-level completion helper ───────────────────────
  const getRowCompletion = (row: ProductionAggregateResponse) => {
    const target = row.target_qty || 1
    return Math.round(hitungProgresBobot(target, row.production))
  }

  const getRowStatus = (row: ProductionAggregateResponse): string => {
    return row.status || 'unknown'
  }

  return {
    // State
    data,
    totalCount,
    isLoading,
    workOrders,
    selectedWoId,
    selectedWoInfo,
    // Computed
    totals,
    overallProgress,
    activeStageInfo,
    targetInfo,
    progressInfo,
    lastUpdateInfo,
    chartData,
    // Helpers
    formatAngka,
    getRowCompletion,
    getRowStatus,
    // Actions
    fetchWorkOrders,
    fetchData,
    onWoChange,
    createFactoryReport,
  }
}
