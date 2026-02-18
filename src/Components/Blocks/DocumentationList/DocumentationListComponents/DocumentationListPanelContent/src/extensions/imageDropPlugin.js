import { Plugin } from 'prosemirror-state'
import { saveFile } from '../storage/fileStore'
import { getDocumentationUploadImage } from '../DocumentationUploadStore'

export const imageDropPlugin = new Plugin({
  props: {
    handleDrop(view, event) {
      const file = event.dataTransfer?.files?.[0]
      if (!file || !file.type.startsWith('image/')) return false

      event.preventDefault()

      ;(async () => {
        try {
          const docUploadImage = getDocumentationUploadImage()
          let attrs = { width: 400 }
          if (docUploadImage) {
            const path = await docUploadImage(file)
            if (path) attrs = { ...attrs, src: path, fileId: null }
          }
          if (!attrs.src) {
            const saved = await saveFile(file)
            attrs = { ...attrs, fileId: saved.id, src: null }
          }
          const { state, dispatch } = view
          const pos = state.selection.from
          const imageNode = state.schema.nodes.imageBlock.create(attrs)
          dispatch(state.tr.insert(pos, imageNode))
        } catch {
          // ignore
        }
      })()
      return true
    },
  },
})
