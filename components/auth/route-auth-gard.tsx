import { routes } from '@/app/lib/routes';
import { auth, Session } from '@/lib/auth';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import { hasAnyRole } from './utils';
import { headers } from 'next/headers';

export interface BaseLayoutProps {
  children: React.ReactNode;
  roles?: Role[];
  fallbackUrl?: string;
  fallbackComponent?: React.ReactNode;
}

export async function RouteAuthGuard({
  children,
  roles,
  fallbackUrl,
  fallbackComponent,
}: BaseLayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return;
  }
  if (!session.user) redirect(routes.login);

  if (!hasAnyRole(session.user, roles)) {
    if (fallbackComponent) {
      return fallbackComponent;
    }
    if (fallbackUrl) {
      redirect(fallbackUrl);
    }
  }

  return <>{children}</>;
}

