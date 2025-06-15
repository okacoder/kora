import { GarameProvider } from "@/lib/garame/infrastructure/garame-provider";
import { AppSidebar } from "../app-sidebar";
import { SiteHeader } from "../site-header";
import { SidebarProvider, SidebarInset } from "../ui/sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AuthenticatedProviders } from "./providers";

export const AuthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return;
    }

  return (<AuthenticatedProviders>
    <AppSidebar
          user={{ ...session.user, image: session.user.image ?? null }}
          variant="inset"
        />
        <SidebarInset className="bg-background overflow-hidden">
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
  </AuthenticatedProviders>);
};