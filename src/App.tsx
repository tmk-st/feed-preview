import { useState, useCallback, useEffect } from 'react'
import { Header } from './components/Header'
import { ImageGrid, type ImageItem } from './components/ImageGrid'
import { UploadButton } from './components/UploadButton'
import { saveImage, loadImage, deleteImage, saveOrder, loadOrder } from './lib/imageStore'
import './index.css'

let nextId = 1

function App() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const order = loadOrder()
    if (order.length === 0) return
    let cancelled = false
    ;(async () => {
      const loaded: ImageItem[] = []
      for (const id of order) {
        const blob = await loadImage(id)
        if (cancelled) return
        if (blob) {
          loaded.push({ id, src: URL.createObjectURL(blob) })
        }
      }
      const maxNum = order.reduce((max, id) => {
        const n = parseInt(id.replace('img-', ''), 10)
        return isNaN(n) ? max : Math.max(max, n)
      }, 0)
      nextId = maxNum + 1
      setImages(loaded)
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const handleToggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev)
  }, [])

  const handleUpload = useCallback((files: FileList) => {
    const newImages: ImageItem[] = []
    Array.from(files).forEach((file) => {
      const id = `img-${nextId++}`
      newImages.push({ id, src: URL.createObjectURL(file) })
      saveImage(id, file)
    })
    setImages((prev) => {
      const updated = [...newImages, ...prev]
      saveOrder(updated.map((img) => img.id))
      return updated
    })
  }, [])

  const handleReorder = useCallback((reordered: ImageItem[]) => {
    setImages(reordered)
    saveOrder(reordered.map((img) => img.id))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.src)
      const updated = prev.filter((img) => img.id !== id)
      saveOrder(updated.map((img) => img.id))
      return updated
    })
    deleteImage(id)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#000000] transition-colors">
      <Header darkMode={darkMode} onToggleDarkMode={handleToggleDarkMode} />
      <main className="max-w-[935px] mx-auto">
        <div className="flex justify-center py-4 px-4">
          <UploadButton onUpload={handleUpload} />
        </div>
        <div className="px-4 sm:px-0">
          <ImageGrid
            images={images}
            onReorder={handleReorder}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  )
}

export default App
