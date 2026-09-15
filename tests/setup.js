import { vi, afterEach } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
enableAutoUnmount(afterEach)
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
Element.prototype.scrollIntoView = vi.fn()
afterEach(() => { vi.restoreAllMocks() })
