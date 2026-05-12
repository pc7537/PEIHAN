'use client'

import { useGame } from '@/lib/gameContext'

export default function TitleScreen() {
  const { dispatch } = useGame()

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-8">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-serif text-stone-100 tracking-widest">四相</h1>
          <p className="text-stone-500 text-sm tracking-widest">FOUR MARKS</p>
        </div>

        <div className="w-px h-16 bg-stone-700 mx-auto" />

        <p className="text-stone-400 text-sm leading-relaxed max-w-xs text-center">
          一個記憶中有缺口的人<br />
          在尋找一個消失的人<br />
          在一座即將消失的寺院
        </p>

        <div className="space-y-3 pt-4">
          <button
            onClick={() => dispatch({ type: 'START_GAME' })}
            className="block w-full border border-stone-600 text-stone-300 py-3 px-8 text-sm tracking-widest hover:border-stone-400 hover:text-stone-100 transition-colors duration-300"
          >
            開始
          </button>
        </div>

        <p className="text-stone-700 text-xs tracking-wider pt-4">
          凡所有相，皆是虛妄
        </p>
      </div>
    </div>
  )
}
