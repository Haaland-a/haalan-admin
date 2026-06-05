<template>
  <div class="page-container">
    <div class="page-header"><h3>普通订单管理</h3></div>
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="query.orderNo" placeholder="订单号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column prop="totalAmount" label="金额" width="100">
          <template #default="{ row }">¥{{ formatPrice(row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column prop="statusName" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="orderStatusType(row.status)">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="$router.push(`/orders/${row.orderNo}`)">详情</el-button>
            <el-button size="small" type="success" v-if="row.status === 1" @click="handleStatus(row.orderNo, 2)">发货</el-button>
            <el-button size="small" type="primary" v-if="row.status === 2" @click="handleStatus(row.orderNo, 3)">完成</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="(size: number) => { query.pageSize = size; query.pageNum = 1; loadData() }"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getOrderList, updateOrderStatus } from '@/api/admin'
import { ElMessage } from 'element-plus'
import { formatPrice } from '@/utils/common'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const query = reactive({ orderNo: '', status: null as number | null, pageNum: 1, pageSize: 20 })

function orderStatusType(s: number) {
  if (s === 1) return 'warning'
  if (s === 2) return 'primary'
  if (s === 3) return 'success'
  if (s === 4) return 'info'
  return 'danger'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getOrderList(query)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.list || []
      total.value = Number(res.data.total) || 0
    }
  } finally { loading.value = false }
}

async function handleStatus(orderNo: string, status: number) {
  try {
    await updateOrderStatus(orderNo, { status })
    ElMessage.success('状态更新成功')
    loadData()
  } catch { ElMessage.error('操作失败') }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-header { h3 { color: $text-primary; } }
.search-form { margin-bottom: 16px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
