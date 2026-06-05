import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminLogin } from '@/api/admin'
import { encryptPassword } from '@/utils/common'
import type { LoginResponse } from '@/types'

export const useAdminStore = defineStore('admin', () => {
  const token = ref<string>(localStorage.getItem('access_token') || '')
  const username = ref<string>(localStorage.getItem('admin_username') || '')

  const isLoggedIn = computed(() => !!token.value)

  async function login(u: string, p: string) {
    const res = await adminLogin({ username: u, password: encryptPassword(p) })
    if (res.code === 200 && res.data) {
      const data = res.data as LoginResponse
      token.value = data.token
      username.value = data.username
      localStorage.setItem('access_token', data.token)
      localStorage.setItem('admin_username', data.username)
    }
    return res
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('access_token')
    localStorage.removeItem('admin_username')
  }

  return { token, username, isLoggedIn, login, logout }
})
