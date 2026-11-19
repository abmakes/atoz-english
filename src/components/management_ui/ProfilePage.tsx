'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import QuizList from '@/components/management_ui/QuizList'
import ProfileQuizListSkeleton, {
  ProfileStatsSkeleton,
} from '@/components/management_ui/ProfileQuizListSkeleton'
import type { Quiz } from '@/types'
import { getQuizStatistics } from '@/lib/quiz-statistics'
import { useIsClerkActive } from '@/components/auth/ClerkActiveProvider'
import { useUser } from '@clerk/nextjs'
import {
  emptyProfileQuizLists,
  type ProfileQuizLists,
} from '@/lib/profile-quiz-card'
import {
  deleteQuizDraft,
  draftHasContent,
  listQuizDrafts,
  type QuizDraftSnapshot,
} from '@/lib/quiz-draft-storage'
import { FileEdit, Trash2 } from 'lucide-react'
import AssignmentsPanel from '@/components/management_ui/AssignmentsPanel'

/**
 * Profile shell — Published, Drafts, Liked, Favorites.
 * Quiz cards arrive with the page. Drafts stay on this device.
 */
function ProfileShell({
  displayName,
  imageUrl,
  initialLists,
  ready,
}: {
  displayName: string
  imageUrl?: string
  initialLists: ProfileQuizLists
  ready: boolean
}) {
  const router = useRouter()
  const [owned, setOwned] = useState<Quiz[]>(initialLists.owned)
  const [favorites, setFavorites] = useState<Quiz[]>(initialLists.favorites)
  const [liked, setLiked] = useState<Quiz[]>(initialLists.liked)
  const [drafts, setDrafts] = useState<QuizDraftSnapshot[]>(() =>
    typeof window !== 'undefined' ? listQuizDrafts().filter(draftHasContent) : []
  )
  const [loadingRemote, setLoadingRemote] = useState(!ready)
  const [tab, setTab] = useState('published')

  const refreshDrafts = useCallback(() => {
    setDrafts(listQuizDrafts().filter(draftHasContent))
  }, [])

  useEffect(() => {
    refreshDrafts()
  }, [refreshDrafts])

  useEffect(() => {
    if (ready) return
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch('/api/profile/quizzes', { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        const lists = payload?.data ?? emptyProfileQuizLists()
        if (cancelled) return
        setOwned(Array.isArray(lists.owned) ? lists.owned : [])
        setFavorites(Array.isArray(lists.favorites) ? lists.favorites : [])
        setLiked(Array.isArray(lists.liked) ? lists.liked : [])
      } catch (error) {
        console.error('Failed to load profile quizzes:', error)
        if (!cancelled) {
          setOwned([])
          setFavorites([])
          setLiked([])
        }
      } finally {
        if (!cancelled) setLoadingRemote(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready])

  const totalLikesReceived = useMemo(
    () => owned.reduce((sum, quiz) => sum + getQuizStatistics(quiz.statistics).likes, 0),
    [owned]
  )

  const resumeDraft = (draft: QuizDraftSnapshot) => {
    if (draft.mode === 'edit' && draft.quizId) {
      router.push(`/quizzes/${draft.quizId}/edit`)
      return
    }
    router.push(`/create?draft=${encodeURIComponent(draft.id)}`)
  }

  const removeDraft = (id: string) => {
    deleteQuizDraft(id)
    refreshDrafts()
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 border-2 border-[#1E5167] rounded-2xl p-4 sm:p-6 bg-white shadow-[4px_4px_0px_0px_#1E5167]">
        <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-[#1E5167] bg-slate-100 shrink-0">
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl font-bold grandstander text-[#114257]">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold grandstander text-[#114257] truncate">
            {displayName}
          </h1>
          {loadingRemote ? (
            <ProfileStatsSkeleton draftCount={drafts.length} />
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <ProfileStat label="Published" value={owned.length} tone="sky" />
              <ProfileStat label="Drafts" value={drafts.length} tone="amber" />
              <ProfileStat label="Liked" value={liked.length} tone="rose" />
              <ProfileStat label="Favorites" value={favorites.length} tone="violet" />
              <ProfileStat label="Likes received" value={totalLikesReceived} tone="emerald" />
            </div>
          )}
        </div>
        <Link href="/create" passHref>
          <Button className="grandstander shrink-0">Create New Quiz</Button>
        </Link>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6 bg-white border-2 border-[#1E5167] flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="published" className="grandstander">
            Published
          </TabsTrigger>
          <TabsTrigger value="drafts" className="grandstander">
            Drafts ({drafts.length})
          </TabsTrigger>
          <TabsTrigger value="liked" className="grandstander">
            Liked
          </TabsTrigger>
          <TabsTrigger value="favorites" className="grandstander">
            Favorites
          </TabsTrigger>
          <TabsTrigger value="assignments" className="grandstander">
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <AssignmentsPanel />
        </TabsContent>

        <TabsContent value="published">
          {loadingRemote ? (
            <ProfileQuizListSkeleton count={4} />
          ) : owned.length > 0 ? (
            <QuizList key={`owned-${owned.map((quiz) => quiz.id).join(',')}`} initialQuizzes={owned} mode="owned" />
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-[#1E5167] rounded-2xl">
              <p className="text-xl text-gray-500 mb-4 grandstander">
                You haven&apos;t published any quizzes yet.
              </p>
              <Link href="/create" passHref>
                <Button size="lg" className="grandstander">
                  Create Your First Quiz
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts">
          {drafts.length > 0 ? (
            <div className="grid gap-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white border-2 border-[#1E5167] shadow-[4px_4px_0px_0px_#1E5167] rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex gap-3">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-[#1E5167] bg-slate-100">
                      <Image
                        src={draft.quizSetup.coverImageUrl || '/images/placeholder.webp'}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold grandstander text-[#114257] truncate">
                        {draft.quizSetup.title?.trim() || 'Untitled draft'}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 inclusive-sans mt-1">
                        {draft.quizSetup.description?.trim() || 'No description yet'}
                      </p>
                      <p className="text-xs text-[#114257] mt-2 font-semibold">
                        {draft.questions.length} question{draft.questions.length === 1 ? '' : 's'} ·{' '}
                        Step: {draft.creationStep} · Saved{' '}
                        {new Date(draft.updatedAt).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-amber-700 mt-1">
                        Stored on this device only (not synced to the cloud yet).
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="text-sm grandstander flex items-center gap-1 font-semibold text-blue-700"
                      onClick={() => resumeDraft(draft)}
                    >
                      <FileEdit className="h-4 w-4" />
                      Resume
                    </button>
                    <button
                      type="button"
                      className="text-sm grandstander flex items-center gap-1 font-semibold text-red-700"
                      onClick={() => removeDraft(draft.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-[#1E5167] rounded-2xl">
              <p className="text-xl text-gray-500 mb-2 grandstander">No drafts on this device.</p>
              <p className="text-sm text-muted-foreground mb-4 inclusive-sans px-4">
                Start creating a quiz — progress autosaves here so a failed publish won&apos;t wipe
                your work.
              </p>
              <Link href="/create" passHref>
                <Button size="lg" className="grandstander">
                  Start a quiz
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked">
          {loadingRemote ? (
            <ProfileQuizListSkeleton count={4} />
          ) : liked.length > 0 ? (
            <QuizList
              key={`liked-${liked.map((quiz) => quiz.id).join(',')}`}
              initialQuizzes={liked}
              mode="liked"
              onUnlike={(id) => setLiked((prev) => prev.filter((quiz) => quiz.id !== id))}
            />
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-[#1E5167] rounded-2xl">
              <p className="text-xl text-gray-500 mb-4 grandstander">No liked quizzes yet.</p>
              <Link href="/games" passHref>
                <Button size="lg" variant="outline" className="grandstander border-2 border-[#1E5167]">
                  Browse Games
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          {loadingRemote ? (
            <ProfileQuizListSkeleton count={4} />
          ) : favorites.length > 0 ? (
            <QuizList
              key={`fav-${favorites.map((quiz) => quiz.id).join(',')}`}
              initialQuizzes={favorites}
              mode="favorited"
              onUnfavorite={(id) => setFavorites((prev) => prev.filter((quiz) => quiz.id !== id))}
            />
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-[#1E5167] rounded-2xl">
              <p className="text-xl text-gray-500 mb-4 grandstander">No favorites yet.</p>
              <p className="text-sm text-muted-foreground mb-4">
                Browse the catalog and tap the bookmark icon to save quizzes here.
              </p>
              <Link href="/games" passHref>
                <Button size="lg" variant="outline" className="grandstander border-2 border-[#1E5167]">
                  Browse Games
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'sky' | 'amber' | 'rose' | 'violet' | 'emerald'
}) {
  const toneClass = {
    sky: 'border-sky-300 bg-sky-100 text-sky-900',
    amber: 'border-amber-300 bg-amber-100 text-amber-900',
    rose: 'border-rose-300 bg-rose-100 text-rose-900',
    violet: 'border-violet-300 bg-violet-100 text-violet-900',
    emerald: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  }[tone]
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${toneClass}`}>
      <span className="grandstander text-base font-black">{value}</span>
      {label}
    </span>
  )
}

function ProfileWithClerk({
  initialLists,
  ready,
}: {
  initialLists: ProfileQuizLists
  ready: boolean
}) {
  const { user } = useUser()
  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    'Your profile'
  return (
    <ProfileShell
      displayName={displayName}
      imageUrl={user?.imageUrl}
      initialLists={initialLists}
      ready={ready}
    />
  )
}

export default function ProfilePage({
  initialLists,
  ready,
}: {
  initialLists: ProfileQuizLists
  ready: boolean
}) {
  const clerkActive = useIsClerkActive()

  if (clerkActive) {
    return <ProfileWithClerk initialLists={initialLists} ready={ready} />
  }

  return <ProfileShell displayName="Your profile" initialLists={initialLists} ready={ready} />
}
