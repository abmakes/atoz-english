import ProfilePage from '@/components/management_ui/ProfilePage'
import { getOptionalUserId } from '@/lib/auth'
import { emptyProfileQuizLists, getProfileQuizLists } from '@/lib/profile-quizzes'

export const dynamic = 'force-dynamic'

export default async function QuizzesPage() {
  const userId = await getOptionalUserId()
  if (!userId) {
    return <ProfilePage initialLists={emptyProfileQuizLists()} ready />
  }

  try {
    const initialLists = await getProfileQuizLists(userId)
    return <ProfilePage initialLists={initialLists} ready />
  } catch (error) {
    console.error('Profile page quiz lists failed:', error)
    return <ProfilePage initialLists={emptyProfileQuizLists()} ready={false} />
  }
}
