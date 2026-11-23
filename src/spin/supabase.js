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
  already_spun: 'This code has already been used. Each code gets one spin. Thanks for playing!',
  already_won: 'You’ve already won with this code! Show your winning screen at the stall to collect.',
  no_prizes: 'The wheel is out of prizes for now. Ask the stall team!',
}
