<template>
  <div class="page-container">
    <div class="page-header">
      <h3>活动管理</h3>
      <el-button type="primary" @click="$router.push('/activities/create')">创建活动</el-button>
    </div>
    <el-card>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="activityName" label="活动名称" min-width="160" />
        <el-table-column prop="statusName" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'info' : 'warning'">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="170" />
        <el-table-column prop="endTime" label="结束时间" width="170" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="$router.push(`/activities/${row.activityId}/edit`)">编辑</el-button>
            <el-button size="small" type="warning" @click="handlePreheat(row)">预热</el-button>
            <el-button size="small" type="danger" v-if="row.status !== 2" @click="handleEnd(row)">结束</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pageNum"
          :total="total"
          :page-size="pageSize"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getActivityStatsList, preheatActivity, updateActivity } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ActivityStats } from '@/types'

const loading = ref(false)
const tableData = ref<ActivityStats[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

async function loadData() {
  loading.value = true
  try {
    const res = await getActivityStatsList(pageNum.value, pageSize.value)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally { loading.value = false }
}

async function handlePreheat(row: ActivityStats) {
  try {
    await preheatActivity(row.activityId)
    ElMessage.success(`活动「${row.activityName}」预热成功`)
  } catch { ElMessage.error('预热失败') }
}

async function handleEnd(row: ActivityStats) {
  ElMessageBox.confirm(`确定要结束活动「${row.activityName}」吗？`, '提示', { type: 'warning' }).then(async () => {
    try {
      await updateActivity(row.activityId, { status: 2 })
      ElMessage.success('已结束')
      loadData()
    } catch { ElMessage.error('操作失败') }
  }).catch(() => {})
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; h3 { color: $text-primary; } }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
