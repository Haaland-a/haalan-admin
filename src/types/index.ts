export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PageResult<T> {
  total: number
  pageNum: number
  pageSize: number
  list: T[]
}

// Statistics
export interface OverviewStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  pendingRefunds: number
  todayOrders: number
  todayRevenue: number
}

export interface ActivityStats {
  activityId: number
  activityName: string
  status: number
  statusName: string
  startTime: string
  endTime: string
  orderCount: number
  totalAmount: number
  soldStock: number
  totalStock: number
  sellOutRate: number
  avgPrice: number
}

export interface DailyTrend {
  date: string
  orderCount: number
  amount: number
}

// Orders
export interface AdminOrderItem {
  id: number
  orderNo: string
  userId: number
  totalAmount: number
  actualAmount: number
  orderType: number
  orderTypeName: string
  status: number
  statusName: string
  createTime: string
}

export interface OrderDetail {
  order: any
  items: any[]
}

// Activities
export interface SeckillActivity {
  activityId: number
  activityName: string
  startTime: string
  endTime: string
  status: number
  statusName: string
  activityDesc: string
  limitPerUser: number
  totalStock: number
  version?: number
  createTime?: string
}

// Users
export interface AdminUser {
  userId: number
  username: string
  phone: string
  email: string
  status: number
  statusName: string
  memberLevel: number
  memberLevelName: string
  createTime: string
}

export interface LoginLog {
  id: number
  userId: number
  username: string
  loginIp: string
  loginTime: string
  loginResult: number
  loginResultName: string
  failReason: string
  browser: string
  os: string
}

// Refunds
export interface RefundItem {
  refundNo: string
  orderNo: string
  userId: number
  refundAmount: number
  refundReason: string
  status: number
  statusName: string
  rejectReason: string
  applyTime: string
  handleTime: string
  completeTime: string
}

// OSS
export interface OssUploadCredential {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  endpoint: string
  bucketName: string
  filePrefix: string
  expiration: number
  regionId: string
}

// Login
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  userId: number
  username: string
  token: string
}

// Seckill Activity Products
export interface SeckillActivityProduct {
  seckillProductId: number
  activityId: number
  skuId: number
  productName: string
  productImages: string[]
  specifications: Record<string, string>
  originalPrice: number
  seckillPrice: number
  stock: number
  limitPerUser: number
}

export interface SeckillActivityDetail {
  activityId: number
  activityName: string
  startTime: string
  endTime: string
  serverTime?: string
  products: SeckillProductDetailItem[]
}

/** 用户端接口返回的原始秒杀商品字段 */
export interface SeckillProductDetailItem {
  productId: number
  skuId: number
  skuCode: string
  name: string
  images: string[]
  specifications: Record<string, string>
  originalPrice: number
  seckillPrice: number
  stock: string
  limitPerUser: string
}

/** SeckillProductDetailItem → SeckillActivityProduct 映射 */
export function mapSeckillProduct(item: SeckillProductDetailItem): SeckillActivityProduct {
  return {
    seckillProductId: item.productId,
    activityId: 0,
    skuId: item.skuId,
    productName: item.name,
    productImages: item.images || [],
    specifications: item.specifications || {},
    originalPrice: item.originalPrice,
    seckillPrice: item.seckillPrice,
    stock: Number(item.stock) || 0,
    limitPerUser: Number(item.limitPerUser) || 1
  }
}

export interface SeckillAddProductRequest {
  skuId: number
  seckillPrice: number
  stock: number
  limitPerUser: number
  sort: number
}

export interface ProductDetailSku {
  skuId: number
  skuCode: string
  skuName: string
  price: number
  originalPrice: number
  stock: number
  soldCount: number
  status: number
  specifications: Record<string, any>
  images: string[]
}

export interface ProductDetailVO {
  spuId: number
  spuCode: string
  spuName: string
  description: string
  mainImage: string
  images: string[]
  categoryId: number
  categoryName: string
  brandId: number
  brandName: string
  skuList: ProductDetailSku[]
}

export interface SpuUpdateRequest {
  name: string
  categoryId: number
  brandId: number
  description: string
  mainImage: string
  images: string[]
  status: number
}

// SKU
export interface SkuCreateRequest {
  spuId: number
  skuCode: string
  name: string
  price: number
  stock: number
  specifications: Record<string, string>
  images?: string[]
}

// Category
export interface CategoryNode {
  categoryId: number
  name: string
  level: number
  children: CategoryNode[] | null
}

// Brand
export interface BrandItem {
  id: number
  name: string
  status: number
}
