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
      <Card className="border-primary/20 shadow-2xl backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-bold text-center">Rejoignez LaMap241</CardTitle>
          <CardDescription className="text-center">
            Créez votre compte et recevez 500 FCFA de bonus pour commencer
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
                <Label htmlFor="password">Mot de passe</Label>
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
