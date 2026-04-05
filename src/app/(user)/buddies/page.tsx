'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, Button } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { getUserBuddies, makeBuddyPermanent, type Buddy } from '@/lib/buddies'
import { Users, UserCheck, Calendar, Wine, Pin } from 'lucide-react'

export default function BuddiesPage() {
  const [buddies, setBuddies] = useState<Buddy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const id = session?.user?.id || localStorage.getItem('palate-temp-user')
      if (!id) { setIsLoading(false); return }
      setUserId(id)

      const data = await getUserBuddies(id)
      setBuddies(data)
      setIsLoading(false)
    }

    load()
  }, [])

  const handleMakePermanent = async (buddyId: string) => {
    if (!userId) return
    await makeBuddyPermanent(userId, buddyId)
    setBuddies(prev =>
      prev.map(b => b.buddy_id === buddyId ? { ...b, is_permanent: true } : b)
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WineLoader />
      </div>
    )
  }

  const permanentBuddies = buddies.filter(b => b.is_permanent)
  const eventBuddies = buddies.filter(b => !b.is_permanent)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-md font-bold text-[var(--foreground)]">Buddies</h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          People you've tasted with
        </p>
      </div>

      {buddies.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center">
          <Users className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
            No buddies yet
          </h2>
          <p className="text-body-md text-[var(--foreground-secondary)]">
            Connect with other tasters at your next event using a buddy code
          </p>
        </Card>
      ) : (
        <>
          {permanentBuddies.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-[var(--wine)]" />
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
                  Saved Buddies
                </h2>
              </div>
              {permanentBuddies.map((buddy, index) => (
                <BuddyCard key={buddy.buddy_id} buddy={buddy} index={index} />
              ))}
            </section>
          )}

          {eventBuddies.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Wine className="h-4 w-4 text-[var(--foreground-muted)]" />
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
                  From Events
                </h2>
              </div>
              <p className="text-body-sm text-[var(--foreground-muted)] -mt-1">
                Save a buddy to keep them for future events
              </p>
              {eventBuddies.map((buddy, index) => (
                <BuddyCard
                  key={buddy.buddy_id}
                  buddy={buddy}
                  index={index}
                  onSave={() => handleMakePermanent(buddy.buddy_id)}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function BuddyCard({
  buddy,
  index,
  onSave,
}: {
  buddy: Buddy
  index: number
  onSave?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card variant="default" padding="md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
            <span className="text-body-md font-semibold text-[var(--wine)]">
              {buddy.buddy_name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-body-md font-semibold text-[var(--foreground)]">
                {buddy.buddy_name}
              </h3>
              {buddy.is_permanent && (
                <UserCheck className="h-4 w-4 text-[var(--wine)]" />
              )}
            </div>
            {buddy.connected_at_event_name && (
              <div className="flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
                <p className="text-body-xs text-[var(--foreground-muted)] truncate">
                  Met at {buddy.connected_at_event_name}
                </p>
              </div>
            )}
          </div>
          {onSave && (
            <Button size="sm" variant="secondary" onClick={onSave}>
              Save
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
