export function findDocById(nodes, id) {
  if (!Array.isArray(nodes)) return null
  if (id == null) return null

  for (const n of nodes) {
    if (n?.id === id && n?.type === 'article') return n
    if (Array.isArray(n?.children)) {
      const found = findDocById(n.children, id)
      if (found) return found
    }
  }

  return null
}

