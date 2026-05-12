'use client'

import { useState } from 'react'
import { useGame } from '@/lib/gameContext'
import cluesData from '@/data/clues.json'
import type { Clue } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  scene: '場景',
  dialogue: '對話',
  document: '文件',
  memory: '記憶',
  combine: '推論',
}

const CATEGORY_ORDER = ['combine', 'scene', 'dialogue', 'document', 'memory']

export default function ClueInventory() {
  const { state, dispatch } = useGame()
  const [selectedClue, setSelectedClue] = useState<Clue | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('combine')

  const allClues = cluesData.clues as Clue[]
  const foundClues = allClues.filter((c) => state.foundClues.includes(c.id))

  const grouped = CATEGORY_ORDER.reduce<Record<string, Clue[]>>((acc, cat) => {
    acc[cat] = foundClues.filter((c) => c.category === cat)
    return acc
  }, {})

  const categoriesWithClues = CATEGORY_ORDER.filter((c) => grouped[c].length > 0)
  const displayCategory = categoriesWithClues.includes(activeCategory)
    ? activeCategory
    : categoriesWithClues[0] ?? 'scene'

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-stone-500 text-xs tracking-widest">線索盒</p>
          <p className="text-stone-300 text-sm mt-0.5">{foundClues.length} 條線索</p>
        </div>
        <button
          onClick={() => {
            setSelectedClue(null)
            dispatch({ type: 'CLOSE_INVENTORY' })
          }}
          className="border border-stone-700 text-stone-400 text-xs py-1.5 px-3 hover:border-stone-500 hover:text-stone-200 transition-colors"
        >
          關閉
        </button>
      </div>
      <div className="border-b border-stone-800 mx-5" />

      {foundClues.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-stone-600 text-sm font-serif">還沒有找到任何線索。</p>
        </div>
      ) : (
        <>
          {/* Category tabs */}
          <div className="flex gap-1 px-5 py-3 overflow-x-auto">
            {categoriesWithClues.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-xs py-1.5 px-3 border transition-colors ${
                  displayCategory === cat
                    ? 'border-stone-400 text-stone-200 bg-stone-800'
                    : 'border-stone-700 text-stone-500 hover:border-stone-600 hover:text-stone-300'
                }`}
              >
                {CATEGORY_LABELS[cat]} ({grouped[cat].length})
              </button>
            ))}
          </div>

          {/* Clue list */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
            {grouped[displayCategory]?.map((clue) => (
              <button
                key={clue.id}
                onClick={() => setSelectedClue(selectedClue?.id === clue.id ? null : clue)}
                className={`w-full text-left border transition-colors duration-200 p-3 ${
                  selectedClue?.id === clue.id
                    ? 'border-stone-500 bg-stone-800/50'
                    : 'border-stone-800 hover:border-stone-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  {clue.is_key_clue && (
                    <span className="text-amber-700 text-xs mt-0.5 flex-shrink-0">◆</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-200 text-sm font-serif">{clue.name}</p>
                    <p className="text-stone-500 text-xs mt-1 leading-relaxed">{clue.description}</p>
                  </div>
                </div>

                {/* Expanded detail */}
                {selectedClue?.id === clue.id && (
                  <div className="mt-3 pt-3 border-t border-stone-700 space-y-3">
                    <p className="text-stone-300 text-sm leading-relaxed font-serif whitespace-pre-line">
                      {clue.detail}
                    </p>
                    <p className="text-stone-600 text-xs">來源：{clue.source}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
