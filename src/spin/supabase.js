import { createClient } from '@supabase/supabase-js'

// The publishable key is meant to be public: it only allows what the
// database's row-level security and functions allow (see
// supabase/spin-schema.sql). The secret/service key must never be in here.
export const SUPABASE_URL = 'https://jbzdkzajjgdhzokdscyz.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_2TxN0jNSeUObU3Ou2I6tZw__OFka3NT'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, storageKey: 'skyeye-spin-auth' },
})

/** What to tell a player when their code can't spin right now. */
export const REASONS = {
  invalid: 'That code doesn’t look right. Check the email we sent you.',
  no_round: 'No round is running right now. Hang tight, the next one starts soon!',
  already_spun: 'You’ve used all your spins. Done a challenge at the stall? Ask the team for an extra spin, then tap the button below.',
  already_won: 'You’ve used all your spins (and won!). Show your winning screen at the stall to collect. Earned an extra spin? Tap the button below once the team has added it.',
  no_prizes: 'The wheel is out of prizes for now. Ask the stall team!',
}
