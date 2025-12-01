<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
    <div class="md:col-span-2 space-y-4">
      <div v-if="messagesStore.isLoading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="p-4 border rounded-lg animate-pulse bg-gray-200 h-24"></div>
      </div>
      <div v-else-if="messagesStore.messages.length > 0">
        <MessageCard
          v-for="message in messagesStore.messages"
          :key="message.id"
          :message="message"
          :level="0"
        />
      </div>
      <div v-else class="text-center py-16 border rounded-2xl bg-card/50">
        <h3 class="text-xl font-semibold text-foreground">这里空空如也</h3>
        <p class="mt-2 text-muted-foreground">还没有留言，快���发布第一条吧！</p>
      </div>
    </div>
    <div class="md:col-span-1 sticky top-24">
      <div class="p-6 rounded-2xl bg-gray-50 shadow-sm space-y-4">
        <h2 class="text-xl font-semibold">记录此刻</h2>
        <div v-if="authStore.isLoggedIn">
          <textarea v-model="newMessage" placeholder="说点什么..." rows="5" class="w-full p-2 border rounded"></textarea>
          <button @click="postMessage" class="w-full mt-2 p-2 bg-blue-500 text-white rounded">发布</button>
        </div>
        <div v-else class="text-center py-8 space-y-4">
          <p>登录后即可发布留言</p>
          <button @click="showAuth = true" class="p-2 bg-blue-500 text-white rounded">手机号登录</button>
        </div>
      </div>
    </div>
  </div>
  <!-- Auth Modal -->
  <div v-if="showAuth" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white p-8 rounded-lg w-96">
      <h2 class="text-2xl font-bold mb-4">登录 / 注册</h2>
      <div v-if="authStep === 'phone'">
        <input v-model="phone" type="tel" placeholder="请输入手机号" class="w-full p-2 border rounded mb-4" />
        <button @click="requestOtp" class="w-full p-2 bg-blue-500 text-white rounded">获取验证码</button>
      </div>
      <div v-if="authStep === 'otp'">
        <p class="mb-2 text-center">验证码已发送至 {{ phone }}</p>
        <input v-model="otp" type="text" placeholder="请输入6位验证码" class="w-full p-2 border rounded mb-4" />
        <button @click="verifyOtp" class="w-full p-2 bg-blue-500 text-white rounded">验证并登录</button>
      </div>
       <button @click="showAuth = false" class="w-full mt-4 text-sm text-gray-500">关闭</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessagesStore } from '@/stores/messages'
import { useAuthStore } from '@/stores/auth'
import MessageCard from '@/components/MessageCard.vue'
const messagesStore = useMessagesStore()
const authStore = useAuthStore()
const newMessage = ref('')
const showAuth = ref(false)
const authStep = ref('phone')
const phone = ref('')
const otp = ref('')
onMounted(() => {
  messagesStore.fetchMessages()
})
const postMessage = async () => {
  if (!newMessage.value.trim()) return
  await messagesStore.postMessage(newMessage.value)
  newMessage.value = ''
}
const requestOtp = async () => {
  await authStore.requestOtp(phone.value)
  authStep.value = 'otp'
}
const verifyOtp = async () => {
  await authStore.verifyOtp(phone.value, otp.value)
  showAuth.value = false
  authStep.value = 'phone'
  phone.value = ''
  otp.value = ''
}
</script>