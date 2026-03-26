import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { blockRegistry } from './blockRegistry'
import { SlashSourceKey } from './slashSourceKey'

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    const editor = this.editor

    return [
      Suggestion({
        editor,
        char: '/',
        startOfLine: false,

        items: ({ query }) => {
          if (!query) return blockRegistry
          const q = query.toLowerCase()
          return blockRegistry.filter(
            item =>
              item.label.toLowerCase().includes(q) ||
              item.keywords?.some(k => k.includes(q))
          )
        },

        render: () => {
          let container = null
          let list = null
          let dragHandle = null
          let items = []
          let index = 0
          let lastProps = null
          let slashRange = null
          let used = false
          let styleElement = null
          let outsideClickIgnoreUntil = 0
          let openedAt = 0
          let openedFromPlus = false
          let recoveredEarlyExit = false

          /* ================= CLOSE ================= */

          const close = (reason = 'unknown') => {
            // For item selection we always close explicitly via close('select').
            // Ignoring suggestion-exit here avoids race conditions while commands
            // dispatch extra selection transactions (e.g. placing cursor inside block).
            if (reason === 'suggestion-exit' && used) {
              return
            }

            const slashStateBeforeCleanup = SlashSourceKey.getState(editor.state)
            const shouldIgnoreSuggestionExit =
              reason === 'suggestion-exit' &&
              !used &&
              openedFromPlus &&
              slashRange

            if (shouldIgnoreSuggestionExit && slashStateBeforeCleanup?.fromPlus) {
              recoveredEarlyExit = true
              return
            }

            document.removeEventListener('mousedown', handleOutsideClick)
            document.removeEventListener('keydown', handleGlobalKeyDown, true)
            document.removeEventListener('mousemove', handleDrag)
            document.removeEventListener('mouseup', stopDrag)

            // удаляем "/" если меню закрыли без выбора
            const slashState = SlashSourceKey.getState(editor.state)
            const shouldRecoverEarlyExit =
              reason === 'suggestion-exit' &&
              !used &&
              openedFromPlus &&
              slashRange

            if (shouldRecoverEarlyExit) {
              recoveredEarlyExit = true
              return
            }
            if (!used && slashState?.fromPlus && slashRange) {
              editor
                .chain()
                .focus()
                .deleteRange((() => {
                  const docSize = editor.state.doc.content.size
                  const from = Math.max(0, Math.min(slashRange.from, docSize))
                  const to = Math.max(from, Math.min(slashRange.to, docSize))
                  return { from, to }
                })())
                .run()
            }

            container?.remove()
            if (styleElement) {
              styleElement.remove()
            }
            
            container = null
            list = null
            dragHandle = null
            items = []
            index = 0
            slashRange = null
            used = false
            styleElement = null

            editor.view.dispatch(
              editor.state.tr.setMeta(SlashSourceKey, {
                fromPlus: false,
                anchorRect: null,
              })
            )
          }

          /* ================= KEYBOARD (GLOBAL CAPTURE) ================= */

          const handleMenuKeyDown = (event) => {
            if (!items.length) return false

            if (event.key === 'ArrowDown') {
              event.preventDefault()
              index = (index + 1) % items.length
              update()
              return true
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault()
              index = (index - 1 + items.length) % items.length
              update()
              return true
            }

            if (event.key === 'Enter') {
              event.preventDefault()
              used = true
              items[index]?.command({
                editor: lastProps.editor,
                range: lastProps.range,
              })
              close('select')
              return true
            }

            if (event.key === 'Escape') {
              event.preventDefault()
              close('escape')
              return true
            }

            return false
          }

          // Capture-фаза нужна, чтобы в таблицах стрелки не перехватывались редактором/таблицей.
          const handleGlobalKeyDown = (event) => {
            if (!container) return
            const handled = handleMenuKeyDown(event)
            if (!handled) return

            event.stopPropagation()
            if (typeof event.stopImmediatePropagation === 'function') {
              event.stopImmediatePropagation()
            }
          }

          /* ================= CLICK OUTSIDE ================= */

          const handleOutsideClick = e => {
            if (!container) return
            if (Date.now() < outsideClickIgnoreUntil) return
            if (!(e.target instanceof Element)) return

            // Исключения: клик по "+" или по самой модалке
            if (e.target.closest('.plus-overlay') || e.target.closest('.slash-menu-wrapper')) {
              return
            }

            if (!container.contains(e.target)) {
              close('outside')
            }
          }

          /* ================= DRAG ================= */

          let isDragging = false
          let dragOffsetX = 0
          let dragOffsetY = 0

          const startDrag = e => {
            // Разрешаем перетаскивание только за заголовок
            if (!dragHandle || !dragHandle.contains(e.target)) return
            
            isDragging = true
            dragOffsetX = e.clientX - container.offsetLeft
            dragOffsetY = e.clientY - container.offsetTop
            e.preventDefault()
          }

          const handleDrag = e => {
            if (!isDragging || !container) return
            container.style.left = `${e.clientX - dragOffsetX}px`
            container.style.top = `${e.clientY - dragOffsetY}px`
          }

          const stopDrag = () => {
            isDragging = false
          }

          /* ================= SCROLL ================= */

          const scrollToActive = () => {
            if (!container || !list) return
            const active = list.querySelector('.slash-item.active')
            if (!active) return

            const itemTop = active.offsetTop
            const itemBottom = itemTop + active.offsetHeight

            const viewTop = list.scrollTop
            const viewBottom = viewTop + list.clientHeight

            if (itemTop < viewTop) {
              list.scrollTop = itemTop
            } else if (itemBottom > viewBottom) {
              list.scrollTop =
                itemBottom - list.clientHeight
            }
          }

          /* ================= RENDER ================= */

          const update = () => {
            if (!list) return
            list.innerHTML = ''

            items.forEach((item, i) => {
              const el = document.createElement('button')
              el.className = `slash-item ${i === index ? 'active' : ''}`
              el.type = 'button'
              el.innerHTML = `
                <span class="slash-icon">${item.icon}</span>
                ${item.label}
              `

              el.onclick = e => {
                e.preventDefault()
                used = true
                item.command({
                  editor: lastProps.editor,
                  range: lastProps.range,
                })
                close('select')
              }

              list.appendChild(el)
            })

            requestAnimationFrame(scrollToActive)
          }

          /* ================= ПОЗИЦИОНИРОВАНИЕ ================= */

          const calculatePosition = (rect) => {
            if (!rect || !container) return { top: 0, left: 0 }
            
            // Ожидаемые размеры модалки (можно уточнить после создания)
            const menuHeight = 300 // максимальная высота
            const menuWidth = 250 // минимальная ширина
            
            // Получаем размеры окна
            const windowHeight = window.innerHeight
            const windowWidth = window.innerWidth
            
            // Проверяем, достаточно ли места снизу
            const spaceBelow = windowHeight - rect.bottom
            const spaceAbove = rect.top
            
            // Рассчитываем позицию по вертикали
            let top
            let placement = 'bottom' // или 'top'
            
            if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
              // Размещаем снизу, если места достаточно или снизу больше места чем сверху
              top = rect.bottom + 6
              placement = 'bottom'
            } else {
              // Размещаем сверху
              top = rect.top - menuHeight - 6
              placement = 'top'
            }
            
            // Корректируем положение по горизонтали
            let left = rect.left
            
            // Если меню не помещается по ширине, смещаем влево
            if (left + menuWidth > windowWidth) {
              left = windowWidth - menuWidth - 10
            }
            
            // Если смещение получилось отрицательное, ставим отступ слева
            if (left < 10) {
              left = 10
            }
            
            return { top, left, placement }
          }

          return {
            onStart: props => {
              if (container || styleElement) {
                document.removeEventListener('mousedown', handleOutsideClick)
                document.removeEventListener('keydown', handleGlobalKeyDown, true)
                document.removeEventListener('mousemove', handleDrag)
                document.removeEventListener('mouseup', stopDrag)
                container?.remove()
                styleElement?.remove()
                container = null
                list = null
                dragHandle = null
                styleElement = null
              }

              lastProps = props
              items = props.items || []
              index = 0
              used = false
              slashRange = props.range

              const slashState = SlashSourceKey.getState(editor.state)
              openedFromPlus = Boolean(slashState?.fromPlus)
              openedAt = Date.now()
              recoveredEarlyExit = false
              outsideClickIgnoreUntil = slashState?.fromPlus ? Date.now() + 450 : 0

              container = document.createElement('div')
              container.className = 'slash-menu-wrapper'

              // Создаем элемент для перетаскивания
              dragHandle = document.createElement('div')
              dragHandle.className = 'slash-menu-drag-handle'


              list = document.createElement('div')
              list.className = 'slash-menu'

              container.appendChild(dragHandle)
              container.appendChild(list)
              document.body.appendChild(container)

              document.addEventListener('keydown', handleGlobalKeyDown, true)

              // Добавляем стили
              styleElement = document.createElement('style')
              styleElement.textContent = `
                .slash-menu-wrapper {
                  position: fixed;
                  z-index: 9;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                  border: 1px solid #e5e7eb;
                  overflow: hidden;
                  max-height: 300px;
                  min-width: 250px;
                  display: flex;
                  flex-direction: column;
                }
                
                .slash-menu-drag-handle {
                  border: 2px dashed #d8d8d8;
                  border-top-right-radius:7px;
                  border-top-left-radius:7px;
                  height: 30px;
                  cursor: move;
                  padding: 8px 12px;
                  border-bottom: 1px solid #e5e7eb;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: #f9fafb;
                  user-select: none;
                  transition: background-color 0.2s ease;
                }
                
                .slash-menu-drag-handle:hover {
                  background-color: #f3f4f6;

                }
                
                .slash-menu {
                  max-height: 250px;
                  overflow-y: auto;
                  padding: 4px;
                  flex: 1;
                }
                
                .slash-item {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  width: 100%;
                  padding: 8px 12px;
                  border: none;
                  background: none;
                  text-align: left;
                  cursor: pointer;
                  border-radius: 4px;
                  font-size: 14px;
                  color: #374151;
                  transition: background-color 0.2s ease;
                }
                
                .slash-item:hover {
                  background-color: #f3f4f6;
                }
                
                .slash-item.active {
                  background-color: #eff6ff;
                  color: #1d4ed8;
                }
                
                .slash-icon {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 20px;
                  height: 20px;
                  font-size: 16px;
                }
              `
              document.head.appendChild(styleElement)

              // Получаем позицию курсора
              const rect = slashState?.anchorRect || props.clientRect?.()
              
              if (rect) {
                // Рассчитываем оптимальную позицию
                const position = calculatePosition(rect)
                container.style.top = `${position.top}px`
                container.style.left = `${position.left}px`
                
                // Добавляем класс для стилизации стрелочки, если нужно
                container.dataset.placement = position.placement
              }

              // draggable
              container.addEventListener('mousedown', startDrag)
              document.addEventListener('mousemove', handleDrag)
              document.addEventListener('mouseup', stopDrag)

              // click outside: вешаем сразу, стартовый клик от "+" отсекается через outsideClickIgnoreUntil
              document.addEventListener('mousedown', handleOutsideClick)

              update()
            },

            onUpdate: props => {
              lastProps = props
              items = props.items || []
              index = 0
              update()
            },

            onKeyDown: ({ event }) => {
              return handleMenuKeyDown(event)
            },

            onExit: () => close('suggestion-exit'),
          }
        },
      }),
    ]
  },
})
