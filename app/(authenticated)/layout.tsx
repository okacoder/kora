import { AuthenticatedLayout } from '@/components/auth/layouts';

export default function AuthenticatedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  );
}
