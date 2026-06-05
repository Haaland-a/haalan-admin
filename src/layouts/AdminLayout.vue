<template>
  <el-container class="admin-container">
    <el-aside :width="isCollapse ? '64px' : '240px'" class="admin-sidebar">
      <div class="sidebar-header" @click="isCollapse = !isCollapse">
        <span v-if="!isCollapse" class="logo-text">管理后台</span>
        <span v-else class="logo-icon">H</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#1E293B"
        text-color="#94A3B8"
        active-text-color="#FFFFFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/activities">
          <el-icon><Timer /></el-icon>
          <span>活动管理</span>
        </el-menu-item>
        <el-menu-item index="/products/spu">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-sub-menu index="orders-group">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/orders">普通订单</el-menu-item>
          <el-menu-item index="/orders/seckill">秒杀订单</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/refunds">
          <el-icon><Money /></el-icon>
          <span>退款管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" /><Expand v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <span class="admin-name">{{ store.username }}</span>
          <el-button type="danger" text @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { ElMessageBox } from 'element-plus'
import { DataAnalysis, Timer, Goods, Document, User, Money, Fold, Expand } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const store = useAdminStore()
const isCollapse = ref(false)

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/orders/seckill')) return '/orders/seckill'
  if (path.startsWith('/orders')) return '/orders'
  if (path.startsWith('/activities')) return '/activities'
  if (path.startsWith('/products')) return '/products/spu'
  return path
})

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' }).then(() => {
    store.logout()
    router.push('/login')
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.admin-container {
  height: 100%;
}
.admin-sidebar {
  background-color: #1E293B;
  transition: width 0.3s;
  overflow: hidden;
  .sidebar-header {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    .logo-text { color: #fff; font-size: 18px; font-weight: bold; }
    .logo-icon { color: $primary-color; font-size: 24px; font-weight: bold; }
  }
  .el-menu {
    border-right: none;
  }
}
.admin-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  .collapse-btn { font-size: 20px; cursor: pointer; color: $text-regular; }
  .header-right { display: flex; align-items: center; gap: 12px; }
  .admin-name { color: $text-regular; }
}
.admin-main {
  background: $bg-secondary;
  padding: 20px;
  min-height: calc(100vh - 60px);
}
</style>
