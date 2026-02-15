import { useRef } from 'react'
import { Plus } from 'lucide-react'

interface UploadButtonProps {
  onUpload: (files: FileList) => void
}

export function UploadButton({ onUpload }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files)
      e.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ECFF56] text-gray-800 hover:bg-[#e0f34d] transition-colors shadow-sm"
        title="画像を追加"
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </>
  )
}
