import { AppSidebar } from "../app-sidebar";
import { SiteHeader } from "../site-header";
import { SidebarInset } from "../ui/sidebar";
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

    return (
        <AuthenticatedProviders>
            <AppSidebar
                        user={{ ...session.user, image: session.user.image ?? null }}
                        variant="inset"
                    />
                    <SidebarInset className="bg-background overflow-hidden">
                        <SiteHeader />
                        <div className="flex-1 relative">
                            <div className="absolute py-6 inset-0 overflow-y-scroll">
                                {children}
                            </div>
                        </div>
                    </SidebarInset>
        </AuthenticatedProviders>
    );
};