This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
app/
  (authenticated)/
    (dashboard)/
      dashboard/
        account/
          page.tsx
        setting/
          page.tsx
        page.tsx
      data.json
      layout.tsx
  api/
    auth/
      [...all]/
        route.ts
    route.ts
  login/
    page.tsx
  signup/
    page.jsx
  globals.css
  layout.tsx
  page.tsx
components/
  auth/
    login-form.tsx
    logout-button.tsx
    signup-form.tsx
  ui/
    alert.tsx
    avatar.tsx
    badge.tsx
    breadcrumb.tsx
    button.tsx
    card.tsx
    chart.tsx
    checkbox.tsx
    drawer.tsx
    dropdown-menu.tsx
    input.tsx
    label.tsx
    select.tsx
    separator.tsx
    sheet.tsx
    sidebar.tsx
    skeleton.tsx
    sonner.tsx
    table.tsx
    tabs.tsx
    toggle-group.tsx
    toggle.tsx
    tooltip.tsx
  app-sidebar.tsx
  chart-area-interactive.tsx
  data-table.tsx
  game-card.tsx
  mode-toggle.tsx
  nav-documents.tsx
  nav-main.tsx
  nav-secondary.tsx
  nav-user.tsx
  section-cards.tsx
  site-header.tsx
  theme-provider.tsx
hooks/
  use-mobile.ts
lib/
  auth-client.ts
  auth.ts
  prisma.ts
  utils.ts
prisma/
  schema.prisma
public/
  file.svg
  globe.svg
  next.svg
  vercel.svg
  window.svg
.gitignore
.repomixignore
components.json
docker-compose.yml
middleware.ts
next.config.ts
package.json
postcss.config.mjs
README.md
repomix.config.json
tsconfig.json
```

# Files

## File: app/(authenticated)/(dashboard)/dashboard/account/page.tsx
````typescript
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconH1, IconLoader } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { authClient } from "@/lib/auth-client";

import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function getUser() {
    const { data: session } = await authClient.getSession();
    return session;
  }

  useEffect(() => {
    getUser().then((data) => {
      setFullname(data?.user?.name ?? ""); // Use empty string as fallback
      setEmail(data?.user?.email ?? "");
      setUsername(data?.user?.username ?? "");
    });
  }, []);

  return !email ? (
    <div className="px-4 lg:px-6 lg:w-1/2 grid gap-4">
      <Skeleton className="w-1/2 h-[20px] rounded-full" />
      <Skeleton className="w-2/3 h-[20px] rounded-full" />
      <Separator className="mb-4" />
      <Skeleton className="w-full h-[20px] rounded-full" />
      <Skeleton className="w-full h-[30px] rounded-full" />
      <Skeleton className="w-full h-[20px] rounded-full" />
      <Skeleton className="w-full h-[30px] rounded-full" />
      <Skeleton className="w-full h-[30px] rounded-full" />
    </div>
  ) : (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-lg font-medium">Paramètres du compte</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Modifiez vos informations de compte
        </p>
        <Separator className="mb-4" />
        <form className="lg:w-1/2">
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Nom complet</Label>
              <Input
                onChange={(e) => setFullname(e.target.value)}
                value={fullname}
                id="name"
                type="text"
                placeholder="Achour Meguenni"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email">Nom d'utilisateur</Label>
              <Input
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                id="username"
                type="text"
                placeholder="achour_meguenni"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                id="email"
                type="email"
                placeholder="me@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button disabled={loading} type="submit" className="w-full">
                {loading ? (
                  <IconLoader className="animate-spin" stroke={2} />
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </div>
          <div className="mt-4 text-center text-sm">
            Mot de passe oublié?{" "}
            <a href="/login" className="underline underline-offset-4">
              Réinitialiser le mot de passe
            </a>
          </div>
        </form>
      </div>
    </>
  );
}
````

## File: app/(authenticated)/(dashboard)/dashboard/setting/page.tsx
````typescript
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { ModeToggle } from "@/components/mode-toggle";

export default async function Page() {
  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-lg font-medium">Appearance</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Choose your preferred appearance settings.
        </p>
        <ModeToggle />
      </div>
    </>
  );
}
````

## File: app/(authenticated)/(dashboard)/dashboard/page.tsx
````typescript
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";

import data from "../data.json";

export default async function Page() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  );
}
````

## File: app/(authenticated)/(dashboard)/data.json
````json
[
  {
    "id": 1,
    "header": "Cover page",
    "type": "Cover page",
    "status": "In Process",
    "target": "18",
    "limit": "5",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 2,
    "header": "Table of contents",
    "type": "Table of contents",
    "status": "Done",
    "target": "29",
    "limit": "24",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 3,
    "header": "Executive summary",
    "type": "Narrative",
    "status": "Done",
    "target": "10",
    "limit": "13",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 4,
    "header": "Technical approach",
    "type": "Narrative",
    "status": "Done",
    "target": "27",
    "limit": "23",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 5,
    "header": "Design",
    "type": "Narrative",
    "status": "In Process",
    "target": "2",
    "limit": "16",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 6,
    "header": "Capabilities",
    "type": "Narrative",
    "status": "In Process",
    "target": "20",
    "limit": "8",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 7,
    "header": "Integration with existing systems",
    "type": "Narrative",
    "status": "In Process",
    "target": "19",
    "limit": "21",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 8,
    "header": "Innovation and Advantages",
    "type": "Narrative",
    "status": "Done",
    "target": "25",
    "limit": "26",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 9,
    "header": "Overview of EMR's Innovative Solutions",
    "type": "Technical content",
    "status": "Done",
    "target": "7",
    "limit": "23",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 10,
    "header": "Advanced Algorithms and Machine Learning",
    "type": "Narrative",
    "status": "Done",
    "target": "30",
    "limit": "28",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 11,
    "header": "Adaptive Communication Protocols",
    "type": "Narrative",
    "status": "Done",
    "target": "9",
    "limit": "31",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 12,
    "header": "Advantages Over Current Technologies",
    "type": "Narrative",
    "status": "Done",
    "target": "12",
    "limit": "0",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 13,
    "header": "Past Performance",
    "type": "Narrative",
    "status": "Done",
    "target": "22",
    "limit": "33",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 14,
    "header": "Customer Feedback and Satisfaction Levels",
    "type": "Narrative",
    "status": "Done",
    "target": "15",
    "limit": "34",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 15,
    "header": "Implementation Challenges and Solutions",
    "type": "Narrative",
    "status": "Done",
    "target": "3",
    "limit": "35",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 16,
    "header": "Security Measures and Data Protection Policies",
    "type": "Narrative",
    "status": "In Process",
    "target": "6",
    "limit": "36",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 17,
    "header": "Scalability and Future Proofing",
    "type": "Narrative",
    "status": "Done",
    "target": "4",
    "limit": "37",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 18,
    "header": "Cost-Benefit Analysis",
    "type": "Plain language",
    "status": "Done",
    "target": "14",
    "limit": "38",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 19,
    "header": "User Training and Onboarding Experience",
    "type": "Narrative",
    "status": "Done",
    "target": "17",
    "limit": "39",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 20,
    "header": "Future Development Roadmap",
    "type": "Narrative",
    "status": "Done",
    "target": "11",
    "limit": "40",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 21,
    "header": "System Architecture Overview",
    "type": "Technical content",
    "status": "In Process",
    "target": "24",
    "limit": "18",
    "reviewer": "Maya Johnson"
  },
  {
    "id": 22,
    "header": "Risk Management Plan",
    "type": "Narrative",
    "status": "Done",
    "target": "15",
    "limit": "22",
    "reviewer": "Carlos Rodriguez"
  },
  {
    "id": 23,
    "header": "Compliance Documentation",
    "type": "Legal",
    "status": "In Process",
    "target": "31",
    "limit": "27",
    "reviewer": "Sarah Chen"
  },
  {
    "id": 24,
    "header": "API Documentation",
    "type": "Technical content",
    "status": "Done",
    "target": "8",
    "limit": "12",
    "reviewer": "Raj Patel"
  },
  {
    "id": 25,
    "header": "User Interface Mockups",
    "type": "Visual",
    "status": "In Process",
    "target": "19",
    "limit": "25",
    "reviewer": "Leila Ahmadi"
  },
  {
    "id": 26,
    "header": "Database Schema",
    "type": "Technical content",
    "status": "Done",
    "target": "22",
    "limit": "20",
    "reviewer": "Thomas Wilson"
  },
  {
    "id": 27,
    "header": "Testing Methodology",
    "type": "Technical content",
    "status": "In Process",
    "target": "17",
    "limit": "14",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 28,
    "header": "Deployment Strategy",
    "type": "Narrative",
    "status": "Done",
    "target": "26",
    "limit": "30",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 29,
    "header": "Budget Breakdown",
    "type": "Financial",
    "status": "In Process",
    "target": "13",
    "limit": "16",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 30,
    "header": "Market Analysis",
    "type": "Research",
    "status": "Done",
    "target": "29",
    "limit": "32",
    "reviewer": "Sophia Martinez"
  },
  {
    "id": 31,
    "header": "Competitor Comparison",
    "type": "Research",
    "status": "In Process",
    "target": "21",
    "limit": "19",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 32,
    "header": "Maintenance Plan",
    "type": "Technical content",
    "status": "Done",
    "target": "16",
    "limit": "23",
    "reviewer": "Alex Thompson"
  },
  {
    "id": 33,
    "header": "User Personas",
    "type": "Research",
    "status": "In Process",
    "target": "27",
    "limit": "24",
    "reviewer": "Nina Patel"
  },
  {
    "id": 34,
    "header": "Accessibility Compliance",
    "type": "Legal",
    "status": "Done",
    "target": "18",
    "limit": "21",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 35,
    "header": "Performance Metrics",
    "type": "Technical content",
    "status": "In Process",
    "target": "23",
    "limit": "26",
    "reviewer": "David Kim"
  },
  {
    "id": 36,
    "header": "Disaster Recovery Plan",
    "type": "Technical content",
    "status": "Done",
    "target": "14",
    "limit": "17",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 37,
    "header": "Third-party Integrations",
    "type": "Technical content",
    "status": "In Process",
    "target": "25",
    "limit": "28",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 38,
    "header": "User Feedback Summary",
    "type": "Research",
    "status": "Done",
    "target": "20",
    "limit": "15",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 39,
    "header": "Localization Strategy",
    "type": "Narrative",
    "status": "In Process",
    "target": "12",
    "limit": "19",
    "reviewer": "Maria Garcia"
  },
  {
    "id": 40,
    "header": "Mobile Compatibility",
    "type": "Technical content",
    "status": "Done",
    "target": "28",
    "limit": "31",
    "reviewer": "James Wilson"
  },
  {
    "id": 41,
    "header": "Data Migration Plan",
    "type": "Technical content",
    "status": "In Process",
    "target": "19",
    "limit": "22",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 42,
    "header": "Quality Assurance Protocols",
    "type": "Technical content",
    "status": "Done",
    "target": "30",
    "limit": "33",
    "reviewer": "Priya Singh"
  },
  {
    "id": 43,
    "header": "Stakeholder Analysis",
    "type": "Research",
    "status": "In Process",
    "target": "11",
    "limit": "14",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 44,
    "header": "Environmental Impact Assessment",
    "type": "Research",
    "status": "Done",
    "target": "24",
    "limit": "27",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 45,
    "header": "Intellectual Property Rights",
    "type": "Legal",
    "status": "In Process",
    "target": "17",
    "limit": "20",
    "reviewer": "Sarah Johnson"
  },
  {
    "id": 46,
    "header": "Customer Support Framework",
    "type": "Narrative",
    "status": "Done",
    "target": "22",
    "limit": "25",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 47,
    "header": "Version Control Strategy",
    "type": "Technical content",
    "status": "In Process",
    "target": "15",
    "limit": "18",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 48,
    "header": "Continuous Integration Pipeline",
    "type": "Technical content",
    "status": "Done",
    "target": "26",
    "limit": "29",
    "reviewer": "Michael Chen"
  },
  {
    "id": 49,
    "header": "Regulatory Compliance",
    "type": "Legal",
    "status": "In Process",
    "target": "13",
    "limit": "16",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 50,
    "header": "User Authentication System",
    "type": "Technical content",
    "status": "Done",
    "target": "28",
    "limit": "31",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 51,
    "header": "Data Analytics Framework",
    "type": "Technical content",
    "status": "In Process",
    "target": "21",
    "limit": "24",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 52,
    "header": "Cloud Infrastructure",
    "type": "Technical content",
    "status": "Done",
    "target": "16",
    "limit": "19",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 53,
    "header": "Network Security Measures",
    "type": "Technical content",
    "status": "In Process",
    "target": "29",
    "limit": "32",
    "reviewer": "Lisa Wong"
  },
  {
    "id": 54,
    "header": "Project Timeline",
    "type": "Planning",
    "status": "Done",
    "target": "14",
    "limit": "17",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 55,
    "header": "Resource Allocation",
    "type": "Planning",
    "status": "In Process",
    "target": "27",
    "limit": "30",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 56,
    "header": "Team Structure and Roles",
    "type": "Planning",
    "status": "Done",
    "target": "20",
    "limit": "23",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 57,
    "header": "Communication Protocols",
    "type": "Planning",
    "status": "In Process",
    "target": "15",
    "limit": "18",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 58,
    "header": "Success Metrics",
    "type": "Planning",
    "status": "Done",
    "target": "30",
    "limit": "33",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 59,
    "header": "Internationalization Support",
    "type": "Technical content",
    "status": "In Process",
    "target": "23",
    "limit": "26",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 60,
    "header": "Backup and Recovery Procedures",
    "type": "Technical content",
    "status": "Done",
    "target": "18",
    "limit": "21",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 61,
    "header": "Monitoring and Alerting System",
    "type": "Technical content",
    "status": "In Process",
    "target": "25",
    "limit": "28",
    "reviewer": "Daniel Park"
  },
  {
    "id": 62,
    "header": "Code Review Guidelines",
    "type": "Technical content",
    "status": "Done",
    "target": "12",
    "limit": "15",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 63,
    "header": "Documentation Standards",
    "type": "Technical content",
    "status": "In Process",
    "target": "27",
    "limit": "30",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 64,
    "header": "Release Management Process",
    "type": "Planning",
    "status": "Done",
    "target": "22",
    "limit": "25",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 65,
    "header": "Feature Prioritization Matrix",
    "type": "Planning",
    "status": "In Process",
    "target": "19",
    "limit": "22",
    "reviewer": "Emma Davis"
  },
  {
    "id": 66,
    "header": "Technical Debt Assessment",
    "type": "Technical content",
    "status": "Done",
    "target": "24",
    "limit": "27",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 67,
    "header": "Capacity Planning",
    "type": "Planning",
    "status": "In Process",
    "target": "21",
    "limit": "24",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 68,
    "header": "Service Level Agreements",
    "type": "Legal",
    "status": "Done",
    "target": "26",
    "limit": "29",
    "reviewer": "Assign reviewer"
  }
]
````

## File: app/(authenticated)/(dashboard)/layout.tsx
````typescript
import { AppSidebar } from "@/components/app-sidebar";

import { SiteHeader } from "@/components/site-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { auth } from "@/lib/auth"; // path to your Better Auth server instance
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
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        user={{ ...session.user, image: session.user.image ?? null }}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
````

## File: app/login/page.tsx
````typescript
import { LoginForm } from "@/components/auth/login-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
````

## File: app/signup/page.jsx
````javascript
import { SignupForm } from "@/components/auth/signup-form";

export default function Page() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <SignupForm />
            </div>
        </div>
    );
}
````

## File: components/auth/logout-button.tsx
````typescript
"use client";
import React, { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleLogOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login"); // redirect to login page
        },
        onRequest: (ctx) => {
          setLoading(true);
        },
        onResponse: (ctx) => {
          setLoading(false);
        },
      },
    });
  }
  return (
    <button onClick={() => handleLogOut()}>
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}
````

## File: components/ui/alert.tsx
````typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
````

## File: components/ui/avatar.tsx
````typescript
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
````

## File: components/ui/badge.tsx
````typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
````

## File: components/ui/breadcrumb.tsx
````typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
````

## File: components/ui/button.tsx
````typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
````

## File: components/ui/card.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
````

## File: components/ui/chart.tsx
````typescript
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = color || item.payload.fill || item.color

          return (
            <div
              key={item.dataKey}
              className={cn(
                "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                          {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          }
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> &
  Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
    hideIcon?: boolean
    nameKey?: string
  }) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={item.value}
            className={cn(
              "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3"
            )}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        )
      })}
    </div>
  )
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
````

## File: components/ui/checkbox.tsx
````typescript
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
````

## File: components/ui/drawer.tsx
````typescript
"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
````

## File: components/ui/dropdown-menu.tsx
````typescript
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
````

## File: components/ui/input.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
````

## File: components/ui/label.tsx
````typescript
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
````

## File: components/ui/select.tsx
````typescript
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
````

## File: components/ui/separator.tsx
````typescript
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
````

## File: components/ui/sheet.tsx
````typescript
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
````

## File: components/ui/sidebar.tsx
````typescript
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button"
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
````

## File: components/ui/skeleton.tsx
````typescript
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
````

## File: components/ui/sonner.tsx
````typescript
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
````

## File: components/ui/table.tsx
````typescript
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
````

## File: components/ui/tabs.tsx
````typescript
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
````

## File: components/ui/toggle-group.tsx
````typescript
"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
````

## File: components/ui/toggle.tsx
````typescript
"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
````

## File: components/ui/tooltip.tsx
````typescript
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
````

## File: components/chart-area-interactive.tsx
````typescript
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-09", desktop: 59, mobile: 110 },
  { date: "2024-04-10", desktop: 261, mobile: 190 },
  { date: "2024-04-11", desktop: 327, mobile: 350 },
  { date: "2024-04-12", desktop: 292, mobile: 210 },
  { date: "2024-04-13", desktop: 342, mobile: 380 },
  { date: "2024-04-14", desktop: 137, mobile: 220 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-16", desktop: 138, mobile: 190 },
  { date: "2024-04-17", desktop: 446, mobile: 360 },
  { date: "2024-04-18", desktop: 364, mobile: 410 },
  { date: "2024-04-19", desktop: 243, mobile: 180 },
  { date: "2024-04-20", desktop: 89, mobile: 150 },
  { date: "2024-04-21", desktop: 137, mobile: 200 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-23", desktop: 138, mobile: 230 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-04-25", desktop: 215, mobile: 250 },
  { date: "2024-04-26", desktop: 75, mobile: 130 },
  { date: "2024-04-27", desktop: 383, mobile: 420 },
  { date: "2024-04-28", desktop: 122, mobile: 180 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-04-30", desktop: 454, mobile: 380 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-02", desktop: 293, mobile: 310 },
  { date: "2024-05-03", desktop: 247, mobile: 190 },
  { date: "2024-05-04", desktop: 385, mobile: 420 },
  { date: "2024-05-05", desktop: 481, mobile: 390 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-07", desktop: 388, mobile: 300 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-09", desktop: 227, mobile: 180 },
  { date: "2024-05-10", desktop: 293, mobile: 330 },
  { date: "2024-05-11", desktop: 335, mobile: 270 },
  { date: "2024-05-12", desktop: 197, mobile: 240 },
  { date: "2024-05-13", desktop: 197, mobile: 160 },
  { date: "2024-05-14", desktop: 448, mobile: 490 },
  { date: "2024-05-15", desktop: 473, mobile: 380 },
  { date: "2024-05-16", desktop: 338, mobile: 400 },
  { date: "2024-05-17", desktop: 499, mobile: 420 },
  { date: "2024-05-18", desktop: 315, mobile: 350 },
  { date: "2024-05-19", desktop: 235, mobile: 180 },
  { date: "2024-05-20", desktop: 177, mobile: 230 },
  { date: "2024-05-21", desktop: 82, mobile: 140 },
  { date: "2024-05-22", desktop: 81, mobile: 120 },
  { date: "2024-05-23", desktop: 252, mobile: 290 },
  { date: "2024-05-24", desktop: 294, mobile: 220 },
  { date: "2024-05-25", desktop: 201, mobile: 250 },
  { date: "2024-05-26", desktop: 213, mobile: 170 },
  { date: "2024-05-27", desktop: 420, mobile: 460 },
  { date: "2024-05-28", desktop: 233, mobile: 190 },
  { date: "2024-05-29", desktop: 78, mobile: 130 },
  { date: "2024-05-30", desktop: 340, mobile: 280 },
  { date: "2024-05-31", desktop: 178, mobile: 230 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-02", desktop: 470, mobile: 410 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-04", desktop: 439, mobile: 380 },
  { date: "2024-06-05", desktop: 88, mobile: 140 },
  { date: "2024-06-06", desktop: 294, mobile: 250 },
  { date: "2024-06-07", desktop: 323, mobile: 370 },
  { date: "2024-06-08", desktop: 385, mobile: 320 },
  { date: "2024-06-09", desktop: 438, mobile: 480 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-11", desktop: 92, mobile: 150 },
  { date: "2024-06-12", desktop: 492, mobile: 420 },
  { date: "2024-06-13", desktop: 81, mobile: 130 },
  { date: "2024-06-14", desktop: 426, mobile: 380 },
  { date: "2024-06-15", desktop: 307, mobile: 350 },
  { date: "2024-06-16", desktop: 371, mobile: 310 },
  { date: "2024-06-17", desktop: 475, mobile: 520 },
  { date: "2024-06-18", desktop: 107, mobile: 170 },
  { date: "2024-06-19", desktop: 341, mobile: 290 },
  { date: "2024-06-20", desktop: 408, mobile: 450 },
  { date: "2024-06-21", desktop: 169, mobile: 210 },
  { date: "2024-06-22", desktop: 317, mobile: 270 },
  { date: "2024-06-23", desktop: 480, mobile: 530 },
  { date: "2024-06-24", desktop: 132, mobile: 180 },
  { date: "2024-06-25", desktop: 141, mobile: 190 },
  { date: "2024-06-26", desktop: 434, mobile: 380 },
  { date: "2024-06-27", desktop: 448, mobile: 490 },
  { date: "2024-06-28", desktop: 149, mobile: 200 },
  { date: "2024-06-29", desktop: 103, mobile: 160 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Visitors</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
````

## File: components/data-table.tsx
````typescript
"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: "Header",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Section Type",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.type}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "Done" ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        ) : (
          <IconLoader />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "target",
    header: () => <div className="w-full text-right">Target</div>,
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-target`} className="sr-only">
          Target
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.target}
          id={`${row.original.id}-target`}
        />
      </form>
    ),
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-full text-right">Limit</div>,
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-limit`} className="sr-only">
          Limit
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.limit}
          id={`${row.original.id}-limit`}
        />
      </form>
    ),
  },
  {
    accessorKey: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer"

      if (isAssigned) {
        return row.original.reviewer
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Reviewer
          </Label>
          <Select>
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Assign reviewer" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
              <SelectItem value="Jamik Tashpulatov">
                Jamik Tashpulatov
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      )
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="past-performance">Past Performance</SelectItem>
            <SelectItem value="key-personnel">Key Personnel</SelectItem>
            <SelectItem value="focus-documents">Focus Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>
            Showing total visitors for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Header</Label>
              <Input id="header" defaultValue={item.header} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={item.type}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Table of Contents">
                      Table of Contents
                    </SelectItem>
                    <SelectItem value="Executive Summary">
                      Executive Summary
                    </SelectItem>
                    <SelectItem value="Technical Approach">
                      Technical Approach
                    </SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Capabilities">Capabilities</SelectItem>
                    <SelectItem value="Focus Documents">
                      Focus Documents
                    </SelectItem>
                    <SelectItem value="Narrative">Narrative</SelectItem>
                    <SelectItem value="Cover Page">Cover Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="target">Target</Label>
                <Input id="target" defaultValue={item.target} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">Limit</Label>
                <Input id="limit" defaultValue={item.limit} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Reviewer</Label>
              <Select defaultValue={item.reviewer}>
                <SelectTrigger id="reviewer" className="w-full">
                  <SelectValue placeholder="Select a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                  <SelectItem value="Jamik Tashpulatov">
                    Jamik Tashpulatov
                  </SelectItem>
                  <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
````

## File: components/mode-toggle.tsx
````typescript
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
````

## File: components/nav-documents.tsx
````typescript
"use client"

import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  type Icon,
} from "@tabler/icons-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavDocuments({
  items,
}: {
  items: {
    name: string
    url: string
    icon: Icon
  }[]
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Documents</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                >
                  <IconDots />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-24 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <IconFolder />
                  <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconShare3 />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <IconTrash />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <IconDots className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
````

## File: components/nav-secondary.tsx
````typescript
"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
````

## File: components/theme-provider.tsx
````typescript
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
````

## File: hooks/use-mobile.ts
````typescript
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
````

## File: lib/utils.ts
````typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
````

## File: public/file.svg
````
<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clip-rule="evenodd" fill="#666" fill-rule="evenodd"/></svg>
````

## File: public/globe.svg
````
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g clip-path="url(#a)"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs></svg>
````

## File: public/next.svg
````
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 394 80"><path fill="#000" d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z"/><path fill="#000" d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Zm252.6-.4c-1 0-1.8-.4-2.5-1s-1.1-1.6-1.1-2.6.3-1.8 1-2.5 1.6-1 2.6-1 1.8.3 2.5 1a3.4 3.4 0 0 1 .6 4.3 3.7 3.7 0 0 1-3 1.8zm23.2-33.5h6v23.3c0 2.1-.4 4-1.3 5.5a9.1 9.1 0 0 1-3.8 3.5c-1.6.8-3.5 1.3-5.7 1.3-2 0-3.7-.4-5.3-1s-2.8-1.8-3.7-3.2c-.9-1.3-1.4-3-1.4-5h6c.1.8.3 1.6.7 2.2s1 1.2 1.6 1.5c.7.4 1.5.5 2.4.5 1 0 1.8-.2 2.4-.6a4 4 0 0 0 1.6-1.8c.3-.8.5-1.8.5-3V45.5zm30.9 9.1a4.4 4.4 0 0 0-2-3.3 7.5 7.5 0 0 0-4.3-1.1c-1.3 0-2.4.2-3.3.5-.9.4-1.6 1-2 1.6a3.5 3.5 0 0 0-.3 4c.3.5.7.9 1.3 1.2l1.8 1 2 .5 3.2.8c1.3.3 2.5.7 3.7 1.2a13 13 0 0 1 3.2 1.8 8.1 8.1 0 0 1 3 6.5c0 2-.5 3.7-1.5 5.1a10 10 0 0 1-4.4 3.5c-1.8.8-4.1 1.2-6.8 1.2-2.6 0-4.9-.4-6.8-1.2-2-.8-3.4-2-4.5-3.5a10 10 0 0 1-1.7-5.6h6a5 5 0 0 0 3.5 4.6c1 .4 2.2.6 3.4.6 1.3 0 2.5-.2 3.5-.6 1-.4 1.8-1 2.4-1.7a4 4 0 0 0 .8-2.4c0-.9-.2-1.6-.7-2.2a11 11 0 0 0-2.1-1.4l-3.2-1-3.8-1c-2.8-.7-5-1.7-6.6-3.2a7.2 7.2 0 0 1-2.4-5.7 8 8 0 0 1 1.7-5 10 10 0 0 1 4.3-3.5c2-.8 4-1.2 6.4-1.2 2.3 0 4.4.4 6.2 1.2 1.8.8 3.2 2 4.3 3.4 1 1.4 1.5 3 1.5 5h-5.8z"/></svg>
````

## File: public/vercel.svg
````
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1155 1000"><path d="m577.3 0 577.4 1000H0z" fill="#fff"/></svg>
````

## File: public/window.svg
````
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5" fill="#666"/></svg>
````

## File: .repomixignore
````
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

certificates
````

## File: components.json
````json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
````

## File: docker-compose.yml
````yaml
version: '3.8'

services:
  db:
    image: postgres:latest
    container_name: kora-db
    environment:
      POSTGRES_USER: okafrancois
      POSTGRES_PASSWORD: ok@code2024
      POSTGRES_DB: kora-db
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
````

## File: next.config.ts
````typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
````

## File: postcss.config.mjs
````
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
````

## File: repomix.config.json
````json
{
  "$schema": "https://repomix.com/schemas/latest/schema.json",
  "input": {
    "maxFileSize": 52428800
  },
  "output": {
    "filePath": "code-base.md",
    "style": "markdown",
    "parsableStyle": false,
    "fileSummary": true,
    "directoryStructure": true,
    "files": true,
    "removeComments": false,
    "removeEmptyLines": false,
    "compress": false,
    "topFilesLength": 5,
    "showLineNumbers": false,
    "copyToClipboard": false,
    "git": {
      "sortByChanges": true,
      "sortByChangesMaxCommits": 100,
      "includeDiffs": false
    }
  },
  "include": [],
  "ignore": {
    "useGitignore": true,
    "useDefaultPatterns": true,
    "customPatterns": []
  },
  "security": {
    "enableSecurityCheck": true
  },
  "tokenCount": {
    "encoding": "o200k_base"
  }
}
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
````

## File: app/layout.tsx
````typescript
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auth System",
  description: "Auth System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
````

## File: components/game-card.tsx
````typescript
import React from 'react';
import { cn } from '@/lib/utils';

// Types de cartes
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface CardProps {
  suit: Suit;
  rank: Rank;
  width?: number;
  height?: number;
  className?: string;
}

// Composant pour une carte individuelle
const PlayingCard: React.FC<CardProps> = ({ suit, rank, width = 100, height = 140, className }) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  
  // Symboles des suites
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  
  // Dessins complexes pour les figures
  const renderFaceCard = () => {
    if (rank === 'J' || rank === 'Q' || rank === 'K') {
      return (
        <g transform="translate(50, 70)">
          {/* Fond décoratif avec pattern */}
          <rect 
            x="-35" 
            y="-50" 
            width="70" 
            height="100" 
            className={cn(
              "fill-current opacity-10",
              isRed ? "text-primary" : "text-accent"
            )}
            rx="5" 
          />
          
          {/* Cadre ornementé */}
          <rect 
            x="-32" 
            y="-47" 
            width="64" 
            height="94" 
            fill="none"
            className={cn(
              "stroke-current opacity-20",
              isRed ? "text-primary" : "text-accent"
            )}
            strokeWidth="1.5"
            rx="3" 
          />
          
          {/* Motifs décoratifs élaborés */}
          <g className="opacity-30">
            {/* Lignes horizontales décoratives */}
            <path
              d="M-30,-45 L30,-45 M-30,-40 L30,-40 M-30,40 L30,40 M-30,45 L30,45"
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-accent"
              )}
              strokeWidth="1"
              fill="none"
            />
            
            {/* Cercles ornementaux */}
            <circle 
              cx="-25" 
              cy="0" 
              r="15" 
              fill="none" 
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-accent"
              )}
              strokeWidth="1" 
            />
            <circle 
              cx="25" 
              cy="0" 
              r="15" 
              fill="none" 
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-accent"
              )}
              strokeWidth="1" 
            />
            
            {/* Motifs en losange */}
            <path
              d="M0,-35 L10,-25 L0,-15 L-10,-25 Z M0,15 L10,25 L0,35 L-10,25 Z"
              fill="none"
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-accent"
              )}
              strokeWidth="0.5"
            />
          </g>
          
          {/* Figure stylisée */}
          {rank === 'K' && (
            <g>
              {/* Couronne du roi */}
              <path 
                d="M-15,-25 L-10,-20 L-5,-25 L0,-20 L5,-25 L10,-20 L15,-25 L15,-15 L-15,-15 Z" 
                className={cn(
                  "fill-current opacity-30",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              <circle cx="-10" cy="-25" r="2" className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
              <circle cx="0" cy="-25" r="2" className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
              <circle cx="10" cy="-25" r="2" className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
              
              {/* Visage stylisé */}
              <circle 
                cx="0" 
                cy="-5" 
                r="8" 
                className={cn(
                  "fill-current opacity-15",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              
              {/* Corps avec détails royaux */}
              <path
                d="M-20,5 L-15,0 L-10,5 L-10,35 L10,35 L10,5 L15,0 L20,5"
                fill="none"
                className={cn(
                  "stroke-current opacity-40",
                  isRed ? "text-primary" : "text-accent"
                )}
                strokeWidth="1.5"
              />
              
              {/* Symbole du pouvoir */}
              <circle cx="0" cy="20" r="5" fill="none" 
                className={cn("stroke-current opacity-30", isRed ? "text-primary" : "text-accent")} 
                strokeWidth="1" />
              <text 
                x="0" 
                y="23" 
                textAnchor="middle" 
                fontSize="8" 
                className={cn(
                  "fill-current opacity-50",
                  isRed ? "text-primary" : "text-accent"
                )}
              >
                {suitSymbols[suit]}
              </text>
              
              <text 
                x="0" 
                y="50" 
                textAnchor="middle" 
                fontSize="24" 
                className={cn(
                  "fill-current font-bold",
                  isRed ? "text-primary" : "text-accent"
                )}
              >
                K
              </text>
            </g>
          )}
          
          {rank === 'Q' && (
            <g>
              {/* Coiffe de la reine */}
              <path 
                d="M-12,-22 Q0,-28 12,-22 L12,-15 Q0,-20 -12,-15 Z" 
                className={cn(
                  "fill-current opacity-30",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              <circle cx="0" cy="-25" r="3" className={cn("fill-current opacity-50", isRed ? "text-primary" : "text-accent")} />
              
              {/* Visage avec élégance */}
              <circle 
                cx="0" 
                cy="-5" 
                r="8" 
                className={cn(
                  "fill-current opacity-15",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              
              {/* Robe élaborée */}
              <path
                d="M-15,5 Q-10,0 -5,5 L-8,35 L8,35 L5,5 Q10,0 15,5"
                fill="none"
                className={cn(
                  "stroke-current opacity-40",
                  isRed ? "text-primary" : "text-accent"
                )}
                strokeWidth="1.5"
              />
              
              {/* Collier */}
              <ellipse cx="0" cy="10" rx="8" ry="3" fill="none" 
                className={cn("stroke-current opacity-30", isRed ? "text-primary" : "text-accent")} 
                strokeWidth="1" />
              
              {/* Fleur décorative */}
              <g transform="translate(0, 20)">
                <circle cx="0" cy="0" r="2" className={cn("fill-current opacity-20", isRed ? "text-primary" : "text-accent")} />
                <circle cx="-4" cy="-2" r="2" className={cn("fill-current opacity-15", isRed ? "text-primary" : "text-accent")} />
                <circle cx="4" cy="-2" r="2" className={cn("fill-current opacity-15", isRed ? "text-primary" : "text-accent")} />
                <circle cx="-4" cy="2" r="2" className={cn("fill-current opacity-15", isRed ? "text-primary" : "text-accent")} />
                <circle cx="4" cy="2" r="2" className={cn("fill-current opacity-15", isRed ? "text-primary" : "text-accent")} />
              </g>
              
              <text 
                x="0" 
                y="50" 
                textAnchor="middle" 
                fontSize="24" 
                className={cn(
                  "fill-current font-bold",
                  isRed ? "text-primary" : "text-accent"
                )}
              >
                Q
              </text>
            </g>
          )}
          
          {rank === 'J' && (
            <g>
              {/* Chapeau du valet */}
              <path 
                d="M-10,-20 L-8,-25 Q0,-28 8,-25 L10,-20 L5,-15 L-5,-15 Z" 
                className={cn(
                  "fill-current opacity-30",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              <circle cx="7" cy="-22" r="2" className={cn("fill-current opacity-40", isRed ? "text-primary" : "text-accent")} />
              
              {/* Visage jeune */}
              <circle 
                cx="0" 
                cy="-5" 
                r="8" 
                className={cn(
                  "fill-current opacity-15",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              
              {/* Tunique avec détails */}
              <path
                d="M-12,5 L-10,0 L-8,5 L-10,35 L10,35 L8,5 L10,0 L12,5"
                fill="none"
                className={cn(
                  "stroke-current opacity-40",
                  isRed ? "text-primary" : "text-accent"
                )}
                strokeWidth="1.5"
              />
              
              {/* Ceinture */}
              <rect x="-10" y="15" width="20" height="3" 
                className={cn("fill-current opacity-20", isRed ? "text-primary" : "text-accent")} />
              
              {/* Épée stylisée */}
              <g transform="translate(15, 10) rotate(45)">
                <rect x="-1" y="0" width="2" height="15" className={cn("fill-current opacity-30", isRed ? "text-primary" : "text-accent")} />
                <rect x="-3" y="-2" width="6" height="3" className={cn("fill-current opacity-40", isRed ? "text-primary" : "text-accent")} />
              </g>
              
              <text 
                x="0" 
                y="50" 
                textAnchor="middle" 
                fontSize="24" 
                className={cn(
                  "fill-current font-bold",
                  isRed ? "text-primary" : "text-accent"
                )}
              >
                J
              </text>
            </g>
          )}
        </g>
      );
    }
    return null;
  };
  
  // Disposition des symboles pour les cartes numériques
  const renderPips = () => {
    const positions: Record<string, Array<{x: number, y: number}>> = {
      'A': [{x: 50, y: 70}],
      '2': [{x: 50, y: 30}, {x: 50, y: 110}],
      '3': [{x: 50, y: 30}, {x: 50, y: 70}, {x: 50, y: 110}],
      '4': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 30, y: 110}, {x: 70, y: 110}],
      '5': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 50, y: 70}, {x: 30, y: 110}, {x: 70, y: 110}],
      '6': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 30, y: 70}, {x: 70, y: 70}, {x: 30, y: 110}, {x: 70, y: 110}],
      '7': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 50, y: 50}, {x: 30, y: 70}, {x: 70, y: 70}, {x: 30, y: 110}, {x: 70, y: 110}],
      '8': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 50, y: 50}, {x: 30, y: 70}, {x: 70, y: 70}, {x: 50, y: 90}, {x: 30, y: 110}, {x: 70, y: 110}],
      '9': [{x: 30, y: 25}, {x: 70, y: 25}, {x: 30, y: 50}, {x: 70, y: 50}, {x: 50, y: 70}, {x: 30, y: 90}, {x: 70, y: 90}, {x: 30, y: 115}, {x: 70, y: 115}],
      '10': [{x: 30, y: 25}, {x: 70, y: 25}, {x: 50, y: 40}, {x: 30, y: 55}, {x: 70, y: 55}, {x: 30, y: 85}, {x: 70, y: 85}, {x: 50, y: 100}, {x: 30, y: 115}, {x: 70, y: 115}],
    };
    
    const pips = positions[rank] || [];
    
    return pips.map((pos, index) => (
      <text
        key={index}
        x={pos.x}
        y={pos.y}
        fontSize={rank === 'A' ? 40 : 20}
        className={cn(
          "fill-current",
          isRed ? "text-primary" : "text-accent"
        )}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {suitSymbols[suit]}
      </text>
    ));
  };
  
  return (
    <div className={cn("playing-card", className)}>
      <svg width={width} height={height} viewBox="0 0 100 140" className="w-full h-full">
        {/* Fond de carte avec texture et patterns */}
        <defs>
          {/* Pattern de texture */}
          <pattern id={`cardTexture-${suit}-${rank}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" className="fill-card" />
            <rect width="2" height="2" className="fill-card/95" />
          </pattern>
          
          {/* Gradient pour profondeur */}
          <linearGradient id={`cardGradient-${suit}-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="text-card/90" stopColor="currentColor" />
            <stop offset="50%" className="text-card" stopColor="currentColor" />
            <stop offset="100%" className="text-card/80" stopColor="currentColor" />
          </linearGradient>
          
          {/* Pattern décoratif pour les bordures */}
          <pattern id={`borderPattern-${suit}-${rank}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" className={cn("fill-current opacity-20", isRed ? "text-primary" : "text-accent")} />
            <circle cx="8" cy="8" r="1" className={cn("fill-current opacity-20", isRed ? "text-primary" : "text-accent")} />
          </pattern>
          
          {/* Ombre portée */}
          <filter id={`cardShadow-${suit}-${rank}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="1" dy="2" result="offsetblur"/>
            <feFlood floodColor="#000000" floodOpacity="0.15"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Ombre de carte */}
        <rect
          x="1"
          y="2"
          width="98"
          height="138"
          rx="8"
          className="fill-black/10"
        />
        
        {/* Carte principale avec gradient */}
        <rect
          x="0"
          y="0"
          width="100"
          height="140"
          rx="8"
          fill={`url(#cardGradient-${suit}-${rank})`}
          className="stroke-border"
          strokeWidth="1"
          filter={`url(#cardShadow-${suit}-${rank})`}
        />
        
        {/* Bordure décorative extérieure */}
        <rect
          x="2"
          y="2"
          width="96"
          height="136"
          rx="7"
          fill="none"
          className={cn(
            "stroke-current opacity-40",
            isRed ? "text-primary" : "text-accent"
          )}
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        
        {/* Bordure intérieure avec pattern */}
        <rect
          x="4"
          y="4"
          width="92"
          height="132"
          rx="6"
          fill={`url(#borderPattern-${suit}-${rank})`}
          className={cn(
            "stroke-current opacity-30",
            isRed ? "text-primary" : "text-accent"
          )}
          strokeWidth="0.5"
        />
        
        {/* Motifs décoratifs aux coins */}
        <g className="opacity-10">
          <path d="M10,10 L25,10 L25,8 L10,8 Z M10,10 L10,25 L8,25 L8,10 Z" 
            className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
          <path d="M75,10 L90,10 L90,8 L75,8 Z M90,10 L90,25 L92,25 L92,10 Z" 
            className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
          <path d="M10,130 L25,130 L25,132 L10,132 Z M10,130 L10,115 L8,115 L8,130 Z" 
            className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
          <path d="M75,130 L90,130 L90,132 L75,132 Z M90,130 L90,115 L92,115 L92,130 Z" 
            className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
        </g>

        {/* Coins supérieur gauche et inférieur droit */}
        <g>
          {/* Coin supérieur gauche avec fond décoratif */}
          <g>
            <rect x="5" y="12" width="20" height="25" rx="3" 
              className={cn("fill-current opacity-5", isRed ? "text-primary" : "text-accent")} />
            <text 
              x="10" 
              y="20" 
              fontSize="16" 
              className={cn(
                "fill-current font-bold",
                isRed ? "text-primary" : "text-accent"
              )}
            >
              {rank}
            </text>
            <text 
              x="10" 
              y="32" 
              fontSize="14" 
              className={cn(
                "fill-current",
                isRed ? "text-primary" : "text-accent"
              )}
            >
              {suitSymbols[suit]}
            </text>
          </g>
          
          {/* Coin inférieur droit (inversé) avec fond décoratif */}
          <g transform="rotate(180, 50, 70)">
            <rect x="5" y="12" width="20" height="25" rx="3" 
              className={cn("fill-current opacity-5", isRed ? "text-primary" : "text-accent")} />
            <text 
              x="10" 
              y="20" 
              fontSize="16" 
              className={cn(
                "fill-current font-bold",
                isRed ? "text-primary" : "text-accent"
              )}
            >
              {rank}
            </text>
            <text 
              x="10" 
              y="32" 
              fontSize="14" 
              className={cn(
                "fill-current",
                isRed ? "text-primary" : "text-accent"
              )}
            >
              {suitSymbols[suit]}
            </text>
          </g>
        </g>
        
        {/* Contenu central */}
        {rank === 'J' || rank === 'Q' || rank === 'K' ? renderFaceCard() : renderPips()}
      </svg>
    </div>
  );
};

// Composant pour le dos de carte
const CardBack: React.FC<{ width?: number; height?: number; className?: string }> = ({ 
  width = 100, 
  height = 140,
  className 
}) => {
  return (
    <div className={cn("playing-card", className)}>
      <svg width={width} height={height} viewBox="0 0 100 140" className="w-full h-full">
        <defs>
          {/* Pattern répétitif pour le fond */}
          <pattern id="cardBackPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" className="fill-primary" />
            <circle cx="10" cy="10" r="8" className="fill-primary/90" />
            <circle cx="10" cy="10" r="6" className="fill-primary/80" />
            <circle cx="10" cy="10" r="4" className="fill-secondary/20" />
            <rect x="9" y="2" width="2" height="16" className="fill-secondary/30" />
            <rect x="2" y="9" width="16" height="2" className="fill-secondary/30" />
          </pattern>
          
          {/* Gradient pour bordure */}
          <linearGradient id="backBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="text-secondary" stopColor="currentColor" />
            <stop offset="50%" className="text-secondary/80" stopColor="currentColor" />
            <stop offset="100%" className="text-secondary" stopColor="currentColor" />
          </linearGradient>
        </defs>
        
        {/* Bordure extérieure */}
        <rect x="0" y="0" width="100" height="140" rx="8" fill="url(#backBorderGradient)" />
        
        {/* Fond avec pattern */}
        <rect x="4" y="4" width="92" height="132" rx="6" fill="url(#cardBackPattern)" />
        
        {/* Cadre intérieur décoratif */}
        <rect x="8" y="8" width="84" height="124" rx="5" fill="none" 
          className="stroke-secondary/50" strokeWidth="1" strokeDasharray="2 1" />
        
        {/* Motif central élaboré */}
        <g transform="translate(50, 70)">
          {/* Étoile à 8 branches */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <g key={angle} transform={`rotate(${angle})`}>
              <path d="M0,0 L0,-30 L2,-25 L0,-20 L-2,-25 Z" className="fill-secondary/60" />
            </g>
          ))}
          
          {/* Cercles concentriques */}
          <circle r="30" fill="none" className="stroke-secondary" strokeWidth="2" />
          <circle r="25" fill="none" className="stroke-secondary/80" strokeWidth="1" />
          <circle r="20" fill="none" className="stroke-secondary/60" strokeWidth="1" />
          <circle r="15" fill="none" className="stroke-secondary/40" strokeWidth="0.5" />
          
          {/* Médaillon central */}
          <circle r="12" className="fill-primary" />
          <circle r="10" className="fill-secondary/20" />
          
          <text 
            x="0" 
            y="5" 
            textAnchor="middle" 
            fontSize="14" 
            className="fill-secondary font-bold"
          >
            241
          </text>
        </g>
        
        {/* Ornements aux coins */}
        {[[10, 10], [90, 10], [10, 130], [90, 130]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <circle r="6" className="fill-secondary" />
            <circle r="4" className="fill-primary" />
            <circle r="2" className="fill-secondary/50" />
          </g>
        ))}
        
        {/* Fioritures décoratives sur les bords */}
        <g className="opacity-30">
          <path d="M20,5 Q30,10 40,5 M60,5 Q70,10 80,5" className="stroke-secondary" strokeWidth="0.5" fill="none" />
          <path d="M20,135 Q30,130 40,135 M60,135 Q70,130 80,135" className="stroke-secondary" strokeWidth="0.5" fill="none" />
          <path d="M5,30 Q10,40 5,50 M5,90 Q10,100 5,110" className="stroke-secondary" strokeWidth="0.5" fill="none" />
          <path d="M95,30 Q90,40 95,50 M95,90 Q90,100 95,110" className="stroke-secondary" strokeWidth="0.5" fill="none" />
        </g>
      </svg>
    </div>
  );
};

// Composant principal affichant tout le jeu
const FullDeck: React.FC = () => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  return (
    <div className="p-5 bg-background">
      <h2 className="text-center mb-5 text-2xl font-bold text-foreground">
        Jeu de cartes complet - 52 cartes
      </h2>
      
      {suits.map(suit => (
        <div key={suit} className="mb-8">
          <h3 className={cn(
            "mb-4 text-xl font-semibold capitalize",
            suit === 'hearts' || suit === 'diamonds' ? "text-primary" : "text-accent"
          )}>
            {suit === 'hearts' ? '♥ Cœurs' : 
             suit === 'diamonds' ? '♦ Carreaux' :
             suit === 'clubs' ? '♣ Trèfles' :
             '♠ Piques'}
          </h3>
          
          <div className="game-grid">
            {ranks.map(rank => (
              <div key={`${suit}-${rank}`} className="flex justify-center card-shadow">
                <PlayingCard suit={suit} rank={rank} />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Dos de carte bonus */}
      <div className="mt-10 text-center">
        <h3 className="mb-4 text-xl font-semibold text-secondary">Dos de carte</h3>
        <div className="inline-block card-shadow-lg">
          <CardBack />
        </div>
      </div>
    </div>
  );
};

export { PlayingCard, CardBack, FullDeck };
export default FullDeck;
````

## File: components/nav-main.tsx
````typescript
"use client";

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url}>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
````

## File: components/section-cards.tsx
````typescript
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-bl *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card ">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance increase <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>
  );
}
````

## File: components/site-header.tsx
````typescript
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/Achour/nextjs-better-auth"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
````

## File: lib/auth.ts
````typescript
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { username } from "better-auth/plugins"

const prisma = new PrismaClient();

const options = {
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: true,
        unique: true,
      },
      role: {
        type: ['USER', 'ADMIN', 'MODERATOR'] as const,
        required: true,
      },
      phoneNumber: {
        type: 'string',
        required: true,
        unique: true,
      },
    },
  },
  plugins: [
    nextCookies(),
     username({
      minUsernameLength: 4
     }) 
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
});

export type Session = typeof auth.$Infer.Session;
````

## File: lib/prisma.ts
````typescript
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
````

## File: prisma/schema.prisma
````
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime
  user                  user      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime
  updatedAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      user     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Role {
  USER
  ADMIN
  MODERATOR
}

model user {
  id                  String    @id
  name                String
  username            String    @unique
  displayUsername     String?
  role                Role      @default(USER)
  email               String    @unique
  emailVerified       Boolean
  phoneNumber         String?   @unique
  phoneNumberVerified Boolean   @default(false)
  image               String?
  createdAt           DateTime
  updatedAt           DateTime
  account             account[]
  session             session[]

  @@index([email])
  @@index([phoneNumber])
  @@index([username])
}

model verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?
}
````

## File: app/api/auth/[...all]/route.ts
````typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
````

## File: components/auth/login-form.tsx
````typescript
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";

import { IconLoader } from "@tabler/icons-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();

    const { data, error } = await authClient.signIn.username(
      {
        username,
        password,
        rememberMe: false,
      },
      {
        onRequest: (ctx) => {
          setLoading(true);
        },
        onSuccess: (ctx) => {
          router.push("/dashboard");
        },
        onError: (ctx) => {
          // display the error message
          setError(ctx.error.message);
          setLoading(false);
        },
      }
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Se connecter à votre compte</CardTitle>
          <CardDescription>
            Entrez votre nom d'utilisateur et votre mot de passe pour vous connecter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border border-red-500" variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                  id="username"
                  type="text"
                  placeholder="achour_meguenni"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Mot de passe</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Mot de passe oublié?
                  </a>
                </div>
                <Input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  id="password"
                  type="password"
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button disabled={loading} type="submit" className="w-full">
                  {loading ? (
                    <IconLoader className="animate-spin" stroke={2} />
                  ) : (
                    "Se connecter"
                  )}
                </Button>
                <Button variant="outline" className="w-full">
                  Se connecter avec Google
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Vous n&apos;avez pas de compte?{" "}
              <a href="/signup" className="underline underline-offset-4">
                Créer un compte
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
````

## File: components/auth/signup-form.tsx
````typescript
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";

import { IconLoader } from "@tabler/icons-react";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();

    const { data, error } = await authClient.signUp.email(
      {
        username,
        /**
         * The user email
         */
        email,
        /**
         * The user password
         */
        password,
        /**
         * remember the user session after the browser is closed.
         * @default true
         */
        name: fullname,
        role: "USER",
        phoneNumber: ""
      },
      {
        onRequest: (ctx) => {
          setLoading(true);
        },
        onSuccess: (ctx) => {
          // redirect to the dashboard
          //alert("Logged in successfully");
          router.push("/dashboard");
        },
        onError: (ctx) => {
          // display the error message
          setError(ctx.error.message);
          setLoading(false);
        },
      }
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>Créer un compte pour commencer</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border border-red-500" variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setFullname(e.target.value);
                  }}
                  value={username}
                  id="username"
                  type="text"
                  placeholder="achour_meguenni"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  id="email"
                  type="email"
                  placeholder="me@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Mot de passe</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Mot de passe oublié?
                  </a>
                </div>
                <Input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  id="password"
                  type="password"
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button disabled={loading} type="submit" className="w-full">
                  {loading ? (
                    <IconLoader className="animate-spin" stroke={2} />
                  ) : (
                    "Créer un compte"
                  )}
                </Button>
                <Button variant="outline" className="w-full">
                  Créer un compte avec Google
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Vous avez déjà un compte?{" "}
              <a href="/login" className="underline underline-offset-4">
                Se connecter
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
````

## File: components/nav-user.tsx
````typescript
"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Session } from "@/lib/auth";
import LogoutButton from "./auth/logout-button";

export function NavUser({ user }: { user: Session["user"] }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
                  <AvatarFallback className="rounded-lg uppercase">
                    {user.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Mon compte
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <IconLogout />
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
````

## File: lib/auth-client.ts
````typescript
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins"
import { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});
````

## File: .gitignore
````
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

certificates
code-base.md
````

## File: package.json
````json
{
  "name": "better-auth-nextjs-prisma-ts",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --experimental-https --port 4000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:start": "docker-compose up -d",
    "db:stop": "docker-compose down",
    "db:restart": "docker-compose down && docker-compose up -d",
    "db:logs": "docker-compose logs -f"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/modifiers": "^9.0.0",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@prisma/client": "^6.9.0",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toggle": "^1.1.2",
    "@radix-ui/react-toggle-group": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@tabler/icons-react": "^3.31.0",
    "@tanstack/react-table": "^8.21.2",
    "better-auth": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.483.0",
    "next": "15.2.3",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.1",
    "sonner": "^2.0.1",
    "tailwind-merge": "^3.0.2",
    "tw-animate-css": "^1.2.4",
    "vaul": "^1.1.2",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20.17.25",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "prisma": "^6.9.0",
    "tailwindcss": "^4",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}
````

## File: app/api/route.ts
````typescript
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json("ok");
}
````

## File: components/app-sidebar.tsx
````typescript
"use client";

import * as React from "react";
import {
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
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

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Account",
      url: "/dashboard/account",
      icon: IconUserCircle,
    },
    {
      title: "Setting",
      url: "/dashboard/setting",
      icon: IconSettings,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Home",
      url: "/",
      icon: IconHome,
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
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Tableau de bord</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
````

## File: middleware.ts
````typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from login/signup pages
  if (sessionCookie && ["/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users trying to access protected routes
  /**if (!sessionCookie && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }*/

  return NextResponse.next();
}

const protectedRoutes = ["/dashboard"];

export const config = {
  matcher: ["/dashboard", "/login", "/signup"],
};
````

## File: README.md
````markdown
# Next.js + Better Auth + Prisma Starter Kit

🚀 A starter kit for building modern web applications with **Next.js 15**, **Better Auth**, **Prisma**, and **shadcn/ui**.

🔗 **[Live Demo](https://nextjs-better-auth-starterkit.vercel.app)**

## 📌 Features

- ✅ **Next.js 15** with App Router
- ✅ **Better Auth** for authentication
- ✅ **Prisma** for database management
- ✅ **shadcn/ui** for UI components
- ✅ **Dashboard** for authenticated users
- ✅ TypeScript support

## 📦 Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Achour/nextjs-better-auth.git
   cd nextjs-better-auth
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables:

   ```sh
   cp .env.example .env
   ```

   Fill in the necessary values in the `.env` file.

4. Set up the database:

   ```sh
   npx prisma migrate dev
   ```

5. Start the development server:
   ```sh
   npm run dev
   ```

## 🚀 Usage

- Run `npm run dev` to start the development server.
- Use `npx prisma studio` to manage your database visually.
- Customize authentication using Better Auth settings.

## 🛠️ Tech Stack

- **Next.js 15** - React framework
- **Better Auth** - Authentication
- **Prisma** - Database ORM
- **shadcn/ui** - UI components
- **TypeScript** - Type safety

---

Made with ❤️ by [Achour Meguenni](https://github.com/Achour)
````

## File: app/globals.css
````css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.5rem;
  /* Fond crème inspiré des cartes de jeu traditionnelles */
  --background: oklch(0.98 0.01 70);
  --foreground: oklch(0.15 0.02 40);
  /* Cartes avec texture papier */
  --card: oklch(0.99 0.005 60);
  --card-foreground: oklch(0.2 0.02 40);
  --popover: oklch(0.99 0.005 60);
  --popover-foreground: oklch(0.2 0.02 40);
  /* Rouge des cartes #B4443E */
  --primary: oklch(0.52 0.18 25);
  --primary-foreground: oklch(0.99 0 0);
  /* Marron #A68258 */
  --secondary: oklch(0.62 0.08 65);
  --secondary-foreground: oklch(0.15 0.02 40);
  /* Tons neutres avec une touche chaude */
  --muted: oklch(0.92 0.02 70);
  --muted-foreground: oklch(0.45 0.02 40);
  /* Accent marron clair pour les hovers et sélections */
  --accent: oklch(0.88 0.04 65);
  --accent-foreground: oklch(0.15 0.02 40);
  /* Rouge vif pour les alertes */
  --destructive: oklch(0.5 0.3 25);
  /* Bordures marron clair */
  --border: oklch(0.85 0.03 65);
  --input: oklch(0.94 0.01 70);
  --ring: oklch(0.52 0.18 25);
  /* Couleurs pour graphiques inspirées des couleurs choisies */
  --chart-1: oklch(0.52 0.18 25);  /* Rouge #B4443E */
  --chart-2: oklch(0.62 0.08 65);  /* Marron #A68258 */
  --chart-3: oklch(0.45 0.05 230); /* Bleu #465D74 */
  --chart-4: oklch(0.65 0.18 160); /* Vert émeraude */
  --chart-5: oklch(0.6 0.15 45);   /* Orange terre */
  /* Sidebar avec style carte de jeu */
  --sidebar: oklch(0.97 0.01 70);
  --sidebar-foreground: oklch(0.15 0.02 40);
  --sidebar-primary: oklch(0.52 0.18 25);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.92 0.02 70);
  --sidebar-accent-foreground: oklch(0.15 0.02 40);
  --sidebar-border: oklch(0.85 0.03 65);
  --sidebar-ring: oklch(0.52 0.18 25);
}

.dark {
  /* Fond sombre bleu nuit avec texture */
  --background: oklch(0.12 0.02 230);
  --foreground: oklch(0.95 0.01 70);
  /* Cartes avec effet velours sombre */
  --card: oklch(0.16 0.03 230);
  --card-foreground: oklch(0.95 0.01 70);
  --popover: oklch(0.16 0.03 230);
  --popover-foreground: oklch(0.95 0.01 70);
  /* Rouge des cartes lumineux #B4443E */
  --primary: oklch(0.58 0.22 25);
  --primary-foreground: oklch(0.98 0.01 70);
  /* Marron doré #A68258 */
  --secondary: oklch(0.68 0.10 65);
  --secondary-foreground: oklch(0.12 0.02 230);
  /* Tons neutres sombres */
  --muted: oklch(0.25 0.02 230);
  --muted-foreground: oklch(0.65 0.02 70);
  /* Accent marron sombre pour les hovers */
  --accent: oklch(0.35 0.05 65);
  --accent-foreground: oklch(0.95 0.01 70);
  /* Rouge alerte lumineux */
  --destructive: oklch(0.6 0.35 20);
  /* Bordures bleu profond */
  --border: oklch(0.3 0.03 230);
  --input: oklch(0.2 0.02 230);
  --ring: oklch(0.58 0.22 25);
  /* Graphiques aux couleurs vives */
  --chart-1: oklch(0.58 0.22 25);  /* Rouge #B4443E */
  --chart-2: oklch(0.68 0.10 65);  /* Marron #A68258 */
  --chart-3: oklch(0.55 0.08 230); /* Bleu #465D74 */
  --chart-4: oklch(0.5 0.15 165);  /* Vert jade */
  --chart-5: oklch(0.65 0.18 45);  /* Orange ambré */
  /* Sidebar style velours */
  --sidebar: oklch(0.14 0.02 230);
  --sidebar-foreground: oklch(0.95 0.01 70);
  --sidebar-primary: oklch(0.58 0.22 25);
  --sidebar-primary-foreground: oklch(0.98 0.01 70);
  --sidebar-accent: oklch(0.2 0.02 230);
  --sidebar-accent-foreground: oklch(0.95 0.01 70);
  --sidebar-border: oklch(0.3 0.03 230);
  --sidebar-ring: oklch(0.58 0.22 25);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  
  /* Configuration mobile-first */
  html {
    -webkit-tap-highlight-color: transparent;
    -webkit-text-size-adjust: 100%;
    font-size: 16px; /* Évite le zoom sur iOS */
  }
  
  body {
    @apply bg-background text-foreground;
    /* Ajout d'une texture subtile inspirée des cartes */
    background-image: 
      radial-gradient(circle at 25% 25%, oklch(0.52 0.18 25 / 0.03) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, oklch(0.62 0.08 65 / 0.02) 0%, transparent 50%);
    /* Optimisations mobile */
    overscroll-behavior: contain;
    touch-action: pan-y;
    min-height: 100vh;
    min-height: -webkit-fill-available;
  }
  
  .dark body {
    background-image: 
      radial-gradient(circle at 25% 25%, oklch(0.58 0.22 25 / 0.05) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, oklch(0.68 0.10 65 / 0.03) 0%, transparent 50%);
  }
  
  /* Typography mobile-first */
  h1 { @apply text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl; }
  h2 { @apply text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl; }
  h3 { @apply text-lg font-semibold sm:text-xl lg:text-2xl; }
  h4 { @apply text-base font-semibold sm:text-lg; }
  p { @apply text-sm sm:text-base leading-relaxed; }
  
  /* Focus styles pour mobile */
  :focus-visible {
    @apply outline-2 outline-offset-2 outline-ring;
  }
  
  /* Désactiver les effets de sélection sur mobile */
  @media (max-width: 768px) {
    * {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    input, textarea {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
  }
}

@layer components {
  .container {
    @apply mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl;
  }
  
  /* Composants UI personnalisés pour mobile */
  
  /* Boutons optimisés pour le tactile */
  [data-slot="button"] {
    @apply min-h-[44px] min-w-[44px];
    touch-action: manipulation;
  }
  
  [data-slot="button"]:active {
    @apply scale-[0.98] transition-transform duration-75;
  }
  
  /* Cards avec padding mobile-first */
  [data-slot="card"] {
    @apply rounded-lg sm:rounded-xl;
  }
  
  [data-slot="card-header"],
  [data-slot="card-content"],
  [data-slot="card-footer"] {
    @apply px-4 sm:px-6;
  }
  
  /* Inputs optimisés mobile */
  [data-slot="input"],
  [data-slot="select-trigger"],
  [data-slot="textarea"] {
    @apply min-h-[44px] text-base; /* 16px empêche le zoom sur iOS */
  }
  
  /* Dialogs/Sheets mobile-first */
  [data-slot="dialog-content"],
  [data-slot="sheet-content"] {
    @apply max-h-[90vh] overflow-y-auto;
  }
  
  /* Drawer pour mobile (plein écran) */
  @media (max-width: 640px) {
    [data-slot="drawer-content"] {
      @apply h-[95vh] rounded-t-2xl;
    }
  }
  
  /* Tables responsive */
  [data-slot="table-container"] {
    @apply -mx-4 sm:mx-0;
  }
  
  [data-slot="table"] {
    @apply text-xs sm:text-sm;
  }
  
  /* Badges et pills */
  [data-slot="badge"] {
    @apply text-xs px-2 py-0.5 sm:px-2.5 sm:py-1;
  }
  
  /* Dropdown menus avec taille minimale pour mobile */
  [data-slot="dropdown-menu-content"] {
    @apply min-w-[200px] sm:min-w-[220px];
  }
  
  [data-slot="dropdown-menu-item"] {
    @apply min-h-[40px] text-sm sm:text-base;
  }
  
  /* Tabs mobile-friendly */
  [data-slot="tabs-list"] {
    @apply w-full justify-start overflow-x-auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  [data-slot="tabs-list"]::-webkit-scrollbar {
    display: none;
  }
  
  [data-slot="tabs-trigger"] {
    @apply min-w-[100px] flex-shrink-0;
  }
  
  /* Toast/Sonner position mobile */
  .toaster {
    @apply !bottom-16 sm:!bottom-4;
  }
  
  /* Sidebar mobile (plein écran) */
  @media (max-width: 768px) {
    [data-slot="sidebar"] {
      @apply w-full;
    }
  }
  
  /* Effets spéciaux pour les cartes de jeu */
  .card-game-effect {
    @apply relative overflow-hidden rounded-lg sm:rounded-xl;
    background: linear-gradient(135deg, var(--card) 0%, oklch(from var(--card) calc(l - 0.02) c h) 100%);
    box-shadow: 
      0 1px 3px 0 oklch(0 0 0 / 0.1),
      0 1px 2px -1px oklch(0 0 0 / 0.1),
      inset 0 1px 1px 0 oklch(1 0 0 / 0.1);
  }
  
  .dark .card-game-effect {
    background: linear-gradient(135deg, var(--card) 0%, oklch(from var(--card) calc(l + 0.02) c h) 100%);
    box-shadow: 
      0 1px 3px 0 oklch(0 0 0 / 0.3),
      0 1px 2px -1px oklch(0 0 0 / 0.2),
      inset 0 1px 1px 0 oklch(1 0 0 / 0.05);
  }
  
  /* Boutons style jetons de casino */
  .btn-chip {
    @apply relative min-h-[48px] px-6;
    background: radial-gradient(circle at 30% 30%, oklch(from var(--primary) calc(l + 0.1) c h) 0%, var(--primary) 60%);
    box-shadow: 
      inset 0 2px 4px 0 oklch(1 0 0 / 0.2),
      0 2px 4px 0 oklch(0 0 0 / 0.2);
  }
  
  /* Zone de mise mobile */
  .betting-zone {
    @apply bg-card/80 backdrop-blur-sm rounded-xl p-4 border-2 border-dashed border-secondary/50;
  }
  
  /* Cartes de jeu */
  .playing-card {
    @apply relative aspect-[2/3] w-16 sm:w-20 lg:w-24 rounded-lg shadow-lg transition-all duration-200;
    @apply hover:scale-105 active:scale-95;
  }
  
  /* Animation pour les gains */
  @keyframes coin-flip {
    0%, 100% { transform: rotateY(0deg); }
    50% { transform: rotateY(180deg); }
  }
  
  .win-animation {
    animation: coin-flip 0.6s ease-in-out;
  }
  
  /* Effet de brillance marron */
  .gold-shine {
    @apply relative overflow-hidden;
  }
  
  .gold-shine::after {
    content: '';
    @apply absolute inset-0 -translate-x-full;
    background: linear-gradient(
      90deg,
      transparent,
      oklch(0.62 0.08 65 / 0.3),
      transparent
    );
    animation: shine 3s infinite;
  }
  
  @keyframes shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  
  /* Safe area pour iOS */
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }
  
  /* Utilitaires pour mobile */
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  /* Touch manipulation pour les éléments interactifs */
  .touch-manipulation {
    touch-action: manipulation;
  }
  
  /* Grille de jeu responsive */
  .game-grid {
    @apply grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4;
  }
  
  /* Espacements mobiles */
  .space-y-mobile {
    @apply space-y-3 sm:space-y-4 lg:space-y-6;
  }
  
  .gap-mobile {
    @apply gap-3 sm:gap-4 lg:gap-6;
  }
  
  /* Animations performantes (GPU) */
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  /* État de chargement */
  .skeleton-pulse {
    @apply animate-pulse bg-muted;
  }
  
  /* Overlay pour modals mobile */
  .modal-overlay {
    @apply fixed inset-0 bg-background/80 backdrop-blur-sm z-50;
  }
  
  /* Bottom sheet mobile */
  .bottom-sheet {
    @apply fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl;
    padding-bottom: env(safe-area-inset-bottom);
    animation: slideUp 0.3s ease-out;
  }
  
  /* Floating action button */
  .fab {
    @apply fixed bottom-4 right-4 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-lg;
    @apply flex items-center justify-center;
    @apply active:scale-95 transition-transform;
    margin-bottom: env(safe-area-inset-bottom);
  }
  
  /* État désactivé personnalisé */
  .disabled {
    @apply opacity-50 pointer-events-none;
  }
  
  /* Texte tronqué */
  .truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Ombres personnalisées pour les cartes */
  .card-shadow {
    box-shadow: 
      0 1px 3px 0 rgb(0 0 0 / 0.1),
      0 1px 2px -1px rgb(0 0 0 / 0.1);
  }
  
  .card-shadow-lg {
    box-shadow: 
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
  }
  
  /* Animation de défilement infini */
  @keyframes slide-infinite {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
  
  .animate-slide-infinite {
    animation: slide-infinite 20s linear infinite;
    display: flex;
    gap: 1rem;
  }
  
  @keyframes slide-infinite-reverse {
    0% {
      transform: translateX(-50%);
    }
    100% {
      transform: translateX(0);
    }
  }
  
  .animate-slide-infinite-reverse {
    animation: slide-infinite-reverse 25s linear infinite;
    display: flex;
    gap: 1.5rem;
  }
  
  /* Dupliquer le contenu pour l'effet infini */
  .animate-slide-infinite::after {
    content: '';
    display: flex;
    gap: 1rem;
  }
  
  /* Animations flottantes pour les particules */
  @keyframes float-slow {
    0%, 100% {
      transform: translateY(0) translateX(0);
    }
    33% {
      transform: translateY(-10px) translateX(5px);
    }
    66% {
      transform: translateY(5px) translateX(-5px);
    }
  }
  
  @keyframes float-medium {
    0%, 100% {
      transform: translateY(0) translateX(0);
    }
    50% {
      transform: translateY(-15px) translateX(-10px);
    }
  }
  
  @keyframes float-fast {
    0%, 100% {
      transform: translateY(0) translateX(0);
    }
    25% {
      transform: translateY(-5px) translateX(5px);
    }
    50% {
      transform: translateY(-10px) translateX(-5px);
    }
    75% {
      transform: translateY(-5px) translateX(5px);
    }
  }
  
  .animate-float-slow {
    animation: float-slow 6s ease-in-out infinite;
  }
  
  .animate-float-medium {
    animation: float-medium 4s ease-in-out infinite;
  }
  
  .animate-float-fast {
    animation: float-fast 3s ease-in-out infinite;
  }
}
````

## File: app/page.tsx
````typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PlayingCard, CardBack } from "@/components/game-card";
import {
  IconCards,
  IconCoin,
  IconTrophy,
  IconDeviceMobile,
  IconShieldCheck,
  IconUsersGroup,
  IconSparkles,
  IconChevronRight,
  IconMenu2,
} from "@tabler/icons-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
              <IconCards className="size-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LaMap241</span>
          </div>
          
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon">
                <IconMenu2 className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[350px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/login">
                  <Button variant="outline" className="w-full">Se connecter</Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full">Commencer à jouer</Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop menu */}
          <nav className="hidden sm:flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Se connecter</Button>
            </Link>
            <Link href="/signup">
              <Button>Commencer à jouer</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-12 lg:py-24 overflow-x-hidden lg:overflow-visible">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content côté gauche */}
          <div className="text-center lg:text-left space-y-6">
            {/* Badge */}
            <Badge variant="outline" className="px-4 py-1.5 mx-auto lg:mx-0">
              <IconSparkles className="mr-1 size-3" />
              Jeu de cartes en ligne
            </Badge>

            {/* Titre principal */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              Le duel de cartes <span className="text-primary">épique</span> vous attend !
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground sm:text-xl lg:text-2xl max-w-xl mx-auto lg:mx-0">
              Devenez maître du Garame ! Affrontez des joueurs, misez de l'argent réel
              et remportez des gains instantanés dans ce jeu de cartes stratégique.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/signup">
                <Button size="lg" className="btn-chip w-full sm:w-auto gap-2 lg:text-lg lg:px-8 lg:py-6">
                  Jouer maintenant
                  <IconChevronRight className="size-4 lg:size-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto lg:text-lg lg:px-8 lg:py-6">
                Voir les règles
              </Button>
            </div>

            {/* Stats rapides */}
            <div className="flex gap-6 justify-center lg:justify-start pt-6">
              <div>
                <p className="text-2xl font-bold text-primary">10K+</p>
                <p className="text-sm text-muted-foreground">Joueurs actifs</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <p className="text-2xl font-bold text-primary">4.8/5</p>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
              </div>
            </div>
          </div>

          {/* Cartes preview côté droit - grandes sur tous les appareils */}
          <div className="relative h-[350px]  lg:h-[600px] overflow-visible">
            {/* Cartes en éventail */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Carte arrière gauche */}
              <div className="absolute transform -rotate-[25deg] -translate-x-24 sm:-translate-x-32 hover:rotate-[-20deg] hover:-translate-y-4 transition-all duration-300 z-10">
                <div className="w-[180px] h-[252px]">
                  <PlayingCard suit="diamonds" rank="Q" width={180} height={252} className="w-full h-full shadow-2xl" />
                </div>
              </div>
              
              {/* Carte gauche */}
              <div className="absolute transform -rotate-12 -translate-x-12 sm:-translate-x-16 hover:rotate-[-8deg] hover:-translate-y-4 transition-all duration-300 z-20">
                <div className="w-[180px] h-[252px]">
                  <PlayingCard suit="hearts" rank="K" width={180} height={252} className="w-full h-full shadow-2xl" />
                </div>
              </div>
              
              {/* Carte centrale (dos) */}
              <div className="absolute transform rotate-0 scale-110 hover:scale-125 hover:-translate-y-4 transition-all duration-300 z-30">
                <div className="w-[198px] h-[277px]">
                  <CardBack width={198} height={277} className="w-full h-full shadow-2xl" />
                </div>
              </div>
              
              {/* Carte droite */}
              <div className="absolute transform rotate-12 translate-x-12 sm:translate-x-16 hover:rotate-[8deg] hover:-translate-y-4 transition-all duration-300 z-20">
                <div className="w-[180px] h-[252px]">
                  <PlayingCard suit="spades" rank="A" width={180} height={252} className="w-full h-full shadow-2xl" />
                </div>
              </div>
              
              {/* Carte arrière droite */}
              <div className="absolute transform rotate-[25deg] translate-x-24 sm:translate-x-32 hover:rotate-[20deg] hover:-translate-y-4 transition-all duration-300 z-10">
                <div className="w-[180px] h-[252px]">
                  <PlayingCard suit="clubs" rank="J" width={180} height={252} className="w-full h-full shadow-2xl" />
                </div>
              </div>
            </div>
            
            {/* Effets de brillance animés */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 lg:w-64 lg:h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            </div>
            
            {/* Particules flottantes */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float-slow" />
              <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-primary/60 rounded-full animate-float-medium" />
              <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-primary/40 rounded-full animate-float-fast" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl lg:text-5xl font-bold mb-4">
            Entrez dans l'arène ultime !
          </h2>
          <p className="text-center text-lg lg:text-xl text-muted-foreground mb-12 lg:mb-16 max-w-3xl mx-auto">
            Découvrez tout ce qui fait de LaMap241 l'expérience de jeu de cartes ultime
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-game-effect group hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                <CardContent className="p-6 lg:p-8 text-center">
                  <div className="mb-4 inline-flex size-14 lg:size-16 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="size-7 lg:size-8" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm lg:text-base text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Game Preview Section */}
      <section className="border-y bg-muted/30 py-12 lg:py-24 overflow-hidden">
        <div className="container px-4">
          <h2 className="text-center text-3xl lg:text-5xl font-bold mb-4">Découvrez nos cartes uniques</h2>
          <p className="text-center text-lg lg:text-xl text-muted-foreground mb-12 lg:mb-16 max-w-3xl mx-auto">
            Chaque carte est conçue avec soin pour vous offrir une expérience de jeu authentique et immersive
          </p>
          
          {/* Carrousel infini sur desktop et mobile */}
          <div className="relative space-y-6">
            {/* Première ligne */}
            <div className="relative">
              <div className="flex gap-4 lg:gap-6 overflow-hidden">
                <div className="flex gap-4 lg:gap-6 animate-slide-infinite">
                  {/* Pattern: 2 face cards, 1 back card */}
                  <PlayingCard suit="hearts" rank="A" width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  <PlayingCard suit="diamonds" rank="K" width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  <CardBack width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  
                  <PlayingCard suit="clubs" rank="Q" width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  <PlayingCard suit="spades" rank="J" width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  <CardBack width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  
                  <PlayingCard suit="hearts" rank="10" width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  <PlayingCard suit="diamonds" rank="9" width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  <CardBack width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  
                  {/* Duplicate for seamless loop */}
                  <PlayingCard suit="hearts" rank="A" width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  <PlayingCard suit="diamonds" rank="K" width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                  <CardBack width={120} height={168} className="flex-shrink-0 lg:w-[140px] lg:h-[196px] hover:scale-105 transition-transform" />
                </div>
              </div>
              
              {/* Gradient de fondu sur les côtés */}
              <div className="absolute inset-y-0 left-0 w-20 lg:w-32 bg-gradient-to-r from-muted/30 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-20 lg:w-32 bg-gradient-to-l from-muted/30 to-transparent pointer-events-none" />
            </div>
            
            {/* Deuxième ligne sur desktop */}
            <div className="relative hidden lg:block">
              <div className="flex gap-6 overflow-hidden">
                <div className="flex gap-6 animate-slide-infinite-reverse">
                  {/* Pattern inversé */}
                  <CardBack width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  <PlayingCard suit="spades" rank="A" width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  <PlayingCard suit="clubs" rank="K" width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  
                  <CardBack width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  <PlayingCard suit="hearts" rank="Q" width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  <PlayingCard suit="diamonds" rank="J" width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  
                  <CardBack width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  <PlayingCard suit="clubs" rank="10" width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  <PlayingCard suit="spades" rank="9" width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  
                  {/* Duplicate for seamless loop */}
                  <CardBack width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  <PlayingCard suit="spades" rank="A" width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                  <PlayingCard suit="clubs" rank="K" width={140} height={196} className="flex-shrink-0 hover:scale-105 transition-transform" />
                </div>
              </div>
              
              {/* Gradient de fondu sur les côtés */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-muted/30 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-muted/30 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50 py-12 lg:py-24">
        <div className="container px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16 text-center max-w-6xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2 group">
                <p className="text-3xl lg:text-5xl font-bold text-primary transition-transform group-hover:scale-110">{stat.value}</p>
                <p className="text-sm lg:text-base text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container px-4 py-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl lg:text-5xl font-bold mb-4">Comment ça marche ?</h2>
          <p className="text-center text-lg lg:text-xl text-muted-foreground mb-12 lg:mb-16 max-w-3xl mx-auto">
            Commencez à jouer en quelques minutes seulement
          </p>
          
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Étapes à gauche */}
            <div className="space-y-6 lg:space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4 items-start group">
                  <div className="flex size-12 lg:size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg lg:text-xl group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg lg:text-xl mb-2">{step.title}</h3>
                    <p className="text-sm lg:text-base text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Carte bonus à droite */}
            <div className="lg:sticky lg:top-24 h-fit">
              <Card className="betting-zone relative overflow-hidden">
                <CardContent className="p-8 lg:p-10 text-center space-y-6">
                  {/* Cartes décoratives en arrière-plan */}
                  <div className="absolute top-0 left-0 opacity-10 -rotate-45 -translate-x-1/2 -translate-y-1/2">
                    <PlayingCard suit="diamonds" rank="A" width={180} height={252} />
                  </div>
                  <div className="absolute bottom-0 right-0 opacity-10 rotate-45 translate-x-1/2 translate-y-1/2">
                    <PlayingCard suit="hearts" rank="K" width={180} height={252} />
                  </div>
                  
                  <IconCoin className="size-16 lg:size-20 mx-auto text-primary relative z-10" />
                  <h3 className="text-2xl lg:text-3xl font-bold relative z-10">Bonus de bienvenue</h3>
                  <p className="text-3xl lg:text-4xl font-bold text-primary relative z-10">500 FCFA</p>
                  <p className="text-base lg:text-lg text-muted-foreground relative z-10">
                    Créez votre compte et recevez immédiatement 500 FCFA pour tester la plateforme !
                  </p>
                  <Link href="/signup">
                    <Button size="lg" className="w-full gold-shine relative z-10 text-lg">
                      Récupérer mon bonus
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-mobile">
          <h2 className="text-center text-3xl font-bold">Questions fréquentes</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16">
        <Card className="card-game-effect overflow-hidden">
          <CardContent className="p-8 sm:p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">
              Prêt à commencer l'aventure ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Rejoignez des milliers de joueurs et montrez vos talents de stratège.
              L'arène vous attend !
            </p>
            <Link href="/signup">
              <Button size="lg" className="btn-chip gap-2">
                Créer mon compte gratuitement
                <IconChevronRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <IconCards className="size-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">LaMap241</span>
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                Règles du jeu
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Conditions
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2024 LaMap241. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Data
const features = [
  {
    icon: IconTrophy,
    title: "Gains instantanés",
    description: "Remportez vos gains immédiatement après chaque victoire"
  },
  {
    icon: IconDeviceMobile,
    title: "Mobile Money",
    description: "Dépôts et retraits faciles via Airtel Money et Moov Money"
  },
  {
    icon: IconShieldCheck,
    title: "100% Sécurisé",
    description: "Plateforme sécurisée avec anti-triche intégré"
  },
  {
    icon: IconUsersGroup,
    title: "Multijoueur",
    description: "Affrontez des joueurs du monde entier en temps réel"
  }
];

const stats = [
  { value: "10K+", label: "Joueurs actifs" },
  { value: "50K+", label: "Parties jouées" },
  { value: "5M", label: "FCFA distribués" },
  { value: "4.8/5", label: "Note moyenne" }
];

const steps = [
  {
    title: "Créez votre compte",
    description: "Inscription rapide avec votre numéro de téléphone"
  },
  {
    title: "Rechargez votre solde",
    description: "Utilisez Mobile Money pour ajouter des fonds en quelques secondes"
  },
  {
    title: "Choisissez votre mise",
    description: "Créez ou rejoignez une partie avec la mise de votre choix"
  },
  {
    title: "Remportez la victoire",
    description: "Gagnez et retirez vos gains instantanément sur votre compte"
  }
];

const faqs = [
  {
    question: "Comment retirer mes gains ?",
    answer: "Les retraits sont instantanés via Mobile Money. Allez dans votre portefeuille, cliquez sur 'Retirer' et suivez les instructions."
  },
  {
    question: "Quel est le montant minimum de mise ?",
    answer: "Vous pouvez commencer à jouer avec une mise minimum de 100 FCFA."
  },
  {
    question: "Le jeu est-il légal ?",
    answer: "Oui, LaMap241 opère dans le respect de la législation en vigueur concernant les jeux d'argent en ligne."
  }
];
````
