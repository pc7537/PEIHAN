'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/gameContext'

interface Props {
  texts: string[]
  index: number
  onAdvance: () => void
}

export default function NarratorScene({ texts, index, onAdvance }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center px-8 cursor-pointer"
      onClick={onAdvance}
    >
      <div
        className={`max-w-sm text-center transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-stone-300 text-base leading-loose font-serif whitespace-pre-line">
          {texts[index]}
        </p>
        <p className="text-stone-600 text-xs mt-8 tracking-widest">
          點擊繼續
        </p>
      </div>
    </div>
  )
}
