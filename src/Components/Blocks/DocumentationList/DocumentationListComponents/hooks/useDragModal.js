import { useState, useRef } from 'react'

export function useDragModal(initialPos) {
  const [position, setPosition] = useState(initialPos)
  const [isDragging, setIsDragging] = useState(false)
  const offsetRef = useRef({ x: 0, y: 0 })
  const modalRef = useRef(null)

  const handleDragStart = (e) => {
    if (!modalRef.current) return
    if (!e.target.closest('.modal-draggable-header')) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const rect = modalRef.current.getBoundingClientRect()
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    
    setIsDragging(true)

    const handleMouseMove = (moveEvent) => {
      if (!isDragging) return
      
      const newX = moveEvent.clientX - offsetRef.current.x
      const newY = moveEvent.clientY - offsetRef.current.y
      
      const maxX = window.innerWidth - rect.width - 10
      const maxY = window.innerHeight - rect.height - 10
      
      setPosition({
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY))
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return { modalRef, position, handleDragStart, isDragging }
}