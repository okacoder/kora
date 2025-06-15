import { AppSidebar } from "@/components/app-sidebar";
import { AuthenticatedLayout } from "@/components/auth/layouts";

import { SiteHeader } from "@/components/site-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { auth } from "@/lib/auth"; // path to your Better Auth server instance
import { GarameProvider } from "@/lib/garame/infrastructure/garame-provider";
import { headers } from "next/headers";

export default async function layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return;
  }

  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  );
}
