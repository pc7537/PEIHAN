'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { GameState, GameAction, GamePhase } from './types'
import cluesData from '@/data/clues.json'

const initialState: GameState = {
  phase: 'title',
  narrationTexts: [],
  narrationIndex: 0,
  narrationOnComplete: 'interrogation',
  titleCardText: '',
  titleCardOnComplete: 'narration',
  transitionText: '',
  transitionOnComplete: 'exploration',
  interrogationStep: 'setup',
  interrogationResponse: '',
  memoryId: '',
  currentScene: 'ruins_main',
  currentNpcId: '',
  currentNodeId: 'start',
  npcBreakScores: {},
  npcVisitedNodes: {},
  currentFragmentNpcId: '',
  currentFragmentId: '',
  foundClues: [],
  newlyFoundClueId: '',
  inventoryPreviousPhase: 'exploration',
}

function checkCombinations(foundClues: string[]): string[] {
  const allClues = cluesData.clues
  const newClues: string[] = []

  for (const clue of allClues) {
    if (clue.category !== 'combine') continue
    if (foundClues.includes(clue.id)) continue
    const needed = clue.connections.combines_with
    if (needed.length > 0 && needed.every((id) => foundClues.includes(id))) {
      newClues.push(clue.id)
    }
  }

  // Also check if any clue's combine_result should be added
  const triggered: string[] = []
  for (const clue of allClues) {
    if (!foundClues.includes(clue.id)) continue
    const result = clue.connections.combine_result
    if (result && !foundClues.includes(result) && !newClues.includes(result)) {
      const combineClue = allClues.find((c) => c.id === result)
      if (combineClue) {
        const needed = combineClue.connections.combines_with
        if (needed.length > 0 && needed.every((id) => [...foundClues, ...newClues].includes(id))) {
          triggered.push(result)
        }
      }
    }
  }

  return [...newClues, ...triggered]
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        phase: 'title_card',
        titleCardText: '2024．11．24\n07:12\n清淨院，已拆除申請進行中\n昨夜火災一人死亡',
        titleCardOnComplete: 'narration',
        narrationTexts: [
          '你記得雨的聲音。',
          '你記得自己沿著山路走，手機沒有訊號，鞋子濕透，松脂的氣味和燒焦的氣味混在一起。',
          '你不記得中間的四個小時。',
        ],
        narrationIndex: 0,
        narrationOnComplete: 'interrogation',
      }

    case 'ADVANCE_TITLE_CARD':
      return { ...state, phase: state.titleCardOnComplete }

    case 'ADVANCE_NARRATION': {
      const next = state.narrationIndex + 1
      if (next >= state.narrationTexts.length) {
        return { ...state, phase: state.narrationOnComplete, narrationIndex: 0 }
      }
      return { ...state, narrationIndex: next }
    }

    case 'INTERROGATION_CHOOSE':
      return {
        ...state,
        interrogationStep: 'response',
        interrogationResponse: action.response,
      }

    case 'INTERROGATION_NEXT':
      return {
        ...state,
        phase: 'memory',
        memoryId: 'memory_fragment_001',
      }

    case 'TRIGGER_MEMORY':
      return { ...state, phase: 'memory', memoryId: action.memoryId }

    case 'DISMISS_MEMORY':
      return {
        ...state,
        phase: 'transition',
        transitionText: '陳組長帶你去現場做身份指認。\n\n現場還有警察拉著的封鎖線。空氣裡有菸灰，有雨後的泥土，有某種說不清楚的東西，讓你想起它又想逃開它。\n\n你走進清淨院的廢墟。',
        transitionOnComplete: 'exploration',
      }

    case 'GO_TO_EXPLORATION':
      return { ...state, phase: 'exploration', currentScene: action.sceneId }

    case 'NAVIGATE_SCENE':
      return { ...state, currentScene: action.sceneId }

    case 'SET_TRANSITION':
      return {
        ...state,
        phase: 'transition',
        transitionText: action.text,
        transitionOnComplete: action.onComplete,
      }

    case 'TRANSITION_COMPLETE':
      return { ...state, phase: state.transitionOnComplete }

    case 'START_DIALOGUE':
      return {
        ...state,
        phase: 'dialogue',
        currentNpcId: action.npcId,
        currentNodeId: 'start',
      }

    case 'DIALOGUE_CHOOSE': {
      const { next, reveal, breakDelta = 0 } = action
      const npcId = state.currentNpcId
      const prevScore = state.npcBreakScores[npcId] ?? 0
      const newScore = Math.max(0, prevScore + breakDelta)
      const visited = state.npcVisitedNodes[npcId] ?? []

      let newFound = [...state.foundClues]
      let newClueId = ''
      if (reveal && !newFound.includes(reveal)) {
        newFound.push(reveal)
        newClueId = reveal
        const combos = checkCombinations(newFound)
        newFound = [...newFound, ...combos.filter((c) => !newFound.includes(c))]
      }

      if (next === 'end') {
        return {
          ...state,
          phase: newClueId ? 'clue_found' : 'exploration',
          currentNpcId: '',
          currentNodeId: 'start',
          npcBreakScores: { ...state.npcBreakScores, [npcId]: newScore },
          npcVisitedNodes: { ...state.npcVisitedNodes, [npcId]: [...visited, state.currentNodeId] },
          foundClues: newFound,
          newlyFoundClueId: newClueId,
          inventoryPreviousPhase: 'exploration',
        }
      }

      return {
        ...state,
        currentNodeId: next,
        npcBreakScores: { ...state.npcBreakScores, [npcId]: newScore },
        npcVisitedNodes: { ...state.npcVisitedNodes, [npcId]: [...visited, state.currentNodeId] },
        foundClues: newFound,
        newlyFoundClueId: newClueId,
        phase: newClueId ? 'clue_found' : 'dialogue',
        inventoryPreviousPhase: 'dialogue',
      }
    }

    case 'END_DIALOGUE':
      return {
        ...state,
        phase: 'exploration',
        currentNpcId: '',
        currentNodeId: 'start',
      }

    case 'START_FRAGMENT_INVESTIGATION':
      return {
        ...state,
        phase: 'fragment_investigation',
        currentFragmentNpcId: action.npcId,
        currentFragmentId: action.fragmentId,
      }

    case 'FRAGMENT_CHOOSE': {
      const { next, reveal } = action
      let newFound = [...state.foundClues]
      let newClueId = ''
      if (reveal && !newFound.includes(reveal)) {
        newFound.push(reveal)
        newClueId = reveal
        const combos = checkCombinations(newFound)
        newFound = [...newFound, ...combos.filter((c) => !newFound.includes(c))]
      }

      if (next === 'close' || next === 'end') {
        return {
          ...state,
          phase: newClueId ? 'clue_found' : 'exploration',
          foundClues: newFound,
          newlyFoundClueId: newClueId,
          inventoryPreviousPhase: 'exploration',
        }
      }

      return {
        ...state,
        currentFragmentId: next,
        foundClues: newFound,
        newlyFoundClueId: newClueId,
        phase: newClueId ? 'clue_found' : 'fragment_investigation',
        inventoryPreviousPhase: 'fragment_investigation',
      }
    }

    case 'CLOSE_FRAGMENT':
      return { ...state, phase: 'exploration' }

    case 'FIND_CLUE': {
      if (state.foundClues.includes(action.clueId)) return state
      let newFound = [...state.foundClues, action.clueId]
      const combos = checkCombinations(newFound)
      newFound = [...newFound, ...combos.filter((c) => !newFound.includes(c))]
      return {
        ...state,
        foundClues: newFound,
        newlyFoundClueId: action.clueId,
        phase: 'clue_found',
        inventoryPreviousPhase: state.phase,
      }
    }

    case 'DISMISS_CLUE_FOUND':
      return {
        ...state,
        phase: state.inventoryPreviousPhase === 'clue_found'
          ? 'exploration'
          : state.inventoryPreviousPhase,
        newlyFoundClueId: '',
      }

    case 'OPEN_INVENTORY':
      return { ...state, phase: 'inventory', inventoryPreviousPhase: state.phase }

    case 'CLOSE_INVENTORY':
      return { ...state, phase: state.inventoryPreviousPhase }

    default:
      return state
  }
}

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
