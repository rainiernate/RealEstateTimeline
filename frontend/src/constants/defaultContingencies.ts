import { Contingency } from '../types/timeline'

export function getDefaultContingencies(_mutualDate: string, _closingDate: string): Contingency[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Title Review Period",
      type: "days_from_mutual",
      days: 5,
      description: "Review title report and raise any objections",
      isPossessionDate: false,
      status: 'not_started',
      order: 1
    },
    {
      id: crypto.randomUUID(),
      name: "Inspection Contingency",
      type: "days_from_mutual",
      days: 10,
      description: "Period to complete property inspection and review findings",
      isPossessionDate: false,
      status: 'not_started',
      order: 2
    },
    {
      id: crypto.randomUUID(),
      name: "Financing Contingency Waiver Cannot Be Compelled",
      type: "days_from_mutual",
      days: 21,
      description: "Period to secure financing approval and complete underwriting",
      isPossessionDate: false,
      status: 'not_started',
      order: 3
    },
    {
      id: crypto.randomUUID(),
      name: "Information Verification Period",
      type: "days_from_mutual",
      days: 10,
      description: "Period to verify all transaction information",
      isPossessionDate: false,
      status: 'not_started',
      order: 4
    },
    {
      id: crypto.randomUUID(),
      name: "Funds due to escrow",
      type: "days_before_closing",
      days: 1,
      description: "All funds must be received by escrow",
      isPossessionDate: false,
      status: 'not_started',
      order: 5
    }
  ]
}
