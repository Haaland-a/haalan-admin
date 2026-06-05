import { Request } from '@/utils/request'
import type {
  PageResult, OverviewStats, ActivityStats, DailyTrend,
  AdminOrderItem, OrderDetail, SeckillActivity, AdminUser, LoginLog,
  RefundItem, LoginRequest, LoginResponse, OssUploadCredential,
  SeckillActivityDetail, ProductDetailVO, CategoryNode, BrandItem
} from '@/types'

// Auth
export function adminLogin(data: LoginRequest) {
  return Request.post<LoginResponse>('/user/login', data)
}

// Statistics
export function getOverviewStats() {
  return Request.get<OverviewStats>('/admin/statistics/overview')
}
export function getActivityStats(activityId: number) {
  return Request.get<ActivityStats>(`/admin/statistics/seckill/${activityId}`)
}
export function getActivityStatsList(pageNum: number, pageSize: number) {
  return Request.get<PageResult<ActivityStats>>('/admin/statistics/seckill/list', { pageNum, pageSize })
}
export function getTrends(days: number = 7) {
  return Request.get<DailyTrend[]>('/admin/statistics/trends', { days })
}

// Orders
export function getOrderList(params: any) {
  return Request.get<PageResult<AdminOrderItem>>('/admin/orders', params)
}
export function getOrderDetail(orderNo: string) {
  return Request.get<OrderDetail>(`/admin/orders/${orderNo}`)
}
export function updateOrderStatus(orderNo: string, data: { status: number; remark?: string }) {
  return Request.put(`/admin/orders/${orderNo}/status`, data)
}
export function getSeckillOrderList(params: any) {
  return Request.get<PageResult<AdminOrderItem>>('/admin/orders/seckill', params)
}
export function getSeckillOrderDetail(orderNo: string) {
  return Request.get<any>(`/admin/orders/seckill/${orderNo}`)
}

// Activities
export function createActivity(data: any) {
  return Request.post('/admin/seckill/activity', data)
}
export function updateActivity(id: number, data: any) {
  return Request.put(`/admin/seckill/activity/${id}`, data)
}
export function getActivity(id: number) {
  return Request.get<SeckillActivity>(`/admin/seckill/activity/${id}`)
}
export function getActivityProducts(id: number) {
  return Request.get<SeckillActivityDetail>(`/seckill/activity/${id}/products`)
}
export function addActivityProduct(activityId: number, data: any) {
  return Request.post(`/admin/seckill/activity/${activityId}/product`, data)
}
export function batchAddActivityProducts(activityId: number, data: { products: any[] }) {
  return Request.post(`/admin/seckill/activity/${activityId}/products/batch`, data)
}
export function updateSeckillProductStock(productId: number, data: { stock: number }) {
  return Request.put(`/admin/seckill/product/${productId}/stock`, data)
}
export function deleteSeckillProduct(productId: number) {
  return Request.delete(`/admin/seckill/product/${productId}`)
}
export function updateSeckillProductInfo(productId: number, data: { seckillPrice: number; limitPerUser: number }) {
  return Request.put(`/admin/seckill/product/${productId}`, data)
}
export function preheatActivity(activityId: number, force: boolean = false) {
  return Request.post(`/admin/seckill/activity/${activityId}/preheat?force=${force}`)
}
// Product detail (for SKU selection)
export function getProductDetail(spuId: number) {
  return Request.get<ProductDetailVO>(`/product/detail/${spuId}`)
}

// OSS
export function getOssCredential(spuCode: string, skuCode?: string) {
  const params: Record<string, string> = { spuCode }
  if (skuCode) params.skuCode = skuCode
  return Request.get<OssUploadCredential>('/admin/oss/credential', params)
}

// Products (SPU/SKU)
export function createSpu(data: any) {
  return Request.post('/admin/spu', data)
}
export function getSpuList(params: any) {
  return Request.get('/admin/spu/list', params)
}
export function updateSpu(spuId: number, data: any) {
  return Request.put(`/admin/spu/${spuId}`, data)
}
export function createSku(data: any) {
  return Request.post('/admin/sku', data)
}
export function updateSkuStock(skuId: number, data: { stock: number; type: string }) {
  return Request.put(`/admin/sku/${skuId}/stock`, data)
}
export function updateSpuStatus(spuId: number, data: { status: number }) {
  return Request.put(`/admin/spu/${spuId}/status`, data)
}
export function getAdminSpuDetail(spuId: number) {
  return Request.get<ProductDetailVO>(`/admin/spu/${spuId}/detail`)
}
export function updateSkuStatus(skuId: number, data: { status: number }) {
  return Request.put(`/admin/sku/${skuId}/status`, data)
}
export function updateSkuInfo(skuId: number, data: {
  name: string
  price: number
  promotionPrice?: number
  specifications?: Record<string, string>
  images?: string[]
}) {
  return Request.put(`/admin/sku/${skuId}`, data)
}

// Users
export function adminRegister(data: { username: string; password: string; confirmPassword: string; phone: string; email?: string; admin: string }) {
  return Request.post('/admin/users/register', data)
}
export function getUserList(params: any) {
  return Request.get<PageResult<AdminUser>>('/admin/users', params)
}
export function getUserDetail(userId: number) {
  return Request.get<AdminUser>(`/admin/users/${userId}`)
}
export function updateUserStatus(userId: number, data: { status: number }) {
  return Request.put(`/admin/users/${userId}/status`, data)
}
export function getLoginLogs(params: any) {
  return Request.get<PageResult<LoginLog>>('/admin/users/login-logs', params)
}

// Category & Brand
export function getCategoryTree(id?: number, level?: number) {
  const params: any = {}
  if (id !== undefined) params.id = id
  if (level !== undefined) params.level = level
  return Request.get<CategoryNode[]>('/category/tree', params)
}
export function getBrandList(keyword?: string) {
  const params: any = {}
  if (keyword) params.keyword = keyword
  return Request.get<BrandItem[]>('/admin/brand/list', params)
}

// Refunds
export function getRefundList(params: any) {
  return Request.get<PageResult<RefundItem>>('/admin/payment/refund/list', params)
}
export function auditRefund(data: { refundNo: string; approved: boolean; rejectReason?: string }) {
  return Request.post('/admin/payment/refund', data)
}
