import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'activities',
        name: 'ActivityList',
        component: () => import('@/views/Activity/List.vue'),
        meta: { title: '活动管理' }
      },
      {
        path: 'activities/create',
        name: 'ActivityCreate',
        component: () => import('@/views/Activity/Form.vue'),
        meta: { title: '创建活动' }
      },
      {
        path: 'activities/:id/edit',
        name: 'ActivityEdit',
        component: () => import('@/views/Activity/Form.vue'),
        meta: { title: '编辑活动' }
      },
      {
        path: 'products/spu',
        name: 'SpuList',
        component: () => import('@/views/Product/SpuList.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'products/spu/create',
        name: 'SpuCreate',
        component: () => import('@/views/Product/SpuForm.vue'),
        meta: { title: '创建SPU' }
      },
      {
        path: 'products/spu/:id',
        name: 'SpuDetail',
        component: () => import('@/views/Product/SpuDetail.vue'),
        meta: { title: 'SPU详情' }
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('@/views/Order/List.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'orders/seckill',
        name: 'SeckillOrderList',
        component: () => import('@/views/Order/SeckillList.vue'),
        meta: { title: '秒杀订单' }
      },
      {
        path: 'orders/:orderNo',
        name: 'OrderDetail',
        component: () => import('@/views/Order/Detail.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('@/views/User/List.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'refunds',
        name: 'RefundList',
        component: () => import('@/views/Refund/List.vue'),
        meta: { title: '退款管理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Error/404.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || ''} - 管理后台`
  const token = localStorage.getItem('access_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
