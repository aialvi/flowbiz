export const EDITABLE_TYPES = ['sendMessage', 'addComment', 'businessHours']
export const DESCRIPTION_LIMIT = 200
export function isEditableType(type) { return EDITABLE_TYPES.includes(type) }
export function validateNode({ title = '', description = '', type } = {}) {
  const errors = {}
  if (title.trim().length < 3) errors.title = 'Use at least 3 characters for the title.'
  if (!description.trim()) errors.description = 'Add a description.'
  else if (description.length > DESCRIPTION_LIMIT) errors.description = `Keep the description within ${DESCRIPTION_LIMIT} characters.`
  if (!isEditableType(type)) errors.type = 'Choose a node type.'
  return errors
}
