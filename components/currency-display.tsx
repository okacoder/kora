import { IconCoin } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  koras: number;
  fcfa: number;
  size?: "compact" | "normal" | "large";
  showIcon?: boolean;
  className?: string;
}

export function CurrencyDisplay({ 
  koras, 
  fcfa, 
  size = "normal", 
  showIcon = true,
  className 
}: CurrencyDisplayProps) {
  const sizeClasses = {
    compact: "text-game-xs",
    normal: "text-game-sm",
    large: "text-game-base"
  };

  return (
    <div className={cn("currency-chip", sizeClasses[size], className)}>
      {showIcon && <IconCoin className="h-3.5 w-3.5" />}
      <div className="flex flex-col">
        <span className="font-bold">{koras.toLocaleString()}</span>
        <span className="opacity-70 text-[0.7em]">
          {fcfa.toLocaleString()} FCFA
        </span>
      </div>
    </div>
  );
}