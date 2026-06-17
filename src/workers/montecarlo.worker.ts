/// <reference lib="webworker" />

import { runMonteCarlo, allActionEVs } from '../engine/montecarlo'
import type { Card } from '../engine/cards'

interface WorkerInput {
  playerCards: Card[]
  dealerUpcard: Card
  remainingShoe: Card[]
  legalActions: string[]
  numSimulations: number
  h17: boolean
  requestId: number
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { playerCards, dealerUpcard, remainingShoe, legalActions, numSimulations, h17, requestId } = e.data
  const result = runMonteCarlo(playerCards, dealerUpcard, remainingShoe, numSimulations, h17)
  const evs = allActionEVs(playerCards, dealerUpcard, remainingShoe, legalActions, Math.floor(numSimulations / 2), h17)
  self.postMessage({ result, evs, requestId })
}
