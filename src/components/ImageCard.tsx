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
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-[4/5] group cursor-grab active:cursor-grabbing ${
        isDragging ? 'z-50 opacity-50' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        draggable={false}
      />
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
