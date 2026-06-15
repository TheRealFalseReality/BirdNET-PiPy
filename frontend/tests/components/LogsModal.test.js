import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LogsModal from '@/components/LogsModal.vue'

const mockLogs = {
  entries: ref([
    {
      timestamp: '2026-06-10T10:00:00Z',
      level: 'INFO',
      service: 'api',
      message: 'First log line',
      extra: {}
    }
  ]),
  total: ref(1),
  isLoading: ref(false),
  error: ref(''),
  serviceFilter: ref(''),
  searchQuery: ref(''),
  isPolling: ref(false),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
  applyFilters: vi.fn(),
  clearFilters: vi.fn()
}

vi.mock('@/composables/useLogs', () => ({
  useLogs: () => mockLogs
}))

const mountModal = () => mount(LogsModal)

describe('LogsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toggles line wrapping classes when wrap button is clicked', async () => {
    const wrapper = mountModal()
    const line = wrapper.find('.bg-gray-900 .p-4 > div')

    expect(line.classes()).toContain('whitespace-pre')
    expect(line.classes()).not.toContain('whitespace-pre-wrap')

    const wrapButton = wrapper.findAll('button').find(btn => btn.text().includes('Wrap'))
    await wrapButton.trigger('click')
    await nextTick()

    expect(line.classes()).toContain('whitespace-pre-wrap')
    expect(line.classes()).not.toContain('whitespace-pre')
  })

  it('toggles fullscreen container classes when fullscreen button is clicked', async () => {
    const wrapper = mountModal()
    const modal = wrapper.find('div.relative.bg-white.shadow-xl.flex.flex-col')
    const fullscreenButton = wrapper.find('button[aria-label="Enter fullscreen"]')

    expect(modal.classes()).not.toContain('fixed')
    expect(modal.classes()).not.toContain('inset-0')

    await fullscreenButton.trigger('click')
    await nextTick()

    expect(modal.classes()).toContain('fixed')
    expect(modal.classes()).toContain('inset-0')
    expect(modal.classes()).toContain('rounded-none')
    expect(wrapper.find('button[aria-label="Exit fullscreen"]').exists()).toBe(true)
  })

  it('exposes accessible names for fullscreen and close icon buttons', () => {
    const wrapper = mountModal()

    expect(wrapper.find('button[aria-label="Enter fullscreen"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Close logs modal"]').exists()).toBe(true)
  })
})
