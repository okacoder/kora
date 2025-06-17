import { AuthenticatedLayout } from '@/components/auth/layouts';
import { GameStoreUserSync } from '@/components/game-store-user-sync';


export default function AuthenticatedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedLayout>
      <GameStoreUserSync />
      {children}
    </AuthenticatedLayout>
  );
}
