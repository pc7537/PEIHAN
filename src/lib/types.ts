export type GamePhase =
  | 'title'
  | 'title_card'
  | 'narration'
  | 'interrogation'
  | 'memory'
  | 'transition'
  | 'exploration'
  | 'dialogue'
  | 'fragment_investigation'
  | 'clue_found'
  | 'inventory'
  | 'deduction'

export interface GameState {
  phase: GamePhase
  // narration queue
  narrationTexts: string[]
  narrationIndex: number
  narrationOnComplete: GamePhase
  // title card
  titleCardText: string
  titleCardOnComplete: GamePhase
  // transition
  transitionText: string
  transitionOnComplete: GamePhase
  // interrogation
  interrogationStep: 'setup' | 'choice' | 'response'
  interrogationResponse: string
  // memory
  memoryId: string
  // exploration
  currentScene: string
  // dialogue
  currentNpcId: string
  currentNodeId: string
  npcBreakScores: Record<string, number>
  npcVisitedNodes: Record<string, string[]>
  // fragment investigation
  currentFragmentNpcId: string
  currentFragmentId: string
  // clue
  foundClues: string[]
  newlyFoundClueId: string
  // inventory
  inventoryPreviousPhase: GamePhase
}

export interface Choice {
  label: string
  next: string
  requires_clue?: string
}

export interface DialogueNode {
  text: string
  image?: string
  reveal?: string | null
  break_delta?: number
  is_break?: boolean
  unlock_message?: string
  narrator_note?: string
  requires_clue?: string
  choices?: Choice[]
}

export interface NPC {
  npc_id: string
  name: string
  portrait: string
  location: string
  break_threshold: number
  opening: {
    text: string
    image: string
  }
  nodes: Record<string, DialogueNode>
}

export interface Hotspot {
  id: string
  label: string
  position: { x: number; y: number }
  clue_id: string
  description: string
  detail: string
}

export interface SceneNPC {
  id: string
  label: string
  position: { x: number; y: number }
  description: string
}

export interface NavTarget {
  label: string
  target: string
}

export interface Scene {
  id: string
  name: string
  background: string
  hotspots: Hotspot[]
  npcs?: SceneNPC[]
  navigation?: NavTarget[]
}

export interface Clue {
  id: string
  name: string
  category: 'scene' | 'dialogue' | 'document' | 'memory' | 'combine'
  description: string
  detail: string
  image?: string | null
  source: string
  connections: {
    npc_unlocks: Array<{ npc_id: string; node_id: string }>
    combines_with: string[]
    combine_result?: string | null
  }
  annotation: string
  is_key_clue: boolean
}

export interface Fragment {
  type: 'document' | 'memory'
  source_location?: string
  requires_clue?: string | null
  title?: string | null
  timestamp?: string | null
  image?: string | null
  text: string
  reveal?: string | null
  narrator?: string
  trigger_clue?: string
  choices?: Choice[]
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'ADVANCE_TITLE_CARD' }
  | { type: 'ADVANCE_NARRATION' }
  | { type: 'INTERROGATION_CHOOSE'; choiceId: string; response: string; next: GamePhase }
  | { type: 'INTERROGATION_NEXT' }
  | { type: 'TRIGGER_MEMORY'; memoryId: string }
  | { type: 'DISMISS_MEMORY' }
  | { type: 'GO_TO_EXPLORATION'; sceneId: string }
  | { type: 'NAVIGATE_SCENE'; sceneId: string }
  | { type: 'START_DIALOGUE'; npcId: string }
  | { type: 'DIALOGUE_CHOOSE'; next: string; reveal?: string | null; breakDelta?: number }
  | { type: 'END_DIALOGUE' }
  | { type: 'START_FRAGMENT_INVESTIGATION'; npcId: string; fragmentId: string }
  | { type: 'FRAGMENT_CHOOSE'; next: string; reveal?: string | null }
  | { type: 'CLOSE_FRAGMENT' }
  | { type: 'FIND_CLUE'; clueId: string }
  | { type: 'DISMISS_CLUE_FOUND' }
  | { type: 'OPEN_INVENTORY' }
  | { type: 'CLOSE_INVENTORY' }
  | { type: 'SET_TRANSITION'; text: string; onComplete: GamePhase }
  | { type: 'TRANSITION_COMPLETE' }
  | { type: 'OPEN_DEDUCTION' }
  | { type: 'DEDUCTION_COMPLETE' }
