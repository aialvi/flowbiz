import { isValidTime, timezoneOptions } from './time'

export const EDITABLE_TYPES = ['trigger', 'sendMessage', 'addComment', 'businessHours']
export const CREATABLE_TYPES = ['sendMessage', 'addComment', 'businessHours']
export const DESCRIPTION_LIMIT = 200
export const MESSAGE_TEXT_LIMIT = 2000
export const COMMENT_LIMIT = 2000
export const MAX_ATTACHMENTS = 10
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export function isEditableType(type) { return EDITABLE_TYPES.includes(type) }
export function isCreatableType(type) { return CREATABLE_TYPES.includes(type) }
export function validateNode({ title = '', description = '', type } = {}) {
  const errors = {}
  if (title.trim().length < 3) errors.title = 'Use at least 3 characters for the title.'
  if (!description.trim()) errors.description = 'Add a description.'
  else if (description.length > DESCRIPTION_LIMIT) errors.description = `Keep the description within ${DESCRIPTION_LIMIT} characters.`
  if (!isEditableType(type)) errors.type = 'Choose a node type.'
  return errors
}

export function validateMessageContent({ messages = [], attachments = [] } = {}) {
  const errors = {}
  if (messages.some(item => !item.text?.trim())) errors.messages = 'Remove empty message fields or enter some text.'
  else if (messages.some(item => item.text.length > MESSAGE_TEXT_LIMIT)) errors.messages = `Keep each message within ${MESSAGE_TEXT_LIMIT} characters.`
  if (attachments.length > MAX_ATTACHMENTS) errors.attachments = `Attach no more than ${MAX_ATTACHMENTS} files.`
  return errors
}

export function validateComment(comment = '') {
  return comment.length > COMMENT_LIMIT ? `Keep the comment within ${COMMENT_LIMIT} characters.` : ''
}

export function validateAttachmentUpload(files = [], existingCount = 0) {
  if (existingCount + files.length > MAX_ATTACHMENTS) return `Attach no more than ${MAX_ATTACHMENTS} files.`
  if (files.some(file => file.size > MAX_ATTACHMENT_BYTES)) return 'Each attachment must be 10 MB or smaller.'
  return ''
}

export function validateBusinessHours({ timezone, schedule = [] } = {}) {
  const errors = {}
  if (!timezoneOptions().some(option => option.value === timezone)) errors.timezone = 'Choose a supported timezone.'
  const invalidRange = schedule.find(day => day.enabled && (!isValidTime(day.startTime) || !isValidTime(day.endTime) || day.startTime === day.endTime))
  if (invalidRange) errors.schedule = `${invalidRange.label || invalidRange.day} needs two different valid times.`
  return errors
}

export function validateNodeData(data = {}) {
  const errors = validateNode(data)
  if (data.type === 'sendMessage') Object.assign(errors, validateMessageContent(data))
  if (data.type === 'addComment') {
    const comment = validateComment(data.comment)
    if (comment) errors.comment = comment
  }
  if (data.type === 'businessHours') {
    const schedule = data.schedule || (data.times || []).map(day => ({ ...day, label: day.day, enabled: true }))
    Object.assign(errors, validateBusinessHours({ timezone: data.timezone, schedule }))
  }
  return errors
}
