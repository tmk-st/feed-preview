import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ImageCardProps {
  id: string
  src: string
  onDelete: (id: string) => void
}

export function ImageCard({ id, src, onDelete }: ImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    WebkitTouchCallout: 'none' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-[4/5] group select-none ${
        isDragging ? 'z-50 opacity-50' : ''
      }`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      {/* ドラッグハンドル */}
      <div
        className="absolute top-1 left-1 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none transition-opacity opacity-70 touch-device:opacity-70 hover-device:opacity-0 hover-device:group-hover:opacity-100 hover:bg-black/80"
        {...attributes}
        {...listeners}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
        </svg>
      </div>
      {/* 削除ボタン */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center transition-opacity opacity-70 touch-device:opacity-70 hover-device:opacity-0 hover-device:group-hover:opacity-100 hover:bg-black/80"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
