export type StepState = 'done' | 'current' | 'todo'

// Which of the guided "Cobros" steps is done / current. Pure and dependency-free
// so it can be unit-tested.
export function computeSteps(s: { connectedProviders: readonly string[]; hasPaymentBlock: boolean; hasPublishedPaymentPage: boolean }): StepState[] {
  const done = [s.connectedProviders.length > 0, s.hasPaymentBlock, s.hasPublishedPaymentPage]
  let currentAssigned = false
  return done.map(d => {
    if (d) return 'done'
    if (!currentAssigned) { currentAssigned = true; return 'current' }
    return 'todo'
  })
}
