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

import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";

import { IconLoader } from "@tabler/icons-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const redirectUrl = useSearchParams().get("redirect");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();

    await authClient.signIn.username(
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
          setLoading(false);
          router.push(redirectUrl || "/");
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
      <Card className="border-primary/20 shadow-2xl backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-bold text-center">Bienvenue sur LaMap241</CardTitle>
          <CardDescription className="text-center">
            Connectez-vous pour rejoindre l'arène et défier les meilleurs joueurs
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
                <Button disabled={loading} type="submit" className="w-full btn-chip">
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
