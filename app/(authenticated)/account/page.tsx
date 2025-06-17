"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconLoader } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { useUserService } from "@/hooks/useInjection";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const { user, loading: userLoading, refreshUser } = useUser();
  const userService = useUserService();

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullname(user.name || "");
      setEmail(user.email || "");
      setUsername(user.username || "");
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setLoading(true);
      setError("");
      
      await userService.updateUserProfile(user.id, {
        name: fullname,
        username: username,
      });
      
      await refreshUser();
      toast.success("Profil mis à jour avec succès");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || !user) {
    return (
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
    );
  }

  return (
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
          <form onSubmit={handleUpdate} className="space-y-6">
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
                  disabled={loading}
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
                  disabled={loading}
                  className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  value={email}
                  id="email"
                  type="email"
                  placeholder="me@example.com"
                  disabled
                  className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40 bg-muted"
                />
              </div>
            </div>

            <Separator />

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Statistiques</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{user.koras}</p>
                  <p className="text-sm text-muted-foreground">Koras</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.totalWins}</p>
                  <p className="text-sm text-muted-foreground">Victoires</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.totalGames}</p>
                  <p className="text-sm text-muted-foreground">Parties</p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex flex-col gap-3">
              <Button disabled={loading} type="submit" className="w-full min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40">
                {loading ? (
                  <>
                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
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