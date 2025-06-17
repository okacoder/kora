"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconH1, IconLoader } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

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
    <div className="flex justify-center px-4 lg:px-6 py-8">
      <Card className="w-full max-w-xl rounded-lg shadow-sm border">
        <CardHeader>
          <h1 className="text-lg font-semibold">Paramètres du compte</h1>
          <p className="text-sm text-muted-foreground mb-2">
            Modifiez vos informations de compte
          </p>
          <Separator className="mb-4" />
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  onChange={(e) => setFullname(e.target.value)}
                  value={fullname}
                  id="name"
                  type="text"
                  placeholder="Achour Meguenni"
                  required
                  className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                  id="username"
                  type="text"
                  placeholder="achour_meguenni"
                  required
                  className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  id="email"
                  type="email"
                  placeholder="me@example.com"
                  required
                  className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button disabled={loading} type="submit" className="w-full min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40">
                {loading ? (
                  <IconLoader className="animate-spin align-middle inline-block" stroke={2} />
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Mot de passe oublié?{" "}
              <a href="/login" className="underline underline-offset-4">
                Réinitialiser le mot de passe
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
