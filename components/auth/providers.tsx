import { ThemeProvider } from "next-themes";
import { RouteAuthGuard } from "./route-auth-gard";
import { SidebarProvider } from "../ui/sidebar";

export const BaseProviders = ({ children }: { children: React.ReactNode }) => {
  return (<ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider> 
        )
};


export const AuthenticatedProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BaseProviders>
      <RouteAuthGuard>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          {children}
        </SidebarProvider>
      </RouteAuthGuard>
    </BaseProviders>
  );
};