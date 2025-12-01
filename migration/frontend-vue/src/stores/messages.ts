import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'
export const useMessagesStore = defineStore('messages', () => {
  const messages = ref<any[]>([])
  const isLoading = ref(false)
  async function fetchMessages() {
    isLoading.value = true
    try {
      const { data } = await axios.get('/api/messages')
      if (data.success) {
        messages.value = data.data.items
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      isLoading.value = false
    }
  }
  async function postMessage(text: string) {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) return
    try {
      const { data } = await axios.post('/api/messages', { text }, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      if (data.success) {
        messages.value.unshift(data.data)
      }
    } catch (error) {
      console.error('Failed to post message:', error)
    }
  }
  return { messages, isLoading, fetchMessages, postMessage }
})