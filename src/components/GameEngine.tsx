'use client'

import { useGame } from '@/lib/gameContext'
import TitleScreen from './TitleScreen'
import TitleCard from './TitleCard'
import NarratorScene from './NarratorScene'
import InterrogationScene from './InterrogationScene'
import MemoryFragment from './MemoryFragment'
import TransitionScene from './TransitionScene'
import ExplorationScene from './ExplorationScene'
import DialogueScene from './DialogueScene'
import ClueInventory from './ClueInventory'
import ClueFoundOverlay from './ClueFoundOverlay'

export default function GameEngine() {
  const { state, dispatch } = useGame()

  const renderPhase = () => {
    switch (state.phase) {
      case 'title':
        return <TitleScreen />

      case 'title_card':
        return (
          <TitleCard
            text={state.titleCardText}
            onAdvance={() => dispatch({ type: 'ADVANCE_TITLE_CARD' })}
          />
        )

      case 'narration':
        return (
          <NarratorScene
            texts={state.narrationTexts}
            index={state.narrationIndex}
            onAdvance={() => dispatch({ type: 'ADVANCE_NARRATION' })}
          />
        )

      case 'interrogation':
        return <InterrogationScene />

      case 'memory':
        return <MemoryFragment />

      case 'transition':
        return <TransitionScene />

      case 'exploration':
        return <ExplorationScene />

      case 'dialogue':
        return <DialogueScene />

      case 'clue_found':
        return (
          <>
            {state.inventoryPreviousPhase === 'dialogue' ? (
              <DialogueScene />
            ) : (
              <ExplorationScene />
            )}
            <ClueFoundOverlay />
          </>
        )

      case 'inventory':
        return <ClueInventory />

      default:
        return <TitleScreen />
    }
  }

  return (
    <div className="w-full h-full max-w-md mx-auto relative overflow-hidden">
      {renderPhase()}
    </div>
  )
}
