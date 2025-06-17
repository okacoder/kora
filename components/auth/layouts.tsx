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

    // Check if we're in a game route
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';
    const isGameRoute = pathname.includes('/games/') && (pathname.includes('/play/') || pathname.includes('/roomId'));

    return (
        <AuthenticatedProviders>
            {isGameRoute ? (
                // Full-screen game layout
                <div className="h-viewport w-full">
                    {children}
                </div>
            ) : (
                // Regular app layout with sidebar
                <>
                    <AppSidebar
                        user={{ ...session.user, image: session.user.image ?? null }}
                        variant="inset"
                    />
                    <SidebarInset className="bg-background overflow-hidden">
                        <SiteHeader />
                        <div className="flex-1 relative">
                            <div className="absolute py-6 inset-0 overflow-y-scroll @container/main">
                                {children}
                            </div>
                        </div>
                    </SidebarInset>
                </>
            )}
        </AuthenticatedProviders>
    );
};