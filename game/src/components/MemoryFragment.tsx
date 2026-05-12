'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/gameContext'
import journalistData from '@/data/npcs/journalist.json'
import act1Data from '@/data/act1.json'

interface MemoryData {
  title?: string | null
  image?: string | null
  text: string
  tap_to_continue?: boolean
  choices?: Array<{ label: string; next: string }>
  reveal?: string | null
}

function getMemoryData(memoryId: string): MemoryData | null {
  // Act 1 memories
  const act1Memory = act1Data.sequences.memory_fragment_001
  if (memoryId === 'memory_fragment_001') {
    return {
      title: act1Memory.title,
      image: act1Memory.image,
      text: act1Memory.text,
      tap_to_continue: act1Memory.tap_to_continue,
    }
  }

  // Journalist fragments
  const frags = journalistData.fragments as Record<string, MemoryData & { type: string }>
  if (frags[memoryId]) return frags[memoryId]

  return null
}

export default function MemoryFragment() {
  const { state, dispatch } = useGame()
  const [visible, setVisible] = useState(false)

  const memory = getMemoryData(state.memoryId)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [state.memoryId])

  if (!memory) return null

  const handleTap = () => {
    if (memory.tap_to_continue) {
      dispatch({ type: 'DISMISS_MEMORY' })
    }
  }

  return (
    <div
      className={`fixed inset-0 bg-black flex flex-col transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={memory.tap_to_continue ? handleTap : undefined}
    >
      {/* B&W Image */}
      {memory.image && (
        <div className="relative h-48 flex-shrink-0">
          <div
            className="absolute inset-0 bg-cover bg-center grayscale opacity-40"
            style={{ backgroundImage: `url(${memory.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between px-6 py-6">
        <div className="space-y-4">
          {memory.title && (
            <p className="text-stone-500 text-xs tracking-widest">{memory.title}</p>
          )}
          <div className="w-8 h-px bg-stone-700" />
          <p className="text-stone-300 text-sm leading-loose font-serif whitespace-pre-line">
            {memory.text}
          </p>
        </div>

        {memory.tap_to_continue && (
          <p className="text-stone-600 text-xs text-center tracking-widest mt-6">點擊繼續</p>
        )}

        {memory.choices && memory.choices.length > 0 && (
          <div className="space-y-2 mt-6">
            {memory.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() =>
                  dispatch({
                    type: 'FRAGMENT_CHOOSE',
                    next: choice.next,
                    reveal: undefined,
                  })
                }
                className="w-full text-left border border-stone-700 text-stone-300 text-sm py-3 px-4 hover:border-stone-500 hover:text-stone-100 transition-colors duration-200 font-serif"
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
