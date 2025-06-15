"use client";

import * as React from "react";
import {
  IconCards,
  IconCoin,
  IconDashboard,
  IconHome,
  IconInnerShadowTop,
  IconSettings,
  IconUserCircle,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Session } from "@/lib/auth";
import { routes } from "@/lib/routes";
import Link from "next/link";


const data = {
  navMain: [
    {
      title: "Tableau de bord",
      url: routes.base,
      icon: IconDashboard,
    },
    {
      title: "Mes Koras",
      url: routes.koras,
      icon: IconCoin,
    }
  ],
  navSecondary: [
    {
      title: "Mon compte",
      url: routes.account,
      icon: IconUserCircle,
    },
    {
      title: "Paramètres",
      url: routes.setting,
      icon: IconSettings,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: Session["user"];
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  if (!user) {
    throw new Error("AppSidebar requires a user but received undefined.");
  }
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={routes.games}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">LaMap241</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
