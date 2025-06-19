import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";

export default async function Page() {
  return (
    <div className="flex justify-center px-4 lg:px-6 py-8">
      <Card className="w-full max-w-md rounded-lg shadow-sm border">
        <CardHeader>
          <h1 className="text-lg font-semibold">Paramètres</h1>
          <p className="text-sm text-muted-foreground mb-2">
            Choisissez vos préférences d'apparence.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <ModeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}