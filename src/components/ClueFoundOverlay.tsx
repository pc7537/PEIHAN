'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/gameContext'
import cluesData from '@/data/clues.json'
import type { Clue } from '@/lib/types'

export default function ClueFoundOverlay() {
  const { state, dispatch } = useGame()
  const [visible, setVisible] = useState(false)

  const clue = (cluesData.clues as Clue[]).find((c) => c.id === state.newlyFoundClueId)

  useEffect(() => {
    if (state.newlyFoundClueId) {
      setVisible(false)
      const t = setTimeout(() => setVisible(true), 100)
      return () => clearTimeout(t)
    }
  }, [state.newlyFoundClueId])

  if (!clue) return null

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-end transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={() => dispatch({ type: 'DISMISS_CLUE_FOUND' })}
    >
      <div
        className="w-full bg-zinc-900 border-t border-amber-900/50 p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-700 text-xs tracking-widest">線索已記錄</span>
          {clue.is_key_clue && <span className="text-amber-600 text-xs">◆ 關鍵線索</span>}
        </div>

        <p className="text-stone-100 text-base font-serif">{clue.name}</p>
        <p className="text-stone-400 text-sm leading-relaxed">{clue.description}</p>

        {clue.category === 'combine' && (
          <div className="border border-stone-700 px-3 py-2">
            <p className="text-stone-500 text-xs">⬦ 這是一條推論線索——由其他線索組合得出</p>
          </div>
        )}

        <button
          onClick={() => dispatch({ type: 'DISMISS_CLUE_FOUND' })}
          className="w-full border border-stone-700 text-stone-300 text-sm py-2.5 hover:border-stone-500 hover:text-stone-100 transition-colors mt-2"
        >
          繼續
        </button>
      </div>
    </div>
  )
}
