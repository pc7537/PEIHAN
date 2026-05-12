'use client'

import { useState } from 'react'
import { useGame } from '@/lib/gameContext'
import act1Data from '@/data/act1.json'

export default function InterrogationScene() {
  const { state, dispatch } = useGame()
  const scene = act1Data.sequences.interrogation_scene

  return (
    <div className="fixed inset-0 bg-zinc-900 flex flex-col">
      {/* Scene background placeholder */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${scene.background})` }}
      />

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Location */}
        <div className="px-5 pt-5 pb-3">
          <p className="text-stone-500 text-xs tracking-widest">警察局．詢問室</p>
          <div className="mt-2 border-b border-stone-800" />
        </div>

        {/* Main text */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {state.interrogationStep === 'setup' && (
            <div className="space-y-4">
              <p className="text-stone-300 text-sm leading-loose font-serif whitespace-pre-line">
                {scene.setup_text}
              </p>
            </div>
          )}

          {state.interrogationStep === 'response' && (
            <div className="space-y-4">
              <p className="text-stone-300 text-sm leading-loose font-serif whitespace-pre-line">
                {state.interrogationResponse}
              </p>
              <div className="border-l-2 border-stone-700 pl-4 mt-4">
                <p className="text-stone-500 text-xs italic">
                  她（你）的手收緊了。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Choices or Continue */}
        <div className="px-5 pb-8 pt-3 border-t border-stone-800 space-y-2">
          {state.interrogationStep === 'setup' &&
            scene.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() =>
                  dispatch({
                    type: 'INTERROGATION_CHOOSE',
                    choiceId: choice.id,
                    response: choice.response,
                    next: 'memory',
                  })
                }
                className="w-full text-left border border-stone-700 text-stone-300 text-sm py-3 px-4 hover:border-stone-500 hover:text-stone-100 transition-colors duration-200 font-serif leading-snug"
              >
                {choice.label}
              </button>
            ))}

          {state.interrogationStep === 'response' && (
            <button
              onClick={() => dispatch({ type: 'INTERROGATION_NEXT' })}
              className="w-full border border-stone-700 text-stone-400 text-sm py-3 px-4 hover:border-stone-500 hover:text-stone-200 transition-colors duration-200 tracking-wider"
            >
              繼續
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
