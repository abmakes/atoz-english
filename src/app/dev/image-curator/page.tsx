import { notFound } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ImageCurator from '@/components/management_ui/ImageCurator';

const isCuratorEnabled =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_IMAGE_CURATOR === 'true';

export default function ImageCuratorPage() {
  if (!isCuratorEnabled) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <ImageCurator />
    </ProtectedRoute>
  );
}
