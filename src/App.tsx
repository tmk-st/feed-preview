import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowRightToLine, Undo2, Redo2 } from 'lucide-react'
import { Header } from './components/Header'
import { ImageGrid, type ImageItem } from './components/ImageGrid'
import { UploadButton } from './components/UploadButton'
import { saveImage, loadImage, deleteImage, saveOrder, loadOrder } from './lib/imageStore'
import './index.css'

let nextId = 1

function App() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [gridOffset, setGridOffset] = useState(() => {
    const saved = localStorage.getItem('gridOffset')
    return saved ? Number(saved) : 0
  })
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // undo/redo 履歴
  const historyRef = useRef<ImageItem[][]>([])
  const historyIndexRef = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const pushHistory = useCallback((state: ImageItem[]) => {
    const history = historyRef.current
    const index = historyIndexRef.current
    // 現在位置より先の履歴を切り捨て
    historyRef.current = [...history.slice(0, index + 1), state]
    historyIndexRef.current = historyRef.current.length - 1
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }, [])

  useEffect(() => {
    const order = loadOrder()
    if (order.length === 0) {
      pushHistory([])
      return
    }
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
      pushHistory(loaded)
    })()
    return () => { cancelled = true }
  }, [pushHistory])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const handleCycleOffset = useCallback(() => {
    setGridOffset((prev) => {
      const next = (prev + 1) % 3
      localStorage.setItem('gridOffset', String(next))
      return next
    })
  }, [])

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
      pushHistory(updated)
      return updated
    })
  }, [pushHistory])

  const handleReorder = useCallback((reordered: ImageItem[]) => {
    setImages(reordered)
    saveOrder(reordered.map((img) => img.id))
    pushHistory(reordered)
  }, [pushHistory])

  const handleDelete = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.src)
      const updated = prev.filter((img) => img.id !== id)
      saveOrder(updated.map((img) => img.id))
      pushHistory(updated)
      return updated
    })
    deleteImage(id)
  }, [pushHistory])

  const handleUndo = useCallback(() => {
    const index = historyIndexRef.current
    if (index <= 0) return
    historyIndexRef.current = index - 1
    const state = historyRef.current[index - 1]
    setImages(state)
    saveOrder(state.map((img) => img.id))
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(true)
  }, [])

  const handleRedo = useCallback(() => {
    const history = historyRef.current
    const index = historyIndexRef.current
    if (index >= history.length - 1) return
    historyIndexRef.current = index + 1
    const state = history[index + 1]
    setImages(state)
    saveOrder(state.map((img) => img.id))
    setCanUndo(true)
    setCanRedo(historyIndexRef.current < history.length - 1)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#000000] transition-colors">
      <Header darkMode={darkMode} onToggleDarkMode={handleToggleDarkMode} />
      <main className="max-w-[935px] mx-auto">
        <div className="flex items-center justify-between py-3 px-4">
          {/* 左: オフセットボタン */}
          <button
            onClick={handleCycleOffset}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
            title={`グリッドオフセット: ${gridOffset}`}
          >
            <ArrowRightToLine className="w-5 h-5" />
          </button>

          {/* 中央: undo/redo */}
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-full shadow-sm overflow-hidden">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex items-center justify-center w-10 h-10 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="元に戻す"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex items-center justify-center w-10 h-10 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="やり直す"
            >
              <Redo2 className="w-5 h-5" />
            </button>
          </div>

          {/* 右: 画像追加ボタン */}
          <UploadButton onUpload={handleUpload} />
        </div>
        <ImageGrid
          images={images}
          offset={gridOffset}
          onReorder={handleReorder}
          onDelete={handleDelete}
        />
      </main>
    </div>
  )
}

export default App
