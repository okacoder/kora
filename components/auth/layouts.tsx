import { AppSidebar } from "../app-sidebar";
import { SiteHeader } from "../site-header";
import { SidebarInset } from "../ui/sidebar";
import { AuthenticatedProviders } from "./providers";
import { getCurrentUser } from "@/lib/user-actions";

export const AuthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    return (
        <AuthenticatedProviders>
            <AppSidebar
                        user={{ ...user, image: user.image ?? null, phoneNumber: user.phoneNumber ?? "" }}
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