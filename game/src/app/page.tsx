'use client'

import { GameProvider } from '@/lib/gameContext'
import GameEngine from '@/components/GameEngine'

export default function Home() {
  return (
    <GameProvider>
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <GameEngine />
      </div>
    </GameProvider>
  )
}
