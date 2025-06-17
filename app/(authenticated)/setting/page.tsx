import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { ModeToggle } from "@/components/mode-toggle";

export default async function Page() {
  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-lg font-medium">Paramètres</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Choisissez vos préférences d'apparence.
        </p>
        <ModeToggle />
      </div>
    </>
  );
}
