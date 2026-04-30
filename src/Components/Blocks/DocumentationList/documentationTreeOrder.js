const KEY_PREFIX = 'karsAvia_docTreeOrder_'

function storageKey(documentationType) {
  return `${KEY_PREFIX}${documentationType || 'default'}`
}

export function saveTreeOrder(tree, documentationType) {
  try {
    const orderMap = {}
    const traverse = (nodes, parentId) => {
      if (!Array.isArray(nodes) || nodes.length === 0) return
      orderMap[parentId] = nodes.map(n => n.id)
      for (const node of nodes) {
        if (Array.isArray(node.children) && node.children.length > 0) {
          traverse(node.children, node.id)
        }
      }
    }
    traverse(tree, 'root')
    localStorage.setItem(storageKey(documentationType), JSON.stringify(orderMap))
  } catch {}
}

export function loadTreeOrder(documentationType) {
  try {
    const raw = localStorage.getItem(storageKey(documentationType))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function applyTreeOrder(nodes, orderMap, parentId = 'root') {
  if (!orderMap || !Array.isArray(nodes) || nodes.length === 0) return nodes

  const savedIds = orderMap[parentId]
  if (!Array.isArray(savedIds) || savedIds.length === 0) return nodes

  const nodeMap = {}
  for (const node of nodes) {
    nodeMap[node.id] = node
  }

  const ordered = savedIds.filter(id => nodeMap[id]).map(id => nodeMap[id])
  const extra = nodes.filter(n => !savedIds.includes(n.id))
  const result = [...ordered, ...extra]

  return result.map(node => {
    if (!Array.isArray(node.children) || node.children.length === 0) return node
    const reorderedChildren = applyTreeOrder(node.children, orderMap, node.id)
    return { ...node, children: reorderedChildren }
  })
}
