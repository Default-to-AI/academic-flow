import { useState, useRef } from 'react'

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.txt'

export default function FileUpload({ onFile }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-colors select-none ${
        dragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-white hover:border-gray-400'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleChange}
      />
      <div className="text-5xl mb-4">📄</div>
      <p className="text-gray-700 font-medium text-lg">גרור קובץ הרצאה לכאן</p>
      <p className="text-gray-400 text-sm mt-1">PDF · תמונה · טקסט · עד 20MB</p>
      <p className="text-blue-500 text-sm mt-3 underline underline-offset-2">או לחץ לבחירת קובץ</p>
    </div>
  )
}
