import { Plugin } from 'prosemirror-state'
import { getDocumentationUploadImage, notifyDocumentationUploadFailure } from '../DocumentationUploadStore'

export const imageDropPlugin = new Plugin({
  props: {
    handleDrop(view, event) {
      const file = event.dataTransfer?.files?.[0]
      if (!file || !file.type.startsWith('image/')) return false

      event.preventDefault()

      ;(async () => {
        try {
          const docUploadImage = getDocumentationUploadImage()
          if (!docUploadImage) {
            throw new Error('Documentation upload service is unavailable')
          }
          const path = await docUploadImage(file)
          const attrs = { width: 400, src: path, fileId: null }
          const { state, dispatch } = view
          const pos = state.selection.from
          const imageNode = state.schema.nodes.imageBlock.create(attrs)
          dispatch(state.tr.insert(pos, imageNode))
        } catch (error) {
          notifyDocumentationUploadFailure(error, 'изображение')
        }
      })()
      return true
    },
  },
})
