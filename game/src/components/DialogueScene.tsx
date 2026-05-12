'use client'

import { useGame } from '@/lib/gameContext'
import abbotData from '@/data/npcs/abbot.json'
import discipleData from '@/data/npcs/disciple.json'
import type { NPC, DialogueNode } from '@/lib/types'

const NPC_DATA: Record<string, NPC> = {
  abbot_huiming: abbotData as NPC,
  disciple_renxiu: discipleData as NPC,
}

export default function DialogueScene() {
  const { state, dispatch } = useGame()

  const npc = NPC_DATA[state.currentNpcId]
  if (!npc) return null

  const isStart = state.currentNodeId === 'start'
  const node: DialogueNode | undefined = isStart
    ? { text: npc.opening.text, choices: npc.nodes.start.choices }
    : (npc.nodes[state.currentNodeId] as DialogueNode)

  if (!node) return null

  const breakScore = state.npcBreakScores[state.currentNpcId] ?? 0

  // Filter choices by clue requirements
  const availableChoices = (node.choices ?? []).filter((c) => {
    if (!c.requires_clue) return true
    return state.foundClues.includes(c.requires_clue)
  })

  const backgroundImage = isStart ? npc.opening.image : (node.image ?? npc.opening.image)

  const handleChoice = (next: string) => {
    const targetNode = npc.nodes[next] as DialogueNode | undefined

    if (next === 'end' || !targetNode) {
      dispatch({ type: 'END_DIALOGUE' })
      return
    }

    dispatch({
      type: 'DIALOGUE_CHOOSE',
      next,
      reveal: targetNode.reveal ?? null,
      breakDelta: targetNode.break_delta ?? 0,
    })
  }

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/60" />

      {/* UI */}
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className="text-stone-500 text-xs tracking-widest">{npc.location}</p>
            <p className="text-stone-200 text-base font-serif mt-0.5">{npc.name}</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'END_DIALOGUE' })}
            className="text-stone-600 text-xs hover:text-stone-400 transition-colors"
          >
            離開
          </button>
        </div>

        {/* Break indicator */}
        {breakScore > 0 && (
          <div className="px-5 pb-2">
            <div className="flex gap-1">
              {Array.from({ length: npc.break_threshold }).map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 transition-colors duration-500 ${
                    i < breakScore ? 'bg-amber-700' : 'bg-stone-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="border-b border-stone-800 mx-5" />

        {/* Dialogue text */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {node.is_break && (
            <div className="mb-3 border-l-2 border-amber-800 pl-3">
              <p className="text-amber-700 text-xs tracking-wider">⬦ 防線已破</p>
            </div>
          )}
          <p className="text-stone-200 text-sm leading-loose font-serif whitespace-pre-line">
            {node.text}
          </p>
          {node.unlock_message && (
            <div className="mt-4 bg-stone-900/80 border border-stone-700 px-3 py-2">
              <p className="text-stone-400 text-xs">📎 {node.unlock_message}</p>
            </div>
          )}
        </div>

        {/* Choices */}
        <div className="px-5 pb-8 pt-3 border-t border-stone-800 space-y-2">
          {availableChoices.length > 0 ? (
            availableChoices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(choice.next)}
                className="w-full text-left border border-stone-700 text-stone-300 text-sm py-3 px-4 hover:border-stone-500 hover:text-stone-100 transition-colors duration-200 font-serif leading-snug"
              >
                {choice.label}
              </button>
            ))
          ) : (
            <button
              onClick={() => dispatch({ type: 'END_DIALOGUE' })}
              className="w-full border border-stone-700 text-stone-500 text-sm py-3 px-4 hover:border-stone-500 hover:text-stone-300 transition-colors duration-200 tracking-wider"
            >
              離開對話
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
