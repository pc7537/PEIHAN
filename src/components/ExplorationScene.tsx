'use client'

import { useState } from 'react'
import { useGame } from '@/lib/gameContext'
import scenesData from '@/data/scenes.json'
import cluesData from '@/data/clues.json'
import journalistData from '@/data/npcs/journalist.json'
import type { Scene, Hotspot } from '@/lib/types'

export default function ExplorationScene() {
  const { state, dispatch } = useGame()
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)
  const [activeNpcDesc, setActiveNpcDesc] = useState<{ id: string; label: string; description: string } | null>(null)

  const scenes = scenesData.scenes as Record<string, Scene>
  const scene = scenes[state.currentScene]
  if (!scene) return null

  const handleHotspot = (hotspot: Hotspot) => {
    setActiveHotspot(hotspot)
    setActiveNpcDesc(null)
  }

  const handleCollectClue = (clueId: string) => {
    setActiveHotspot(null)
    dispatch({ type: 'FIND_CLUE', clueId })
  }

  const handleNpcClick = (npc: { id: string; label: string; description: string }) => {
    setActiveNpcDesc(npc)
    setActiveHotspot(null)
  }

  const getJournalistEntry = () => {
    const frags = journalistData.fragments as Record<string, { type: string; requires_clue?: string | null; source_location?: string | null }>
    for (const [fragId, frag] of Object.entries(frags)) {
      if (frag.type === 'document' && frag.source_location === state.currentScene) {
        if (!frag.requires_clue || state.foundClues.includes(frag.requires_clue)) {
          return fragId
        }
      }
    }
    return null
  }

  const journalistEntryId = getJournalistEntry()

  const phoneReadable = state.currentScene === 'ruins_backyard' && state.foundClues.includes('clue_phone_draft')
  const notebookReadable = state.currentScene === 'ruins_side_room' && state.foundClues.includes('clue_notebook')
  const canReadJournalist = (phoneReadable || notebookReadable) && journalistEntryId !== null

  const canDeduce = state.foundClues.includes('clue_robe_mismatch')

  return (
    <div className="fixed inset-0 bg-zinc-900 flex flex-col">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${scene.background})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50" />

      {/* UI Layer */}
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-stone-400 text-xs tracking-widest">探索</p>
            <p className="text-stone-200 text-sm font-serif mt-0.5">{scene.name}</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'OPEN_INVENTORY' })}
            className="border border-stone-700 text-stone-400 text-xs py-1.5 px-3 hover:border-stone-500 hover:text-stone-200 transition-colors"
          >
            線索盒 {state.foundClues.length > 0 && `(${state.foundClues.length})`}
          </button>
        </div>
        <div className="border-b border-stone-800 mx-5" />

        {/* Scene Area - hotspots */}
        <div className="flex-1 relative px-5 py-6 overflow-hidden">

          {/* Hotspots */}
          <div className="space-y-2">
            {scene.hotspots.map((hotspot) => {
              const alreadyFound = state.foundClues.includes(hotspot.clue_id)
              return (
                <button
                  key={hotspot.id}
                  onClick={() => handleHotspot(hotspot)}
                  className={`flex items-center gap-3 w-full text-left py-2 px-3 border transition-colors duration-200 ${
                    alreadyFound
                      ? 'border-stone-800 text-stone-600'
                      : 'border-stone-700 text-stone-300 hover:border-stone-500 hover:text-stone-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${alreadyFound ? 'bg-stone-700' : 'bg-amber-600'}`} />
                  <span className="text-sm">{hotspot.label}</span>
                  {alreadyFound && <span className="text-xs text-stone-600 ml-auto">已記錄</span>}
                </button>
              )
            })}
          </div>

          {/* NPCs */}
          {scene.npcs && scene.npcs.length > 0 && (
            <div className="mt-4">
              <p className="text-stone-600 text-xs tracking-widest mb-2">在場的人</p>
              {scene.npcs.map((npc) => (
                <button
                  key={npc.id}
                  onClick={() => handleNpcClick(npc)}
                  className="flex items-center gap-3 w-full text-left py-2 px-3 border border-stone-700 text-stone-300 hover:border-stone-400 hover:text-stone-100 transition-colors duration-200 mt-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 flex-shrink-0" />
                  <span className="text-sm">{npc.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Journalist document reader */}
        {canReadJournalist && journalistEntryId && (
          <div className="px-5 pt-2 pb-1 border-t border-stone-900">
            <button
              onClick={() =>
                dispatch({
                  type: 'START_FRAGMENT_INVESTIGATION',
                  npcId: 'journalist_zihao',
                  fragmentId: journalistEntryId,
                })
              }
              className="flex items-center gap-3 w-full text-left py-2 px-3 border border-amber-900/60 text-amber-600/80 hover:border-amber-700 hover:text-amber-400 transition-colors duration-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" />
              <span className="text-sm">
                {state.currentScene === 'ruins_backyard' ? '閱讀手機草稿' : '閱讀採訪筆記'}
              </span>
            </button>
          </div>
        )}

        {/* Navigation */}
        {scene.navigation && scene.navigation.length > 0 && (
          <div className="px-5 pb-2 pt-2 border-t border-stone-800">
            <div className="flex gap-2">
              {scene.navigation.map((nav) => (
                <button
                  key={nav.target}
                  onClick={() => dispatch({ type: 'NAVIGATE_SCENE', sceneId: nav.target })}
                  className="flex-1 border border-stone-700 text-stone-400 text-xs py-2 px-3 hover:border-stone-500 hover:text-stone-200 transition-colors"
                >
                  {nav.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Deduction trigger */}
        {canDeduce && (
          <div className="px-5 pb-6 pt-2">
            <button
              onClick={() => dispatch({ type: 'OPEN_DEDUCTION' })}
              className="w-full border border-stone-500 text-stone-300 text-sm py-3 hover:border-stone-300 hover:text-stone-100 transition-colors duration-200 tracking-wider"
            >
              陳述推理 →
            </button>
          </div>
        )}
      </div>

      {/* Hotspot Detail Modal */}
      {activeHotspot && (
        <div className="absolute inset-0 bg-black/70 flex items-end" onClick={() => setActiveHotspot(null)}>
          <div
            className="w-full bg-zinc-900 border-t border-stone-700 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-stone-400 text-xs tracking-widest">{activeHotspot.label}</p>
            <p className="text-stone-200 text-sm leading-relaxed font-serif whitespace-pre-line">
              {activeHotspot.detail}
            </p>
            <div className="flex gap-2 pt-2">
              {!state.foundClues.includes(activeHotspot.clue_id) ? (
                <button
                  onClick={() => handleCollectClue(activeHotspot.clue_id)}
                  className="flex-1 bg-stone-700 text-stone-100 text-sm py-2.5 hover:bg-stone-600 transition-colors"
                >
                  記錄線索
                </button>
              ) : (
                <p className="text-stone-600 text-sm py-2.5">已記錄</p>
              )}
              <button
                onClick={() => setActiveHotspot(null)}
                className="border border-stone-700 text-stone-400 text-sm py-2.5 px-4 hover:border-stone-500 transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NPC Approach Modal */}
      {activeNpcDesc && (
        <div className="absolute inset-0 bg-black/70 flex items-end" onClick={() => setActiveNpcDesc(null)}>
          <div
            className="w-full bg-zinc-900 border-t border-stone-700 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-stone-400 text-xs tracking-widest">{activeNpcDesc.label}</p>
            <p className="text-stone-300 text-sm leading-relaxed font-serif">{activeNpcDesc.description}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setActiveNpcDesc(null)
                  dispatch({ type: 'START_DIALOGUE', npcId: activeNpcDesc.id })
                }}
                className="flex-1 bg-stone-700 text-stone-100 text-sm py-2.5 hover:bg-stone-600 transition-colors"
              >
                開始對話
              </button>
              <button
                onClick={() => setActiveNpcDesc(null)}
                className="border border-stone-700 text-stone-400 text-sm py-2.5 px-4 hover:border-stone-500 transition-colors"
              >
                離開
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
