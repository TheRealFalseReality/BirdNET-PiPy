<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      @click="$emit('close')"
    />

    <!-- Modal -->
    <div
      :class="[
        'flex min-h-full items-center justify-center',
        isFullscreen ? 'p-0' : 'p-4'
      ]"
    >
      <div
        :class="[
          'relative bg-white shadow-xl flex flex-col',
          isFullscreen
            ? 'fixed inset-0 rounded-none z-10'
            : 'rounded-xl w-full max-w-5xl'
        ]"
        :style="isFullscreen ? '' : 'max-height: 90vh;'"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            System Logs
          </h2>
          <div class="flex items-center gap-2">
            <!-- Fullscreen toggle -->
            <button
              :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
              class="text-gray-400 hover:text-gray-600"
              @click="isFullscreen = !isFullscreen"
            >
              <!-- Expand icon -->
              <svg
                v-if="!isFullscreen"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                />
              </svg>
              <!-- Shrink icon -->
              <svg
                v-else
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 9V4m0 5H4m5 0L3 3m12 6h5m-5 0V4m0 5l6-6M9 15v5m0-5H4m5 5l-6 6m12-6h5m-5 0v5m0-5l6 6"
                />
              </svg>
            </button>
            <!-- Close -->
            <button
              class="text-gray-400 hover:text-gray-600"
              @click="$emit('close')"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-end">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Service</label>
            <select
              v-model="serviceFilter"
              class="border border-gray-300 rounded px-2 py-1.5 text-sm h-[34px]"
              @change="applyFilters"
            >
              <option value="">
                All
              </option>
              <option value="main">
                main
              </option>
              <option value="api">
                api
              </option>
              <option value="birdnet">
                model
              </option>
              <option value="icecast">
                icecast
              </option>
            </select>
          </div>

          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Filter by message..."
              class="border border-gray-300 rounded px-2 py-1.5 text-sm w-full h-[34px]"
              @input="onSearchInput"
            >
          </div>

          <button
            class="text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5"
            @click="clearFilters"
          >
            Clear
          </button>

          <button
            :class="[
              'text-sm px-3 py-1.5 rounded',
              wrapLines
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
            title="Toggle line wrapping"
            @click="wrapLines = !wrapLines"
          >
            {{ wrapLines ? 'Wrap ON' : 'Wrap OFF' }}
          </button>

          <button
            :class="[
              'text-sm px-3 py-1.5 rounded',
              isPolling
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
            @click="togglePolling"
          >
            {{ isPolling ? 'Auto-refresh ON' : 'Auto-refresh OFF' }}
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-hidden flex flex-col min-h-0 p-4">
          <!-- Error -->
          <div
            v-if="error"
            class="bg-red-50 text-red-700 rounded-lg p-3 mb-3 text-sm"
          >
            {{ error }}
          </div>

          <!-- Loading -->
          <CenteredMessage
            v-if="isLoading && displayEntries.length === 0"
            variant="loading"
            container-class="py-16"
          >
            Loading logs...
          </CenteredMessage>

          <!-- Empty -->
          <CenteredMessage
            v-else-if="displayEntries.length === 0 && !isLoading"
            variant="info"
            container-class="py-16"
          >
            No log entries found.
          </CenteredMessage>

          <!-- Log entries (oldest first, newest at bottom) -->
          <div
            v-else
            ref="logContainer"
            class="bg-gray-900 rounded-lg overflow-auto font-mono text-xs leading-5 flex-1 min-h-0"
            @scroll="onScroll"
          >
            <div class="p-4">
              <div
                v-for="(entry, i) in displayEntries"
                :key="i"
                :class="wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'"
              >
                <span class="text-gray-500">{{ formatTimestamp(entry.timestamp) }}</span>
                <span :class="levelClass(entry.level)">{{ padLevel(entry.level) }}</span>
                <span class="text-blue-400">[{{ entry.service }}]</span>
                <span class="text-gray-200"> {{ entry.message }}</span>
                <span
                  v-if="hasExtras(entry.extra)"
                  class="text-gray-500"
                > | {{ formatExtras(entry.extra) }}</span>
              </div>
            </div>
          </div>

          <!-- Jump to latest -->
          <div
            v-if="!isAtBottom && displayEntries.length > 0"
            class="flex justify-center mt-2"
          >
            <button
              class="text-xs text-gray-500 hover:text-gray-700 bg-white rounded-full px-3 py-1 shadow"
              @click="scrollToBottom"
            >
              Jump to latest
            </button>
          </div>

          <!-- Entry count -->
          <p
            v-if="displayEntries.length > 0"
            class="text-xs text-gray-400 mt-2"
          >
            Showing {{ displayEntries.length }} of {{ total }} entries
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useLogs } from '@/composables/useLogs'
import CenteredMessage from '@/components/CenteredMessage.vue'

export default {
  name: 'LogsModal',
  components: { CenteredMessage },
  emits: ['close'],
  setup() {
    const {
      entries, total, isLoading, error,
      serviceFilter, searchQuery, isPolling,
      startPolling, stopPolling, applyFilters, clearFilters
    } = useLogs()

    const logContainer = ref(null)
    const isAtBottom = ref(true)
    const isFullscreen = ref(false)
    const wrapLines = ref(false)
    let searchTimeout = null

    // Reverse: API returns newest-first, we want oldest-first (newest at bottom)
    const displayEntries = computed(() => [...entries.value].reverse())

    const levelClass = (level) => {
      const classes = {
        DEBUG: 'text-gray-400',
        INFO: 'text-green-400',
        WARNING: 'text-yellow-400',
        ERROR: 'text-red-400',
        CRITICAL: 'text-red-500 font-bold'
      }
      return classes[level] || 'text-gray-300'
    }

    const padLevel = (level) => {
      return ` ${(level || 'INFO').padEnd(8)} `
    }

    const hasExtras = (extra) => extra && Object.keys(extra).length > 0

    const formatExtras = (extra) => {
      if (!extra) return ''
      return Object.entries(extra)
        .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(' | ')
    }

    const formatTimestamp = (ts) => {
      if (!ts) return ''
      // Show time portion only for readability
      const idx = ts.indexOf('T')
      if (idx >= 0) {
        return ts.substring(idx + 1).replace('Z', '')
      }
      return ts
    }

    const onScroll = () => {
      const el = logContainer.value
      if (!el) return
      isAtBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
    }

    const scrollToBottom = () => {
      const el = logContainer.value
      if (el) {
        el.scrollTop = el.scrollHeight
        isAtBottom.value = true
      }
    }

    const togglePolling = () => {
      if (isPolling.value) {
        stopPolling()
      } else {
        startPolling()
      }
    }

    const onSearchInput = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        applyFilters()
      }, 400)
    }

    // Auto-scroll to bottom when new entries arrive (if already at bottom)
    watch(displayEntries, () => {
      if (isAtBottom.value) {
        nextTick(scrollToBottom)
      }
    })

    onMounted(() => {
      startPolling()
      nextTick(scrollToBottom)
    })

    onUnmounted(() => {
      clearTimeout(searchTimeout)
    })

    return {
      displayEntries, total, isLoading, error,
      serviceFilter, searchQuery, isPolling,
      applyFilters, clearFilters,
      logContainer, isAtBottom,
      isFullscreen, wrapLines,
      levelClass, padLevel, formatTimestamp, hasExtras, formatExtras,
      onScroll, scrollToBottom, togglePolling, onSearchInput
    }
  }
}
</script>
