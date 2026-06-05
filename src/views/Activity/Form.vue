<template>
  <div class="page-container">
    <div class="page-header">
      <h3>{{ isEdit ? '编辑活动' : '创建活动' }}</h3>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <!-- 活动基本信息 -->
    <el-card>
      <template #header><span>活动基本信息</span></template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="default">
        <el-form-item label="活动名称" prop="activityName">
          <el-input v-model="form.activityName" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择开始时间" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择结束时间" style="width:100%" />
        </el-form-item>
        <el-form-item label="活动描述" prop="activityDesc">
          <el-input v-model="form.activityDesc" type="textarea" :rows="3" placeholder="请输入活动描述" />
        </el-form-item>
        <el-form-item label="每人限购" prop="limitPerUser">
          <el-input-number v-model="form.limitPerUser" :min="1" :max="99" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">
            {{ isEdit ? '保存修改' : '创建活动' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 秒杀商品管理 -->
    <el-card v-if="activityId" class="product-card">
      <template #header>
        <span>秒杀商品管理 ({{ productList.length }})</span>
        <span>
          <el-button size="small" :loading="preheating" @click="handlePreheat">预热</el-button>
          <el-button size="small" type="primary" @click="showSearchDialog = true">添加商品</el-button>
        </span>
      </template>
      <el-table :data="productList" border stripe v-loading="loadingProducts">
        <el-table-column label="商品" min-width="180">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:8px;">
              <el-image v-if="row.productImages?.[0]" :src="row.productImages[0]" style="width:40px;height:40px;border-radius:4px;" fit="cover" />
              <span>{{ row.productName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规格" width="150">
          <template #default="{ row }">
            <template v-if="row.specifications && Object.keys(row.specifications).length">
              <el-tag v-for="(v,k) in row.specifications" :key="k" size="small" style="margin:1px 2px;">{{ k }}:{{ v }}</el-tag>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="originalPrice" label="原价" width="80" />
        <el-table-column prop="seckillPrice" label="秒杀价" width="80" />
        <el-table-column prop="stock" label="库存" width="60" />
        <el-table-column prop="limitPerUser" label="限购" width="60" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openStockDialog(row)">库存</el-button>
            <el-button size="small" @click="openEditDialog(row)">改价</el-button>
            <el-popconfirm title="确定删除该秒杀商品？" @confirm="handleDeleteProduct(row.seckillProductId)">
              <template #reference>
                <el-button size="small" type="danger" plain>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 商品搜索对话框 -->
    <el-dialog v-model="showSearchDialog" title="添加秒杀商品" width="800px" destroy-on-close @close="clearSearch">
      <!-- 搜索 -->
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <el-input v-model="searchKeyword" placeholder="搜索SPU名称或编码" clearable @keyup.enter="searchSpu" />
        <el-button type="primary" @click="searchSpu">搜索</el-button>
      </div>

      <!-- SPU 搜索结果 -->
      <el-table :data="spuList" stripe v-loading="searching" @row-click="selectSpu" highlight-current-row>
        <el-table-column prop="spuCode" label="编码" width="140" />
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="categoryName" label="分类" width="100" />
        <el-table-column prop="brandName" label="品牌" width="100" />
        <el-table-column label="主图" width="60">
          <template #default="{ row }">
            <el-image v-if="row.mainImage" :src="row.mainImage" style="width:36px;height:36px;" fit="cover" />
          </template>
        </el-table-column>
      </el-table>
      <div v-if="spuTotal > spuPageSize" class="pagination-wrap">
        <el-pagination background small :total="spuTotal" :page-size="spuPageSize"
          v-model:current-page="spuPageNum" @current-change="searchSpu" layout="prev,pager,next" />
      </div>

      <!-- 选中 SPU 的 SKU 列表 -->
      <template v-if="selectedSpu">
        <el-divider />
        <h4 style="margin:0 0 8px;">{{ selectedSpu.spuName }} — 选择 SKU 并设置秒杀信息</h4>
        <el-table :data="selectedSpu.skuList" stripe v-loading="loadingSku">
          <el-table-column prop="skuCode" label="SKU编码" width="120" />
          <el-table-column label="规格" width="140">
            <template #default="{ row }">
              <template v-if="row.specifications">
                <el-tag v-for="(v,k) in row.specifications" :key="k" size="small" style="margin:1px 2px;">{{ k }}:{{ v }}</el-tag>
              </template>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="原价" width="70" />
          <el-table-column prop="stock" label="库存" width="60" />
          <el-table-column label="秒杀价" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row._seckillPrice" :min="0.01" :precision="2" size="small" style="width:100px;" />
            </template>
          </el-table-column>
          <el-table-column label="秒杀库存" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row._seckillStock" :min="1" size="small" style="width:100px;" />
            </template>
          </el-table-column>
          <el-table-column label="限购" width="80">
            <template #default="{ row }">
              <el-input-number v-model="row._limitPerUser" :min="1" :max="99" size="small" style="width:80px;" />
            </template>
          </el-table-column>
        </el-table>
        <div style="text-align:right;margin-top:12px;">
          <el-button type="primary" :loading="addingProducts" @click="addSelectedProducts">添加所选</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改价格/限购对话框 -->
    <el-dialog v-model="showEditDialog" title="修改秒杀价格和限购" width="400px" destroy-on-close>
      <el-form v-if="editForm" :model="editForm" label-width="100px">
        <el-form-item label="商品">{{ editForm.productName }}</el-form-item>
        <el-form-item label="秒杀价" prop="seckillPrice">
          <el-input-number v-model="editForm.seckillPrice" :min="0.01" :precision="2" style="width:100%;" />
        </el-form-item>
        <el-form-item label="限购" prop="limitPerUser">
          <el-input-number v-model="editForm.limitPerUser" :min="1" :max="99" style="width:100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="updatingProductInfo" @click="confirmUpdateProductInfo">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 修改库存对话框 -->
    <el-dialog v-model="showStockDialog" title="修改秒杀库存" width="400px" destroy-on-close>
      <el-form v-if="stockForm" label-width="100px">
        <el-form-item label="商品">{{ stockForm.productName }}</el-form-item>
        <el-form-item label="当前库存">{{ stockForm.stock }}</el-form-item>
        <el-form-item label="新库存">
          <el-input-number v-model="stockForm.newStock" :min="0" style="width:100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStockDialog = false">取消</el-button>
        <el-button type="primary" :loading="updatingStock" @click="confirmUpdateStock">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createActivity, updateActivity,
  getActivityProducts, getSpuList, getProductDetail,
  batchAddActivityProducts, updateSeckillProductStock, preheatActivity,
  deleteSeckillProduct, updateSeckillProductInfo
} from '@/api/admin'
import { ElMessage } from 'element-plus'
import { formatTime } from '@/utils/common'
import type { SeckillActivityProduct, ProductDetailSku, SeckillActivityDetail } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const formRef = ref()
const saving = ref(false)

// ---- 活动表单 ----
const activityId = ref<number | null>(null)
const form = reactive({
  activityName: '', startTime: '', endTime: '', activityDesc: '', limitPerUser: 5
})
const rules = {
  activityName: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  limitPerUser: [{ required: true, message: '请输入限购数量', trigger: 'blur' }]
}

/** 调用用户端详情接口获取活动信息+商品列表 */
async function loadActivityDetail(id: number) {
  try {
    const res = await getActivityProducts(id)
    if (res.code === 200 && res.data) {
      // 活动基本信息（用户端接口含 startTime / endTime）
      form.activityName = res.data.activityName
      form.startTime = res.data.startTime || ''
      form.endTime = res.data.endTime || ''
      activityId.value = id
      // 商品列表
      productList.value = (res.data.products || []).map(p => ({
        seckillProductId: p.productId,
        activityId: id,
        skuId: p.skuId,
        productName: p.name,
        productImages: p.images || [],
        specifications: p.specifications || {},
        originalPrice: p.originalPrice,
        seckillPrice: p.seckillPrice,
        stock: Number(p.stock) || 0,
        limitPerUser: Number(p.limitPerUser) || 1
      }))
    }
  } catch { /* ignore */ }
}

onMounted(() => {
  if (isEdit.value) {
    // 设置 activityId 触发 watch 自动加载详情和商品列表
    activityId.value = Number(route.params.id)
  }
})

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const data = {
      activityName: form.activityName,
      startTime: formatTime(form.startTime),
      endTime: formatTime(form.endTime),
      activityDesc: form.activityDesc,
      limitPerUser: form.limitPerUser
    }
    if (isEdit.value) {
      await updateActivity(Number(route.params.id), data)
      ElMessage.success('修改成功')
      await loadActivityDetail(Number(route.params.id))
    } else {
      const res = await createActivity(data)
      activityId.value = res.data.activityId
      ElMessage.success('创建成功，现在可以添加秒杀商品了')
    }
  } catch {
    ElMessage.error('保存失败')
  } finally { saving.value = false }
}

// ---- 秒杀商品管理 ----
const productList = ref<SeckillActivityProduct[]>([])
const loadingProducts = ref(false)

watch(activityId, async (id) => {
  if (!id) return
  loadingProducts.value = true
  await loadActivityDetail(id)
  loadingProducts.value = false
}, { immediate: false })

// ---- 预热 ----
const preheating = ref(false)
async function handlePreheat() {
  if (!activityId.value) return
  preheating.value = true
  try {
    await preheatActivity(activityId.value, true)
    ElMessage.success('预热成功')
  } catch {
    ElMessage.error('预热失败')
  } finally { preheating.value = false }
}

/** 刷新商品列表 */
async function reloadProducts() {
  if (!activityId.value) return
  const res = await getActivityProducts(activityId.value)
  if (res.code === 200 && res.data) {
    productList.value = (res.data.products || []).map(p => ({
      seckillProductId: p.productId,
      activityId: activityId.value!,
      skuId: p.skuId,
      productName: p.name,
      productImages: p.images || [],
      specifications: p.specifications || {},
      originalPrice: p.originalPrice,
      seckillPrice: p.seckillPrice,
      stock: Number(p.stock) || 0,
      limitPerUser: Number(p.limitPerUser) || 1
    }))
  }
}

// ---- 删除秒杀商品 ----
async function handleDeleteProduct(seckillProductId: number) {
  try {
    await deleteSeckillProduct(seckillProductId)
    ElMessage.success('删除成功')
    await reloadProducts()
  } catch {
    ElMessage.error('删除失败')
  }
}

// ---- 修改价格/限购 ----
const showEditDialog = ref(false)
const editForm = ref<{ seckillProductId: number; productName: string; seckillPrice: number; limitPerUser: number } | null>(null)
const updatingProductInfo = ref(false)

function openEditDialog(row: SeckillActivityProduct) {
  editForm.value = {
    seckillProductId: row.seckillProductId,
    productName: row.productName,
    seckillPrice: row.seckillPrice,
    limitPerUser: row.limitPerUser
  }
  showEditDialog.value = true
}

async function confirmUpdateProductInfo() {
  if (!editForm.value) return
  updatingProductInfo.value = true
  try {
    await updateSeckillProductInfo(editForm.value.seckillProductId, {
      seckillPrice: editForm.value.seckillPrice,
      limitPerUser: editForm.value.limitPerUser
    })
    ElMessage.success('修改成功')
    showEditDialog.value = false
    await reloadProducts()
  } catch {
    ElMessage.error('修改失败')
  } finally { updatingProductInfo.value = false }
}

// ---- 商品搜索 ----
const showSearchDialog = ref(false)
const searchKeyword = ref('')
const searching = ref(false)
const spuList = ref<any[]>([])
const spuTotal = ref(0)
const spuPageNum = ref(1)
const spuPageSize = 10
type SkuWithSeckillFields = ProductDetailSku & { _seckillPrice: number; _seckillStock: number; _limitPerUser: number }
const selectedSpu = ref<{ spuName: string; skuList: SkuWithSeckillFields[] } | null>(null)
const loadingSku = ref(false)
const addingProducts = ref(false)

async function searchSpu() {
  searching.value = true
  try {
    const res = await getSpuList({
      keyword: searchKeyword.value || undefined,
      pageNo: spuPageNum.value,
      pageSize: spuPageSize
    })
    if (res.code === 200 && res.data) {
      spuList.value = res.data.list || []
      spuTotal.value = res.data.total || 0
    }
  } finally { searching.value = false }
}

async function selectSpu(row: any) {
  loadingSku.value = true
  selectedSpu.value = null
  try {
    const res = await getProductDetail(row.spuId)
    if (res.code === 200 && res.data) {
      const skus = (res.data.skuList || []).map(s => ({
        ...s,
        _seckillPrice: s.price,
        _seckillStock: 10,
        _limitPerUser: form.limitPerUser || 1
      }))
      selectedSpu.value = { spuName: res.data.spuName, skuList: skus }
    }
  } finally { loadingSku.value = false }
}

function clearSearch() {
  searchKeyword.value = ''
  spuList.value = []
  spuTotal.value = 0
  spuPageNum.value = 1
  selectedSpu.value = null
}

async function addSelectedProducts() {
  if (!selectedSpu.value || !activityId.value) return
  const products = selectedSpu.value.skuList
    .filter(s => s._seckillPrice > 0)
    .map((s, i) => ({
      skuId: s.skuId,
      seckillPrice: s._seckillPrice,
      stock: s._seckillStock,
      limitPerUser: s._limitPerUser,
      sort: productList.value.length + i + 1
    }))
  if (products.length === 0) {
    ElMessage.warning('请至少设置一个SKU的秒杀价')
    return
  }
  addingProducts.value = true
  try {
    const res = await batchAddActivityProducts(activityId.value, { products })
    ElMessage.success(`成功添加 ${res.data?.successCount || products.length} 个商品`)
    showSearchDialog.value = false
    await reloadProducts()
  } catch {
    ElMessage.error('添加失败')
  } finally { addingProducts.value = false }
}

// ---- 修改库存 ----
const showStockDialog = ref(false)
const stockForm = ref<{ seckillProductId: number; productName: string; stock: number; newStock: number } | null>(null)
const updatingStock = ref(false)

function openStockDialog(row: SeckillActivityProduct) {
  stockForm.value = {
    seckillProductId: row.seckillProductId,
    productName: row.productName,
    stock: row.stock,
    newStock: row.stock
  }
  showStockDialog.value = true
}

async function confirmUpdateStock() {
  if (!stockForm.value) return
  updatingStock.value = true
  try {
    await updateSeckillProductStock(stockForm.value.seckillProductId, { stock: stockForm.value.newStock })
    ElMessage.success('库存更新成功')
    showStockDialog.value = false
    await reloadProducts()
  } catch {
    ElMessage.error('更新失败')
  } finally { updatingStock.value = false }
}
</script>

<style lang="scss" scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; h3 { color: $text-primary; } }
.product-card {
  :deep(.el-card__header) {
    display: flex; align-items: center; justify-content: space-between;
  }
}
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 8px; }
</style>
