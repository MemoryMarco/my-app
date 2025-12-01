import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(JSON.parse(localStorage.getItem('liuyan_user_vue') || 'null'))
  const token = ref(localStorage.getItem('liuyan_token_vue') || '')
  const isLoggedIn = computed(() => !!token.value)
  async function requestOtp(phone: string) {
    const { data } = await axios.post('/api/auth/request-otp', { phone })
    if (data.success) {
      alert(`[DEMO] OTP Code: ${data.data.demoCode}`)
    }
  }
  async function verifyOtp(phone: string, code: string) {
    const { data } = await axios.post('/api/auth/verify-otp', { phone, code })
    if (data.success) {
      token.value = data.data.token
      user.value = data.data.user
      localStorage.setItem('liuyan_token_vue', token.value)
      localStorage.setItem('liuyan_user_vue', JSON.stringify(user.value))
    }
  }
  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('liuyan_token_vue')
    localStorage.removeItem('liuyan_user_vue')
  }
  return { user, token, isLoggedIn, requestOtp, verifyOtp, logout }
})