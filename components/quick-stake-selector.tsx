import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickStakeSelectorProps {
  stakes: number[];
  selectedStake: number | null;
  onSelectStake: (stake: number) => void;
  userBalance: number;
  className?: string;
}

export function QuickStakeSelector({
  stakes,
  selectedStake,
  onSelectStake,
  userBalance,
  className
}: QuickStakeSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-game-xs text-muted-foreground font-medium">Mise rapide</p>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {stakes.map((stake) => {
          const canAfford = stake * 10 <= userBalance;
          const isSelected = selectedStake === stake;
          
          return (
            <Button
              key={stake}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectStake(stake)}
              disabled={!canAfford}
              className={cn(
                "h-8 text-game-xs font-medium",
                isSelected && "ring-2 ring-offset-2 ring-primary"
              )}
            >
              {stake}
            </Button>
          );
        })}
      </div>
    </div>
  );
}