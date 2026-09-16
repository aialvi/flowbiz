import {
  COMMENT_LIMIT,
  MAX_ATTACHMENT_BYTES,
  MESSAGE_TEXT_LIMIT,
  isEditableType,
  validateAttachmentUpload,
  validateBusinessHours,
  validateComment,
  validateMessageContent,
  validateNode,
  validateNodeData,
} from '@/utils/validation'
it('validates trimmed title length, required description, its cap and the allowed types', () => {
  expect(validateNode({ title: ' a ', description: '', type: 'trigger' })).toEqual({ title: expect.any(String), description: expect.any(String) })
  expect(validateNode({ title: 'Okay', description: 'x'.repeat(201), type: 'sendMessage' }).description).toBeTruthy()
  expect(validateNode({ title: 'Okay', description: 'x'.repeat(200), type: 'businessHours' })).toEqual({})
  expect(isEditableType('success')).toBe(false)
  expect(isEditableType('failure')).toBe(false)
  expect(isEditableType('trigger')).toBe(true)
  expect(isEditableType('addComment')).toBe(true)
})

it('validates message text content and attachment limits', () => {
  expect(validateMessageContent()).toEqual({})
  expect(validateMessageContent({ messages: [{ text: '' }], attachments: [{}] })).toEqual({ messages: expect.any(String) })
  expect(validateMessageContent({ messages: [{ text: 'x'.repeat(MESSAGE_TEXT_LIMIT + 1) }] })).toEqual({ messages: expect.any(String) })
  expect(validateMessageContent({ messages: [{ text: 'Hello' }] })).toEqual({})
  expect(validateAttachmentUpload([{ size: MAX_ATTACHMENT_BYTES + 1 }])).toContain('10 MB')
  expect(validateAttachmentUpload([{ size: 1 }], 10)).toContain('no more than')
})

it('validates optional comments, supported timezones, and business-hour ranges', () => {
  expect(validateComment('')).toBe('')
  expect(validateComment('x'.repeat(COMMENT_LIMIT + 1))).toContain('within')
  expect(validateBusinessHours({ timezone: 'UTC', schedule: [{ label: 'Monday', enabled: true, startTime: '09:00', endTime: '17:00' }] })).toEqual({})
  expect(validateBusinessHours({ timezone: 'Unknown', schedule: [{ label: 'Monday', enabled: true, startTime: '09:00', endTime: '09:00' }] })).toEqual({
    timezone: expect.any(String), schedule: expect.stringContaining('Monday'),
  })
  expect(validateNodeData({ type: 'addComment', title: 'Note', description: 'Description', comment: 'x'.repeat(COMMENT_LIMIT + 1) })).toHaveProperty('comment')
})
