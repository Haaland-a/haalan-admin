<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h3>SPU 详情</h3>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <!-- SPU 基本信息 -->
    <el-card>
      <template #header><span>基本信息</span></template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="default">
        <el-form-item label="SPU编码">
          <el-input :model-value="detail?.spuCode" disabled />
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-tree-select
            v-model="form.categoryId"
            :data="categoryTree"
            :props="{ label: 'name', value: 'categoryId', children: 'children' }"
            placeholder="请选择分类" check-strictly clearable filterable style="width:100%"
          />
        </el-form-item>
        <el-form-item label="品牌" prop="brandId">
          <div style="display:flex;gap:8px;width:100%;">
            <el-input :model-value="brandName" placeholder="请选择品牌" readonly />
            <el-button @click="brandDialogVisible = true">选择品牌</el-button>
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>

        <!-- 主图 -->
        <el-form-item label="主图" prop="mainImage">
          <div class="upload-row">
            <el-upload
              ref="mainUploadRef"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :disabled="!detail?.spuCode"
              :before-upload="beforeMainUpload"
              :on-change="handleMainUpload"
              accept="image/jpeg,image/png,image/gif,image/webp"
            >
              <div v-loading="mainUploading" class="upload-trigger">
                <img v-if="form.mainImage" :src="form.mainImage" class="preview-img" />
                <el-icon v-else :size="28"><Plus /></el-icon>
              </div>
            </el-upload>
            <div class="upload-info">
              <template v-if="form.mainImage">
                <span class="url-text">{{ form.mainImage.slice(-40) }}</span>
                <el-button size="small" type="danger" plain @click="form.mainImage = ''">移除</el-button>
              </template>
              <span v-else class="tip-text">点击上传主图</span>
            </div>
          </div>
        </el-form-item>

        <!-- 商品图册 -->
        <el-form-item label="商品图册">
          <div class="upload-row" style="flex-direction: column; align-items: flex-start;">
            <el-upload
              ref="galleryUploadRef"
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :multiple="true"
              :disabled="!detail?.spuCode"
              :file-list="galleryFileList"
              :before-upload="beforeGalleryUpload"
              :on-change="handleGalleryChange"
              :on-remove="handleGalleryRemove"
              accept="image/jpeg,image/png,image/gif,image/webp"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <el-button
                size="small"
                type="primary"
                :loading="galleryUploading"
                :disabled="galleryFileList.length === 0"
                @click="uploadGalleryImages"
              >上传图册图片</el-button>
            </div>
            <!-- 已上传图册展示 -->
            <div v-if="form.images.length" class="gallery-preview">
              <div v-for="(url, i) in form.images" :key="i" class="gallery-item">
                <img :src="url" />
                <el-button size="small" circle type="danger" @click="form.images.splice(i, 1)">×</el-button>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- SKU 列表 -->
    <el-card>
      <template #header><span>SKU 列表 ({{ skuList.length }})</span></template>
      <el-table :data="skuList" border stripe>
        <el-table-column prop="skuCode" label="编码" width="140" />
        <el-table-column prop="skuName" label="名称" min-width="140" />
        <el-table-column label="售价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="原价" width="100">
          <template #default="{ row }">¥{{ row.originalPrice }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="70" />
        <el-table-column prop="soldCount" label="销量" width="70" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="规格" min-width="160">
          <template #default="{ row }">
            <span v-if="!row.specifications || Object.keys(row.specifications).length === 0">—</span>
            <el-tag v-for="(v, k) in row.specifications" :key="k" size="small" style="margin-right:4px;">{{ k }}: {{ v }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image v-if="row.images?.[0]" :src="row.images[0]" style="width:40px;height:40px;" fit="cover" />
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editSku(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggleSkuStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- SKU 编辑对话框 -->
    <el-dialog v-model="skuDialogVisible" title="编辑 SKU" width="560px" destroy-on-close @close="skuDialogVisible = false">
      <el-form ref="skuFormRef" :model="skuForm" :rules="skuRules" label-width="110px">
        <el-form-item label="SKU编码">
          <el-input :model-value="skuForm.skuCode" disabled />
        </el-form-item>
        <el-form-item label="SKU名称" prop="name">
          <el-input v-model="skuForm.name" />
        </el-form-item>
        <el-form-item label="售价" prop="price">
          <el-input-number v-model="skuForm.price" :precision="2" :min="0.01" style="width:100%" />
        </el-form-item>
        <el-form-item label="优惠价" prop="promotionPrice">
          <el-input-number v-model="skuForm.promotionPrice" :precision="2" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="规格">
          <div v-if="skuForm.specifications && Object.keys(skuForm.specifications).length > 0">
            <el-tag v-for="(v, k) in skuForm.specifications" :key="k" size="small" style="margin-right:4px;margin-bottom:4px;">
              {{ k }}: {{ v }}
            </el-tag>
          </div>
          <span v-else>—</span>
        </el-form-item>
        <el-form-item label="SKU图片">
          <div class="upload-row">
            <el-upload
              ref="skuUploadRef"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :disabled="!detail?.spuCode"
              :before-upload="beforeSkuUpload"
              :on-change="handleSkuUpload"
              accept="image/jpeg,image/png,image/gif,image/webp"
            >
              <div v-loading="skuUploading" class="upload-trigger" style="width:100px;height:100px;">
                <img v-if="skuForm.mainImage" :src="skuForm.mainImage" class="preview-img" />
                <el-icon v-else :size="24"><Plus /></el-icon>
              </div>
            </el-upload>
            <span v-if="skuForm.mainImage" class="tip-text" style="margin-left:8px;">
              {{ skuForm.mainImage.slice(-30) }}
            </span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skuDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="skuSaving" @click="handleSaveSku">保存</el-button>
      </template>
    </el-dialog>

    <!-- 品牌选择对话框 -->
    <el-dialog v-model="brandDialogVisible" title="选择品牌" width="500px" destroy-on-close>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <el-input v-model="brandKeyword" placeholder="搜索品牌名称" clearable @keyup.enter="searchBrands" />
        <el-button type="primary" @click="searchBrands">搜索</el-button>
      </div>
      <div
        class="no-brand-option"
        @click="selectNoBrand"
      >
        <el-icon><Plus /></el-icon> 没有我要添加的品牌（不选择品牌）
      </div>
      <el-table :data="brandList" stripe v-loading="brandLoading" highlight-current-row @row-click="selectBrand">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="品牌名称" />
      </el-table>
      <template #footer>
        <el-button @click="brandDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdminSpuDetail, updateSpu, updateSkuInfo, updateSkuStatus, getCategoryTree, getBrandList } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { uploadToOSS, validateImageFile } from '@/utils/upload'
import type { UploadInstance, UploadProps, UploadUserFile } from 'element-plus'
import type { ProductDetailVO, ProductDetailSku, CategoryNode, BrandItem } from '@/types'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const detail = ref<ProductDetailVO | null>(null)
const skuList = ref<ProductDetailSku[]>([])

const form = reactive({
  name: '', categoryId: null as number | null, brandId: null as number | null,
  description: '', mainImage: '', images: [] as string[], status: 1
})
const rules: Record<string, any> = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

// ---- 分类树 ----
const categoryTree = ref<CategoryNode[]>([])
async function loadCategoryTree() {
  const res = await getCategoryTree(0, 3)
  if (res.code === 200) categoryTree.value = res.data || []
}

// ---- 品牌选择 ----
const brandDialogVisible = ref(false)
const brandKeyword = ref('')
const brandList = ref<BrandItem[]>([])
const brandLoading = ref(false)
const brandName = ref('')

async function searchBrands() {
  brandLoading.value = true
  try {
    const res = await getBrandList(brandKeyword.value || undefined)
    brandList.value = res.data || []
  } finally { brandLoading.value = false }
}
function selectBrand(row: BrandItem) {
  form.brandId = row.id
  brandName.value = row.name
  brandDialogVisible.value = false
}
function selectNoBrand() {
  form.brandId = null
  brandName.value = ''
  brandDialogVisible.value = false
}

// ---- SPU 图片上传 ----
const mainUploadRef = ref<UploadInstance>()
const mainUploading = ref(false)
const galleryUploadRef = ref<UploadInstance>()
const galleryUploading = ref(false)
const galleryFileList = ref<UploadUserFile[]>([])

const beforeMainUpload: UploadProps['beforeUpload'] = (file) => {
  const v = validateImageFile(file, 5)
  if (!v.valid) { ElMessage.error(v.message); return false }
  return true
}
const handleMainUpload: UploadProps['onChange'] = async (uploadFile) => {
  if (!uploadFile.raw || !detail.value?.spuCode) return
  mainUploading.value = true
  try {
    const url = await uploadToOSS(uploadFile.raw, detail.value.spuCode)
    form.mainImage = url
    ElMessage.success('主图上传成功')
  } catch (e: any) {
    ElMessage.error(e.message || '主图上传失败')
  } finally {
    mainUploading.value = false
    mainUploadRef.value?.clearFiles()
  }
}

const beforeGalleryUpload: UploadProps['beforeUpload'] = (file) => {
  const v = validateImageFile(file, 5)
  if (!v.valid) { ElMessage.error(v.message); return false }
  return true
}
const handleGalleryChange: UploadProps['onChange'] = (_f, files) => { galleryFileList.value = files }
const handleGalleryRemove: UploadProps['onRemove'] = (_f, files) => { galleryFileList.value = files }

async function uploadGalleryImages() {
  if (galleryFileList.value.length === 0 || !detail.value?.spuCode) return
  galleryUploading.value = true
  try {
    for (const f of galleryFileList.value) {
      if (f.raw) form.images.push(await uploadToOSS(f.raw, detail.value.spuCode))
    }
    ElMessage.success(`成功上传 ${galleryFileList.value.length} 张图片`)
    galleryFileList.value = []
    galleryUploadRef.value?.clearFiles()
  } catch (e: any) {
    ElMessage.error(e.message || '图册上传失败')
  } finally {
    galleryUploading.value = false
  }
}

// ---- SKU 编辑对话框 ----
const skuDialogVisible = ref(false)
const skuSaving = ref(false)
const skuFormRef = ref()
const skuUploadRef = ref<UploadInstance>()
const skuUploading = ref(false)
const editingSkuId = ref<number | null>(null)
const editingSkuCode = ref('')
const skuForm = reactive({
  skuCode: '',
  name: '',
  price: 0,
  promotionPrice: 0,
  specifications: {} as Record<string, string>,
  mainImage: ''
})
const skuRules: Record<string, any> = {
  name: [{ required: true, message: '请输入SKU名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入售价', trigger: 'blur' }]
}

function editSku(sku: ProductDetailSku) {
  editingSkuId.value = sku.skuId
  editingSkuCode.value = sku.skuCode
  skuForm.skuCode = sku.skuCode
  skuForm.name = sku.skuName
  skuForm.price = sku.price
  skuForm.promotionPrice = sku.originalPrice
  skuForm.specifications = sku.specifications || {}
  skuForm.mainImage = sku.images?.[0] || ''
  skuDialogVisible.value = true
}

const beforeSkuUpload: UploadProps['beforeUpload'] = (file) => {
  const v = validateImageFile(file, 5)
  if (!v.valid) { ElMessage.error(v.message); return false }
  return true
}
const handleSkuUpload: UploadProps['onChange'] = async (uploadFile) => {
  if (!uploadFile.raw || !detail.value?.spuCode || !editingSkuCode.value) return
  skuUploading.value = true
  try {
    const url = await uploadToOSS(uploadFile.raw, detail.value.spuCode, editingSkuCode.value)
    skuForm.mainImage = url
    ElMessage.success('SKU图片上传成功')
  } catch (e: any) {
    ElMessage.error(e.message || 'SKU图片上传失败')
  } finally {
    skuUploading.value = false
    skuUploadRef.value?.clearFiles()
  }
}

async function handleSaveSku() {
  const valid = await skuFormRef.value?.validate().catch(() => false)
  if (!valid || editingSkuId.value === null) return
  skuSaving.value = true
  try {
    await updateSkuInfo(editingSkuId.value, {
      name: skuForm.name,
      price: skuForm.price,
      promotionPrice: skuForm.promotionPrice > 0 ? skuForm.promotionPrice : undefined,
      images: skuForm.mainImage ? [skuForm.mainImage] : []
    })
    ElMessage.success('SKU保存成功')
    skuDialogVisible.value = false
    await loadDetail()
  } catch { ElMessage.error('SKU保存失败') }
  finally { skuSaving.value = false }
}

// ---- SKU 状态切换 ----
async function toggleSkuStatus(sku: ProductDetailSku) {
  const newStatus = sku.status === 1 ? 0 : 1
  const label = newStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确定${label}该 SKU 吗？`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await updateSkuStatus(sku.skuId, { status: newStatus })
    ElMessage.success(`${label}成功`)
    await loadDetail()
  } catch { ElMessage.error(`${label}失败`) }
}

// ---- 加载详情 ----
async function loadDetail() {
  const spuId = Number(route.params.id)
  if (!spuId) { ElMessage.error('参数错误'); return }
  loading.value = true
  try {
    const [detailRes] = await Promise.all([
      getAdminSpuDetail(spuId),
      loadCategoryTree()
    ])
    if (detailRes.code === 200 && detailRes.data) {
      detail.value = detailRes.data
      form.name = detailRes.data.spuName
      form.categoryId = detailRes.data.categoryId
      form.brandId = detailRes.data.brandId
      brandName.value = detailRes.data.brandName
      form.description = detailRes.data.description || ''
      form.mainImage = detailRes.data.mainImage || ''
      form.images = detailRes.data.images || []
      form.status = 1
      skuList.value = detailRes.data.skuList || []
    }
  } catch { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

onMounted(loadDetail)

// ---- 保存 SPU ----
async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await updateSpu(Number(route.params.id), {
      name: form.name,
      categoryId: form.categoryId,
      brandId: form.brandId,
      description: form.description,
      mainImage: form.mainImage,
      images: form.images,
      status: form.status
    })
    ElMessage.success('保存成功')
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; h3 { color: $text-primary; } }

.upload-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.upload-trigger {
  width: 120px; height: 120px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  transition: border-color 0.3s;
  &:hover { border-color: var(--el-color-primary); }
  .preview-img { width: 100%; height: 100%; object-fit: cover; }
}

.upload-info {
  display: flex; align-items: center; gap: 8px;
  .url-text {
    font-size: 12px; color: var(--el-text-color-secondary);
    max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .tip-text { font-size: 12px; color: var(--el-text-color-secondary); }
}

.no-brand-option {
  display: flex; align-items: center; gap: 6px;
  padding: 10px; cursor: pointer; border-radius: 4px;
  color: var(--el-color-primary); font-size: 14px;
  transition: background 0.2s;
  &:hover { background: var(--el-color-primary-light-9); }
}

.gallery-preview {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
  .gallery-item {
    position: relative; width: 80px; height: 80px; border-radius: 4px; overflow: hidden;
    img { width: 100%; height: 100%; object-fit: cover; }
    :deep(.el-button) {
      position: absolute; top: -4px; right: -4px;
      width: 20px; height: 20px; padding: 0;
    }
  }
}
</style>
