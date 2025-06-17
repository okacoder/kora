import { AuthenticatedLayout } from "@/components/auth/layouts";
import { auth } from "@/lib/auth";
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
