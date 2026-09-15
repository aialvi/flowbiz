import { useMutation } from '@tanstack/vue-query'
import { useCanvasStore } from '@/stores/canvas'

export function useGraphMutation() {
  const store = useCanvasStore()
  return useMutation({
    mutationKey: ['graph-edit'],
    scope: { id: 'graph-edit' },
    mutationFn: async (command) => {
      switch (command.action) {
        case 'create': return store.addNode(command.fields, command.afterNodeId)
        case 'update': return store.updateNode(command.id, command.patch)
        case 'move': return store.moveNode(command.id, command.position)
        case 'delete': return store.deleteNode(command.id)
        case 'undo': return store.undo()
        case 'redo': return store.redo()
        default: throw new Error(`Unknown graph action: ${command.action}`)
      }
    },
  })
}
