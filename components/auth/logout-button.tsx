'use client';

import { Button } from '@/components/ui/button';
import * as React from 'react';
import { LogOutIcon, LoaderIcon } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useRouter } from 'next/navigation';
import { routes } from '@/lib/routes';
import { authClient } from '@/lib/auth-client';

type LogoutButtonProps = {
  customClass?: string;
};

export function LogoutButton({ customClass }: LogoutButtonProps) {
  const user = useCurrentUser();
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      // Clear any additional cookies or local storage if needed
      // delete better-auth.dont_remember & better-auth.session_token
      document.cookie =
        'better-auth.dont_remember=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie =
        'better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.push(routes.login);
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Button
      onClick={() => {
        startTransition(handleLogout);
      }}
      type={'button'}
      variant={'ghost'}
      className={'w-max gap-2 ' + customClass}
      disabled={isPending}
    >
      {isPending ? (
        <LoaderIcon className="mr-2 size-4 animate-spin" />
      ) : (
        <LogOutIcon className={'size-4'} />
      )}
      <span>Se déconnecter</span>
    </Button>
  );
}
