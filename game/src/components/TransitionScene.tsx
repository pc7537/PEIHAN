'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/gameContext'

export default function TransitionScene() {
  const { state, dispatch } = useGame()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const t1 = setTimeout(() => setVisible(true), 200)
    const t2 = setTimeout(() => {
      // Auto-advance after reading
    }, 100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [state.transitionText])

  return (
    <div
      className="fixed inset-0 bg-zinc-950 flex items-center justify-center px-8 cursor-pointer"
      onClick={() => dispatch({ type: 'TRANSITION_COMPLETE' })}
    >
      <div className={`max-w-sm transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-stone-400 text-sm leading-loose font-serif whitespace-pre-line text-center">
          {state.transitionText}
        </p>
        <p className="text-stone-700 text-xs text-center mt-8 tracking-widest">點擊繼續</p>
      </div>
    </div>
  )
}
