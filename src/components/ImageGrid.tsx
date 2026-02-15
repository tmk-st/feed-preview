import { useRef, useLayoutEffect } from 'react'
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { ImageCard } from './ImageCard'

export interface ImageItem {
  id: string
  src: string
}

interface ImageGridProps {
  images: ImageItem[]
  offset: number
  onReorder: (images: ImageItem[]) => void
  onDelete: (id: string) => void
}

export function ImageGrid({ images, offset, onReorder, onDelete }: ImageGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const prevPositions = useRef<Map<string, DOMRect>>(new Map())
  const prevOffsetRef = useRef(offset)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 画像が変わったら位置を記録（アニメーションなし）
  useLayoutEffect(() => {
    if (!gridRef.current) return
    const positions = new Map<string, DOMRect>()
    gridRef.current.querySelectorAll<HTMLElement>('[data-image-id]').forEach((el) => {
      positions.set(el.dataset.imageId!, el.getBoundingClientRect())
    })
    prevPositions.current = positions
  }, [images])

  // offset変更時にFLIPアニメーション
  useLayoutEffect(() => {
    if (!gridRef.current || prevOffsetRef.current === offset) return
    prevOffsetRef.current = offset
    const prev = prevPositions.current

    // DOM更新後の最終位置を取得
    const newPositions = new Map<string, DOMRect>()
    gridRef.current.querySelectorAll<HTMLElement>('[data-image-id]').forEach((el) => {
      newPositions.set(el.dataset.imageId!, el.getBoundingClientRect())
    })

    if (prev.size > 0) {
      const elements: { el: HTMLElement; dx: number; dy: number }[] = []

      gridRef.current.querySelectorAll<HTMLElement>('[data-image-id]').forEach((el) => {
        const id = el.dataset.imageId!
        const oldRect = prev.get(id)
        const newRect = newPositions.get(id)
        if (!oldRect || !newRect) return
        const dx = oldRect.left - newRect.left
        const dy = oldRect.top - newRect.top
        if (dx === 0 && dy === 0) return
        elements.push({ el, dx, dy })
      })

      // 1. 全要素を旧位置に配置（transition無効）
      elements.forEach(({ el, dx, dy }) => {
        el.style.transition = 'none'
        el.style.transform = `translate(${dx}px, ${dy}px)`
      })

      // 2. リフロー強制で旧位置を確定
      gridRef.current.getBoundingClientRect()

      // 3. 新位置へアニメーション
      elements.forEach(({ el }) => {
        el.style.transition = 'transform 300ms ease'
        el.style.transform = ''
      })
    }

    // 次回のFLIP用に最終位置を保存
    prevPositions.current = newPositions
  }, [offset])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id)
      const newIndex = images.findIndex((img) => img.id === over.id)
      onReorder(arrayMove(images, oldIndex, newIndex))
    }
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-medium">画像をアップロードしてください</p>
        <p className="text-sm mt-1">ドラッグ&ドロップで並び替えできます</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={images} strategy={rectSortingStrategy}>
        <div ref={gridRef} className="grid grid-cols-3 gap-[3px]">
          {Array.from({ length: offset }, (_, i) => (
            <div key={`offset-${i}`} className="aspect-[4/5]" />
          ))}
          {images.map((image) => (
            <ImageCard
              key={image.id}
              id={image.id}
              src={image.src}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
