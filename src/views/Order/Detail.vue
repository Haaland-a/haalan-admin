<template>
  <div class="page-container">
    <div class="page-header">
      <h3>订单详情</h3>
      <el-button @click="$router.back()">返回</el-button>
    </div>
    <el-card v-loading="loading">
      <template v-if="detail.order">
        <!-- 秒杀订单 -->
        <template v-if="isSeckill">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ detail.order.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ detail.order.userId }}</el-descriptions-item>
            <el-descriptions-item label="商品名称" :span="2">{{ detail.order.productName }}</el-descriptions-item>
            <el-descriptions-item label="秒杀价">¥{{ formatPrice(detail.order.seckillPrice) }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ detail.order.quantity }}</el-descriptions-item>
            <el-descriptions-item label="总金额">¥{{ formatPrice(detail.order.totalAmount) }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="seckillStatusTag(detail.order.status)">{{ seckillStatusName(detail.order.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ detail.order.orderTime }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ detail.order.payTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="取消时间">{{ detail.order.cancelTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detail.order.createTime }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <!-- 普通订单 -->
        <template v-else>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ detail.order.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ detail.order.userId }}</el-descriptions-item>
            <el-descriptions-item label="总金额">¥{{ formatPrice(detail.order.totalAmount) }}</el-descriptions-item>
            <el-descriptions-item label="实付金额">¥{{ formatPrice(detail.order.actualAmount) }}</el-descriptions-item>
            <el-descriptions-item label="订单类型">{{ detail.order.orderTypeName }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag>{{ detail.order.statusName }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detail.order.createTime }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ detail.order.remark || '-' }}</el-descriptions-item>
          </el-descriptions>

          <h4 style="margin-top:20px;margin-bottom:12px;">商品明细</h4>
          <el-table :data="detail.items || []" stripe>
            <el-table-column prop="productName" label="商品名称" min-width="160" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="{ row }">¥{{ formatPrice(row.price) }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="totalPrice" label="小计" width="120">
              <template #default="{ row }">¥{{ formatPrice(row.totalPrice) }}</template>
            </el-table-column>
          </el-table>

          <div class="actions" style="margin-top:20px;">
            <el-button type="success" v-if="detail.order.status === 1" @click="handleStatus(2)">发货</el-button>
            <el-button type="primary" v-if="detail.order.status === 2" @click="handleStatus(3)">完成订单</el-button>
          </div>
        </template>
      </template>
      <el-empty v-else description="订单不存在" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderDetail, getSeckillOrderDetail, updateOrderStatus } from '@/api/admin'
import { ElMessage } from 'element-plus'
import { formatPrice } from '@/utils/common'

const route = useRoute()
const loading = ref(false)
const detail = reactive<{ order: any; items: any[] }>({ order: null, items: [] })

const isSeckill = computed(() => route.query.type === 'seckill')

const seckillStatusMap: Record<number, { name: string; tag: string }> = {
  0: { name: '待支付', tag: 'warning' },
  1: { name: '已支付', tag: 'success' },
  2: { name: '已取消', tag: 'info' },
  3: { name: '已超时', tag: 'danger' },
}

function seckillStatusName(status: number) {
  return seckillStatusMap[status]?.name || '未知'
}

function seckillStatusTag(status: number) {
  return seckillStatusMap[status]?.tag || 'info'
}

async function loadDetail() {
  loading.value = true
  try {
    const orderNo = route.params.orderNo as string
    const res = isSeckill.value
      ? await getSeckillOrderDetail(orderNo)
      : await getOrderDetail(orderNo)
    if (res.code === 200 && res.data) {
      detail.order = (res.data as any).order
      detail.items = (res.data as any).items || []
    }
  } finally { loading.value = false }
}

async function handleStatus(status: number) {
  try {
    await updateOrderStatus(route.params.orderNo as string, { status })
    ElMessage.success('状态更新成功')
    loadDetail()
  } catch { ElMessage.error('操作失败') }
}

onMounted(loadDetail)
</script>

<style lang="scss" scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; h3 { color: $text-primary; } }
</style>
