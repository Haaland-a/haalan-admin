<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="card in statCards" :key="card.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">{{ card.label }}</div>
              <div class="stat-value">{{ card.value }}</div>
            </div>
            <el-icon :size="40" :color="card.color"><component :is="card.icon" /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-card class="chart-card" shadow="hover">
      <template #header><span>销售趋势（近 {{ trendDays }} 天）</span></template>
      <div ref="trendChartRef" style="height: 350px;"></div>
    </el-card>

    <!-- 活动销售排行 -->
    <el-card class="table-card" shadow="hover">
      <template #header><span>秒杀活动销售排行</span></template>
      <el-table :data="activityList" v-loading="tableLoading" stripe>
        <el-table-column prop="activityName" label="活动名称" min-width="180" />
        <el-table-column prop="statusName" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数" width="100" sortable />
        <el-table-column prop="totalAmount" label="销售额" width="120" sortable>
          <template #default="{ row }">¥{{ formatPrice(row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column prop="sellOutRate" label="售罄率" width="100">
          <template #default="{ row }">{{ row.sellOutRate }}%</template>
        </el-table-column>
        <el-table-column prop="avgPrice" label="均价" width="100">
          <template #default="{ row }">¥{{ row.avgPrice }}</template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="activityPage"
          :total="activityTotal"
          :page-size="10"
          layout="total, prev, pager, next"
          @current-change="loadActivities"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getOverviewStats, getActivityStatsList, getTrends } from '@/api/admin'
import { formatPrice } from '@/utils/common'
import { User, ShoppingCart, Money, WarningFilled } from '@element-plus/icons-vue'
import type { OverviewStats, ActivityStats, DailyTrend } from '@/types'

const trendDays = ref(7)
const trendChartRef = ref<HTMLElement>()
const tableLoading = ref(false)
const activityPage = ref(1)
const activityTotal = ref(0)
const activityList = ref<ActivityStats[]>([])

const overview = reactive<OverviewStats>({
  totalUsers: 0, totalOrders: 0, totalRevenue: 0, pendingRefunds: 0, todayOrders: 0, todayRevenue: 0
})

const statCards = ref<any[]>([])

function updateStatCards() {
  statCards.value = [
    { label: '总用户数', value: overview.totalUsers, icon: User, color: '#4F46E5' },
    { label: '今日订单数', value: overview.totalOrders, icon: ShoppingCart, color: '#15d580' },
    { label: '今日销售额', value: '¥' + formatPrice(overview.totalRevenue || 0), icon: Money, color: '#F59E0B' },
    { label: '待处理退款', value: overview.pendingRefunds, icon: WarningFilled, color: '#EF4444' }
  ]
}

function statusTagType(status: number) {
  if (status === 1) return 'success'
  if (status === 2) return 'info'
  return 'warning'
}

async function loadOverview() {
  try {
    const res = await getOverviewStats()
    if (res.code === 200 && res.data) {
      Object.assign(overview, res.data)
      updateStatCards()
    }
  } catch { /* ignore */ }
}

async function loadActivities() {
  tableLoading.value = true
  try {
    const res = await getActivityStatsList(activityPage.value, 10)
    if (res.code === 200 && res.data) {
      activityList.value = res.data.list || []
      activityTotal.value = res.data.total || 0
    }
  } catch { /* ignore */ }
  finally { tableLoading.value = false }
}

async function loadTrendChart() {
  try {
    const res = await getTrends(trendDays.value)
    if (res.code !== 200 || !res.data) return
    await nextTick()
    if (!trendChartRef.value) return
    const chart = echarts.init(trendChartRef.value)
    const data = res.data as DailyTrend[]
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['订单数', '销售额(元)'] },
      xAxis: { type: 'category', data: data.map(d => d.date) },
      yAxis: [
        { type: 'value', name: '订单数' },
        { type: 'value', name: '销售额(元)' }
      ],
      series: [
        { name: '订单数', type: 'bar', data: data.map(d => d.orderCount), itemStyle: { color: '#4F46E5' } },
        { name: '销售额(元)', type: 'line', yAxisIndex: 1, data: data.map(d => d.amount), smooth: true, itemStyle: { color: '#10B981' } }
      ]
    })
  } catch { /* ignore */ }
}

onMounted(() => {
  loadOverview()
  loadActivities()
  loadTrendChart()
})
</script>

<style lang="scss" scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; }
.stats-row { margin-bottom: 0; }
.stat-card {
  .stat-content { display: flex; align-items: center; justify-content: space-between; }
  .stat-label { font-size: 13px; color: $text-secondary; margin-bottom: 4px; }
  .stat-value { font-size: 24px; font-weight: bold; color: $text-primary; }
}
.chart-card { :deep(.el-card__header) { font-weight: bold; } }
.table-card { :deep(.el-card__header) { font-weight: bold; } }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
