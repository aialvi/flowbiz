import { validateNode, isEditableType } from '@/utils/validation'
it('validates trimmed title length, required description, its cap and the allowed types', () => {
  expect(validateNode({ title: ' a ', description: '', type: 'trigger' })).toEqual({ title: expect.any(String), description: expect.any(String) })
  expect(validateNode({ title: 'Okay', description: 'x'.repeat(201), type: 'sendMessage' }).description).toBeTruthy()
  expect(validateNode({ title: 'Okay', description: 'x'.repeat(200), type: 'businessHours' })).toEqual({})
  expect(isEditableType('success')).toBe(false)
  expect(isEditableType('failure')).toBe(false)
  expect(isEditableType('trigger')).toBe(true)
  expect(isEditableType('addComment')).toBe(true)
})
