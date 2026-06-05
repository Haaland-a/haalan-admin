<template>
  <div class="page-container">
    <div class="page-header">
      <h3>商品管理 (SPU)</h3>
      <el-button type="primary" @click="$router.push('/products/spu/create')">创建SPU</el-button>
    </div>
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="SPU名称/编码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="spuId" label="ID" width="80" />
        <el-table-column prop="spuCode" label="编码" width="140" />
        <el-table-column prop="name" label="名称" min-width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push('/products/spu/' + row.spuId)">{{ row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="brandName" label="品牌" width="100" />
        <el-table-column prop="statusName" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.statusName === '上架' ? 'success' : 'info'"
              style="cursor: pointer;"
              @click="handleToggleStatus(row)"
            >{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >{{ row.status === 1 ? '下架' : '上架' }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="query.pageNo"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="onSizeChange"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getSpuList, updateSpuStatus } from '@/api/admin'
import { ElMessageBox, ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const query = reactive({ keyword: '', status: null as number | null, pageNo: 1, pageSize: 20 })

async function loadData() {
  loading.value = true
  try {
    const res = await getSpuList(query)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.list || []
      total.value = Number(res.data.total) || 0
    }
  } finally { loading.value = false }
}

function onSizeChange(size: number) {
  query.pageSize = size
  query.pageNo = 1
  loadData()
}

async function handleToggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确定要将商品「${row.name}」${action}吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await updateSpuStatus(row.spuId, { status: newStatus })
    ElMessage.success(`${action}成功`)
    await loadData()
  } catch {
    // cancelled or error — do nothing
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; h3 { color: $text-primary; } }
.search-form { margin-bottom: 16px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
