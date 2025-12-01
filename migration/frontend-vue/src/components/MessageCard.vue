<template>
  <div :class="level > 0 ? 'ml-4 pl-4 border-l-2 mt-4' : ''">
    <div class="p-4 border rounded-lg bg-white shadow-sm">
      <div class="flex items-center gap-3 mb-2">
        <div class="font-semibold">{{ message.phoneMasked }}</div>
        <div class="text-xs text-gray-500">{{ formattedDate }}</div>
      </div>
      <p>{{ message.text }}</p>
      <div class="mt-2 flex items-center gap-4">
        <button class="flex items-center gap-1 text-sm text-gray-600">
          <Heart class="w-4 h-4" /> {{ message.likes }}
        </button>
        <button v-if="level < 3" @click="isReplying = !isReplying" class="text-sm text-gray-600">回复</button>
      </div>
      <div v-if="isReplying" class="mt-2">
        <textarea v-model="replyText" rows="2" class="w-full p-2 border rounded"></textarea>
        <button class="mt-1 px-3 py-1 bg-blue-500 text-white text-sm rounded">发送</button>
      </div>
    </div>
    <div v-if="message.replies && message.replies.length > 0" class="mt-2">
      <MessageCard
        v-for="reply in message.replies"
        :key="reply.id"
        :message="reply"
        :level="level + 1"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Heart } from 'lucide-vue-next'
const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    required: true
  }
})
const isReplying = ref(false)
const replyText = ref('')
const formattedDate = computed(() => {
  return formatDistanceToNow(new Date(props.message.ts), { addSuffix: true, locale: zhCN })
})
// Define emits for reply and like actions
const emit = defineEmits(['reply', 'like'])
</script>