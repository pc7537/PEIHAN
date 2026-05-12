'use client'

import { useEffect, useState } from 'react'

interface Props {
  text: string
  onAdvance: () => void
}

export default function TitleCard({ text, onAdvance }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="fixed inset-0 bg-zinc-950 flex items-center justify-center px-8 cursor-pointer"
      onClick={onAdvance}
    >
      <div className={`transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        {text.split('\n').map((line, i) => (
          <p
            key={i}
            className="text-stone-400 text-sm tracking-widest text-center leading-loose font-mono"
          >
            {line}
          </p>
        ))}
        <p className="text-stone-700 text-xs text-center mt-8 tracking-widest">點擊繼續</p>
      </div>
    </div>
  )
}
