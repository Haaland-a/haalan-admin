import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ApiResponse } from '@/types'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' }
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() }
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      if (res.code === 401) handleUnauthorized()
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res as any
  },
  (error) => {
    let message = '网络错误，请稍后重试'
    if (error.response) {
      switch (error.response.status) {
        case 400: message = '请求参数错误'; break
        case 401: message = '未授权，请重新登录'; handleUnauthorized(); break
        case 403: message = '拒绝访问'; break
        case 404: message = '请求的资源不存在'; break
        case 500: message = '服务器内部错误'; break
        default: message = `连接错误${error.response.status}`
      }
    } else if (error.message.includes('timeout')) {
      message = '请求超时'
    }
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

function handleUnauthorized() {
  ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_info')
    window.location.href = '/login'
  }).catch(() => {})
}

export class Request {
  static get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.get(url, { params, ...config })
  }
  static post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.post(url, data, config)
  }
  static put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.put(url, data, config)
  }
  static delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.delete(url, { params, ...config })
  }
}

export default service
