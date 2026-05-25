'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/gameContext'
import journalistData from '@/data/npcs/journalist.json'

interface JournalistFragment {
  type: 'document' | 'memory'
  source_location?: string | null
  requires_clue?: string | null
  next?: string | null
  title?: string | null
  timestamp?: string | null
  image?: string | null
  text: string
  reveal?: string | null
  narrator?: string | null
  choices?: Array<{ label: string; next: string }>
}

export default function FragmentInvestigationScene() {
  const { state, dispatch } = useGame()
  const [visible, setVisible] = useState(false)

  const frags = journalistData.fragments as Record<string, JournalistFragment>
  const fragment = frags[state.currentFragmentId]

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [state.currentFragmentId])

  if (!fragment) return null

  const isMemory = fragment.type === 'memory'

  const handleNext = (nextId: string) => {
    const nextFrag = frags[nextId]
    if (!nextFrag) {
      dispatch({ type: 'FRAGMENT_CHOOSE', next: 'close', reveal: null })
      return
    }
    if (nextFrag.requires_clue && !state.foundClues.includes(nextFrag.requires_clue)) {
      dispatch({ type: 'FRAGMENT_CHOOSE', next: 'close', reveal: null })
      return
    }
    dispatch({ type: 'FRAGMENT_CHOOSE', next: nextId, reveal: fragment.reveal ?? null })
  }

  const handleClose = () => {
    dispatch({ type: 'FRAGMENT_CHOOSE', next: 'close', reveal: fragment.reveal ?? null })
  }

  const nextAvailable = fragment.next
    ? frags[fragment.next] && (!frags[fragment.next].requires_clue || state.foundClues.includes(frags[fragment.next].requires_clue ?? ''))
    : false

  return (
    <div
      className={`fixed inset-0 bg-black flex flex-col transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Image */}
      {fragment.image && (
        <div className="relative h-44 flex-shrink-0">
          <div
            className={`absolute inset-0 bg-cover bg-center ${isMemory ? 'grayscale opacity-35' : 'opacity-30'}`}
            style={{ backgroundImage: `url(${fragment.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-stone-500 text-xs tracking-widest">
            {isMemory ? '記憶碎片' : '文件'}
          </p>
          {fragment.timestamp && (
            <p className="text-stone-600 text-xs">{fragment.timestamp}</p>
          )}
        </div>

        {fragment.title && (
          <p className="text-stone-300 text-xs tracking-widest border-l-2 border-stone-700 pl-3">
            {fragment.title}
          </p>
        )}

        <div className="w-8 h-px bg-stone-800" />

        <p className="text-stone-200 text-sm leading-loose font-serif whitespace-pre-line">
          {fragment.text}
        </p>

        {fragment.narrator && (
          <p className="text-stone-500 text-xs italic border-l border-stone-700 pl-3 mt-4">
            {fragment.narrator}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 pb-8 pt-3 border-t border-stone-900 space-y-2 flex-shrink-0">
        {fragment.choices && fragment.choices.length > 0 ? (
          fragment.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() =>
                dispatch({
                  type: 'FRAGMENT_CHOOSE',
                  next: choice.next,
                  reveal: fragment.reveal ?? null,
                })
              }
              className="w-full text-left border border-stone-700 text-stone-300 text-sm py-3 px-4 hover:border-stone-500 hover:text-stone-100 transition-colors duration-200 font-serif"
            >
              {choice.label}
            </button>
          ))
        ) : (
          <div className="flex gap-2">
            {fragment.next && nextAvailable && (
              <button
                onClick={() => handleNext(fragment.next!)}
                className="flex-1 border border-stone-600 text-stone-300 text-sm py-2.5 px-4 hover:border-stone-400 hover:text-stone-100 transition-colors duration-200"
              >
                下一則
              </button>
            )}
            <button
              onClick={handleClose}
              className={`border border-stone-800 text-stone-500 text-sm py-2.5 px-4 hover:border-stone-600 hover:text-stone-300 transition-colors duration-200 ${!fragment.next || !nextAvailable ? 'flex-1' : ''}`}
            >
              {fragment.next && nextAvailable ? '關閉' : '收起'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
