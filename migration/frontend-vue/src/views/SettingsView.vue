<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">邮件设置</h1>
    <div class="max-w-lg space-y-6">
      <div class="space-y-2">
        <label class="text-sm font-medium">收件邮箱</label>
        <input type="email" v-model="settings.recipient" class="w-full p-2 border rounded" />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-medium">发送方式</label>
        <select v-model="settings.provider" class="w-full p-2 border rounded bg-white">
          <option value="mock">Mock (演示)</option>
          <option value="http">HTTP Provider</option>
        </select>
      </div>
      <div v-if="settings.provider === 'http'" class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">API URL</label>
          <input v-model="settings.apiUrl" class="w-full p-2 border rounded" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">API Key</label>
          <input type="password" v-model="settings.apiKey" class="w-full p-2 border rounded" />
        </div>
      </div>
      <div class="flex gap-4">
        <button @click="saveSettings" class="px-4 py-2 bg-blue-500 text-white rounded">保存设置</button>
        <button @click="sendNow" class="px-4 py-2 border rounded">立即发送测试</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
const settings = ref({
  recipient: '',
  provider: 'mock',
  apiUrl: '',
  apiKey: ''
})
onMounted(async () => {
  const { data } = await axios.get('/api/settings/email')
  if (data.success) {
    settings.value = data.data
  }
})
const saveSettings = async () => {
  await axios.post('/api/settings/email', settings.value)
  alert('Settings saved!')
}
const sendNow = async () => {
  await axios.post('/api/settings/send-weekly')
  alert('Test email sent (mocked)!')
}
</script>