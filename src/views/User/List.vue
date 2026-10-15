<template>
  <div class="page-container">
    <div class="page-header">
      <h3>用户管理</h3>
      <el-button type="primary" @click="registerDialogVisible = true">创建用户</el-button>
    </div>
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="query.username" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="query.phone" placeholder="手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>z
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="userId" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="statusName" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="memberLevelName" label="等级" width="80" />
        <el-table-column prop="createTime" label="注册时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :type="row.status === 1 ? 'danger' : 'success'"
              @click="handleToggleStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
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
          @size-change="onSizeChange"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 创建用户弹窗 -->
    <el-dialog v-model="registerDialogVisible" title="创建用户" width="500px" :close-on-click-modal="false" @close="onRegisterClose">
      <el-form ref="formRef" :model="registerForm" :rules="registerRules" label-width="100px" @keyup.enter="handleRegister">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="3-20位字母数字组合" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="8-20位" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="registerForm.phone" placeholder="11位手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="邮箱（选填）" />
        </el-form-item>
        <el-form-item label="注册码" prop="admin">
          <el-input v-model="registerForm.admin" placeholder="管理员注册码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="registering" @click="handleRegister">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getUserList, updateUserStatus, adminRegister } from '@/api/admin'
import { encryptPassword } from '@/utils/common'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const query = reactive({ username: '', phone: '', status: null as number | null, pageNum: 1, pageSize: 20 })

// 注册弹窗
const registerDialogVisible = ref(false)
const registering = ref(false)
const formRef = ref<FormInstance>()
const registerForm = reactive({ username: '', password: '', confirmPassword: '', phone: '', email: '', admin: '' })
const validateConfirm = (_rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) callback(new Error('两次输入的密码不一致'))
  else callback()
}
const registerRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 3, max: 20, message: '3-20位字符', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 8, max: 20, message: '8-20位字符', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认密码', trigger: 'blur' }, { validator: validateConfirm, trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }, { pattern: /^\d{11}$/, message: '11位手机号', trigger: 'blur' }],
  admin: [{ required: true, message: '请输入管理员注册码', trigger: 'blur' }],
}
async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  registering.value = true
  try {
    // 密码加密（与登录保持一致），不修改 registerForm 本身，避免重试时二次加密
    const res = await adminRegister({
      username: registerForm.username,
      password: encryptPassword(registerForm.password),
      confirmPassword: encryptPassword(registerForm.confirmPassword),
      phone: registerForm.phone,
      email: registerForm.email,
      admin: registerForm.admin,
    })
    if (res.code === 200) {
      ElMessage.success('创建成功')
      registerDialogVisible.value = false
      formRef.value?.resetFields()
      loadData()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch { ElMessage.error('创建失败') }
  finally { registering.value = false }
}
function onRegisterClose() {
  formRef.value?.resetFields()
}

async function loadData() {
  loading.value = true
  try {
    const res = await getUserList(query)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.list || []
      total.value = Number(res.data.total) || 0
    }
  } finally { loading.value = false }
}

function onSizeChange(size: number) {
  query.pageSize = size
  query.pageNum = 1
  loadData()
}

async function handleToggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 0 ? '禁用' : '启用'
  ElMessageBox.confirm(`确定要${action}用户「${row.username}」吗？`, '提示', { type: 'warning' }).then(async () => {
    try {
      await updateUserStatus(row.userId, { status: newStatus })
      ElMessage.success(`${action}成功`)
      loadData()
    } catch { ElMessage.error('操作失败') }
  }).catch(() => {})
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-header { h3 { color: $text-primary; } }
.search-form { margin-bottom: 16px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
