import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ImageCurator from '@/components/management_ui/ImageCurator'

export default function ImageCuratorPage() {
  return (
    <ProtectedRoute>
      <ImageCurator />
    </ProtectedRoute>
  )
}
