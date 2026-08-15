import LoadTimerOverlay from '@/components/game_ui/LoadTimerOverlay';

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LoadTimerOverlay />
      {children}
    </>
  );
}
