<template>
  <div class="page-container">
    <div class="page-header"><h3>退款管理</h3></div>
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="处理中" :value="0" />
            <el-option label="退款成功" :value="1" />
            <el-option label="退款失败" :value="2" />
            <el-option label="已拒绝" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="refundNo" label="退款单号" width="200" />
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column prop="refundAmount" label="退款金额" width="100">
          <template #default="{ row }">¥{{ formatPrice(row.refundAmount) }}</template>
        </el-table-column>
        <el-table-column prop="refundReason" label="原因" min-width="150" />
        <el-table-column prop="statusName" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="refundStatusType(row.status)">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyTime" label="申请时间" width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button size="small" type="success" @click="handleAudit(row, true)">通过</el-button>
              <el-button size="small" type="danger" @click="handleAudit(row, false)">拒绝</el-button>
            </template>
            <span v-else style="color:#94A3B8;">-</span>
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
import { getRefundList, auditRefund } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatPrice } from '@/utils/common'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const query = reactive({ status: null as number | null, pageNum: 1, pageSize: 10 })

function refundStatusType(s: number) {
  if (s === 0) return 'warning'
  if (s === 1) return 'success'
  if (s === 2) return 'danger'
  if (s === 3) return 'info'
  return 'info'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getRefundList(query)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally { loading.value = false }
}

async function handleAudit(row: any, approved: boolean) {
  if (approved) {
    ElMessageBox.confirm(`确定通过退款「${row.refundNo}」吗？`, '提示', { type: 'warning' }).then(async () => {
      try {
        await auditRefund({ refundNo: row.refundNo, approved: true })
        ElMessage.success('退款已通过')
        loadData()
      } catch { ElMessage.error('操作失败') }
    }).catch(() => {})
  } else {
    ElMessageBox.prompt('请输入拒绝原因', '拒绝退款', { type: 'warning' }).then(async ({ value }) => {
      try {
        await auditRefund({ refundNo: row.refundNo, approved: false, rejectReason: value })
        ElMessage.success('已拒绝')
        loadData()
      } catch { ElMessage.error('操作失败') }
    }).catch(() => {})
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-header { h3 { color: $text-primary; } }
.search-form { margin-bottom: 16px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
