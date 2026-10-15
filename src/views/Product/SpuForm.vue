<template>
  <div class="page-container">
    <div class="page-header">
      <h3>创建SPU</h3>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <!-- SPU 基本信息 -->
    <el-card>
      <template #header><span>SPU 基本信息</span></template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="default">
        <el-form-item label="SPU编码" prop="spuCode">
          <el-input v-model="form.spuCode" placeholder="SPU编码将作为图片存储目录名"/>
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称"/>
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-tree-select
              v-model="form.categoryId"
              :data="categoryTree"
              :props="{ label: 'name', value: 'categoryId', children: 'children' }"
              placeholder="请选择分类"
              check-strictly
              clearable
              filterable
              style="width:100%"
          />
        </el-form-item>
        <el-form-item label="品牌" prop="brandId">
          <div style="display:flex;gap:8px;width:100%;">
            <el-input :model-value="brandName" placeholder="请选择品牌" readonly/>
            <el-button @click="brandDialogVisible = true">选择品牌</el-button>
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3"/>
        </el-form-item>

        <!-- 主图 -->
        <el-form-item label="主图" prop="mainImage">
          <div class="upload-row">
            <el-upload
                ref="mainUploadRef"
                action="#"
                :show-file-list="false"
                :auto-upload="false"
                :disabled="!form.spuCode"
                :before-upload="beforeMainUpload"
                :on-change="handleMainUpload"
                accept="image/jpeg,image/png,image/gif,image/webp"
            >
              <div v-loading="mainUploading" class="upload-trigger">
                <img v-if="form.mainImage" :src="form.mainImage" class="preview-img"/>
                <el-icon v-else :size="28">
                  <Plus/>
                </el-icon>
              </div>
            </el-upload>
            <div class="upload-info">
              <template v-if="form.mainImage">
                <span class="url-text">{{ form.mainImage.slice(-40) }}</span>
                <el-button size="small" type="danger" plain @click="form.mainImage = ''">移除</el-button>
              </template>
              <span v-else class="tip-text">
                {{ form.spuCode ? '点击上传主图（自动存入 /' + form.spuCode + '/ 目录）' : '请先填写SPU编码' }}
              </span>
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
                :disabled="!form.spuCode"
                :file-list="galleryFileList"
                :before-upload="beforeGalleryUpload"
                :on-change="handleGalleryChange"
                :on-remove="handleGalleryRemove"
                accept="image/jpeg,image/png,image/gif,image/webp"
            >
              <el-icon>
                <Plus/>
              </el-icon>
            </el-upload>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <el-button
                  size="small"
                  type="primary"
                  :loading="galleryUploading"
                  :disabled="galleryFileList.length === 0"
                  @click="uploadGalleryImages"
              >上传图册图片
              </el-button>
              <span class="tip-text">可选，存入 /{{ form.spuCode || '...' }}/ 目录</span>
            </div>
            <!-- 已上传图册展示 -->
            <div v-if="form.images.length" class="gallery-preview">
              <div v-for="(url, i) in form.images" :key="i" class="gallery-item">
                <img :src="url"/>
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
          <el-button type="primary" :loading="saving" @click="handleSave">创建 SPU</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 品牌选择对话框 -->
    <el-dialog v-model="brandDialogVisible" title="选择品牌" width="500px" destroy-on-close>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <el-input v-model="brandKeyword" placeholder="搜索品牌名称" clearable @keyup.enter="searchBrands"/>
        <el-button type="primary" @click="searchBrands">搜索</el-button>
      </div>
      <div
          class="no-brand-option"
          @click="selectNoBrand"
      >
        <el-icon>
          <Plus/>
        </el-icon>
        没有我要添加的品牌（不选择品牌）
      </div>
      <el-table :data="brandList" stripe v-loading="brandLoading" highlight-current-row @row-click="selectBrand">
        <el-table-column prop="id" label="ID" width="60"/>
        <el-table-column prop="name" label="品牌名称"/>
      </el-table>
      <template #footer>
        <el-button @click="brandDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- SKU 管理（SPU创建后显示） -->
    <el-card v-if="createdSpuId" class="sku-card">
      <template #header>
        <span>SKU 管理 — {{ createdSpuCode }}</span>
        <el-button size="small" type="primary" @click="skuDialogVisible = true">添加 SKU</el-button>
      </template>
      <el-table :data="skuList" border stripe>
        <el-table-column prop="skuCode" label="SKU编码" width="140"/>
        <el-table-column prop="name" label="SKU名称" min-width="140"/>
        <el-table-column prop="price" label="价格" width="90"/>
        <el-table-column prop="stock" label="库存" width="70"/>
        <el-table-column label="规格" min-width="160">
          <template #default="{ row }">
            <span v-if="!row.specifications || Object.keys(row.specifications).length === 0">—</span>
            <span v-else>
              <el-tag v-for="(v, k) in row.specifications" :key="k" size="small" style="margin-right: 4px;">
                {{ k }}: {{ v }}
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image v-if="row.images?.[0]" :src="row.images[0]" style="width: 40px; height: 40px;" fit="cover"/>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" plain @click="skuList = skuList.filter(s => s !== row)">删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- SKU 添加对话框 -->
    <el-dialog v-model="skuDialogVisible" title="添加 SKU" width="560px" destroy-on-close>
      <el-form ref="skuFormRef" :model="skuForm" :rules="skuRules" label-width="100px">
        <el-form-item label="SKU编码" prop="skuCode">
          <el-input v-model="skuForm.skuCode" placeholder="SKU编码将作为图片子目录"/>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input-number v-model="skuForm.price" :min="0.01" :precision="2" style="width: 100%;"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="skuForm.stock" :min="0" style="width: 100%;"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规格">
          <div class="spec-list">
            <div v-for="(item, i) in skuForm.specs" :key="i" class="spec-row">
              <el-input v-model="item.key" placeholder="规格名" size="small" style="width: 120px;"/>
              <el-input v-model="item.value" placeholder="规格值" size="small" style="width: 120px;"/>
              <el-button size="small" type="danger" plain @click="skuForm.specs.splice(i, 1)">×</el-button>
            </div>
            <el-button size="small" @click="skuForm.specs.push({ key: '', value: '' })">+ 添加规格</el-button>
          </div>
        </el-form-item>
        <el-form-item label="SKU图片">
          <div class="upload-row">
            <el-upload
                ref="skuUploadRef"
                action="#"
                :show-file-list="false"
                :auto-upload="false"
                :disabled="!skuForm.skuCode"
                :before-upload="beforeSkuUpload"
                :on-change="handleSkuUpload"
                accept="image/jpeg,image/png,image/gif,image/webp"
            >
              <div v-loading="skuUploading" class="upload-trigger" style="width: 100px; height: 100px;">
                <img v-if="skuForm.mainImage" :src="skuForm.mainImage" class="preview-img"/>
                <el-icon v-else :size="24">
                  <Plus/>
                </el-icon>
              </div>
            </el-upload>
            <span class="tip-text" style="margin-left: 8px;">
              {{ skuForm.skuCode ? '存入 /' + createdSpuCode + '/' + skuForm.skuCode + '/ 目录' : '请先填写SKU编码' }}
            </span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skuDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="skuSaving" @click="saveSku">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {createSku, createSpu, getBrandList, getCategoryTree} from '@/api/admin'
import type {UploadInstance, UploadProps, UploadUserFile} from 'element-plus'
import {ElMessage} from 'element-plus'
import {Plus} from '@element-plus/icons-vue'
import {uploadToOSS, validateImageFile} from '@/utils/upload'
import type {BrandItem, CategoryNode, SkuCreateRequest} from '@/types'

const router = useRouter()
const formRef = ref()
const saving = ref(false)

// ---- SPU 表单 ----
const mainUploadRef = ref<UploadInstance>()
const mainUploading = ref(false)
const galleryUploadRef = ref<UploadInstance>()
const galleryUploading = ref(false)
const galleryFileList = ref<UploadUserFile[]>([])

const form = reactive({
  spuCode: '', name: '', categoryId: null as number | null, brandId: null as number | null,
  description: '', mainImage: '', images: [] as string[], status: 1
})
const rules: Record<string, any> = {
  spuCode: [{required: true, message: '请输入SPU编码', trigger: 'blur'}],
  name: [{required: true, message: '请输入商品名称', trigger: 'blur'}],
  categoryId: [{required: true, message: '请选择分类', trigger: 'change'}],
  mainImage: [{required: true, message: '请上传主图', trigger: 'change'}]
}

// ---- 分类树 ----
const categoryTree = ref<CategoryNode[]>([])
const loadingCategory = ref(false)

async function loadCategoryTree() {
  loadingCategory.value = true
  try {
    const res = await getCategoryTree(0, 3)
    categoryTree.value = res.data || []
  } catch { /* ignore */
  } finally {
    loadingCategory.value = false
  }
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
  } finally {
    brandLoading.value = false
  }
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

onMounted(() => {
  loadCategoryTree()
})

// ---- SPU 图片上传 ----
const beforeMainUpload: UploadProps['beforeUpload'] = (file) => {
  const v = validateImageFile(file, 5)
  if (!v.valid) {
    ElMessage.error(v.message);
    return false
  }
  return true
}
const handleMainUpload: UploadProps['onChange'] = async (uploadFile) => {
  if (!uploadFile.raw || !form.spuCode) return
  mainUploading.value = true
  try {
    const url = await uploadToOSS(uploadFile.raw, form.spuCode)
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
  if (!v.valid) {
    ElMessage.error(v.message);
    return false
  }
  return true
}
const handleGalleryChange: UploadProps['onChange'] = (_f, files) => {
  galleryFileList.value = files
}
const handleGalleryRemove: UploadProps['onRemove'] = (_f, files) => {
  galleryFileList.value = files
}

async function uploadGalleryImages() {
  if (galleryFileList.value.length === 0 || !form.spuCode) return
  galleryUploading.value = true
  try {
    for (const f of galleryFileList.value) {
      if (f.raw) form.images.push(await uploadToOSS(f.raw, form.spuCode))
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

// ---- SKU 管理 ----
const createdSpuId = ref<number | null>(null)
const createdSpuCode = ref('')
const skuList = ref<SkuCreateRequest[]>([])
const skuDialogVisible = ref(false)
const skuFormRef = ref()
const skuSaving = ref(false)
const skuUploadRef = ref<UploadInstance>()
const skuUploading = ref(false)

const skuForm = reactive({
  skuCode: '', price: 0.01, stock: 0,
  specs: [] as { key: string; value: string }[],
  mainImage: ''
})
const skuRules = {
  skuCode: [{required: true, message: '请输入SKU编码', trigger: 'blur'}],
  price: [{required: true, message: '请输入价格', trigger: 'blur'}],
  stock: [{required: true, message: '请输入库存', trigger: 'blur'}]
}

const beforeSkuUpload: UploadProps['beforeUpload'] = (file) => {
  const v = validateImageFile(file, 5)
  if (!v.valid) {
    ElMessage.error(v.message);
    return false
  }
  return true
}
const handleSkuUpload: UploadProps['onChange'] = async (uploadFile) => {
  if (!uploadFile.raw || !createdSpuCode.value || !skuForm.skuCode) return
  skuUploading.value = true
  try {
    const url = await uploadToOSS(uploadFile.raw, createdSpuCode.value, skuForm.skuCode)
    skuForm.mainImage = url
    ElMessage.success('SKU图片上传成功')
  } catch (e: any) {
    ElMessage.error(e.message || 'SKU图片上传失败')
  } finally {
    skuUploading.value = false
    skuUploadRef.value?.clearFiles()
  }
}

async function saveSku() {
  const valid = await skuFormRef.value?.validate().catch(() => false)
  if (!valid || !createdSpuId.value) return
  skuSaving.value = true
  try {
    const specs: Record<string, string> = {}
    skuForm.specs.forEach(s => {
      if (s.key) specs[s.key] = s.value
    })

    const payload: SkuCreateRequest = {
      spuId: createdSpuId.value,
      skuCode: skuForm.skuCode,
      name: `${form.name} - ${skuForm.skuCode}`,
      price: skuForm.price,
      stock: skuForm.stock,
      specifications: specs,
      images: skuForm.mainImage ? [skuForm.mainImage] : undefined
    }

    await createSku(payload)
    skuList.value.push({...payload})
    ElMessage.success('SKU创建成功')

    skuDialogVisible.value = false
    skuForm.skuCode = '';
    skuForm.price = 0.01;
    skuForm.stock = 0
    skuForm.specs = [];
    skuForm.mainImage = ''
  } catch {
    ElMessage.error('SKU创建失败')
  } finally {
    skuSaving.value = false
  }
}

// ---- 保存 SPU ----
async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const res = await createSpu({
      spuCode: form.spuCode, name: form.name,
      categoryId: form.categoryId, brandId: form.brandId,
      description: form.description, mainImage: form.mainImage,
      images: form.images.length ? form.images : undefined,
      status: form.status
    })
    createdSpuId.value = res.data.spuId
    createdSpuCode.value = form.spuCode
    ElMessage.success('SPU创建成功，现在可以添加SKU了')
  } catch {
    ElMessage.error('创建失败')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    color: $text-primary;
  }
}

.sku-card {
  :deep(.el-card__header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.upload-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.upload-trigger {
  width: 120px;
  height: 120px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-color 0.3s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.upload-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .url-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tip-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.gallery-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  .gallery-item {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 4px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .el-button {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 20px;
      height: 20px;
      padding: 0;
    }
  }
}

.no-brand-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px;
  cursor: pointer;
  border-radius: 4px;
  color: var(--el-color-primary);
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: var(--el-color-primary-light-9);
  }
}

.spec-list {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .spec-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
