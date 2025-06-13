import { SignupForm } from "@/components/auth/signup-form";
import { PlayingCard, CardBack } from "@/components/game-card";
import Link from "next/link";
import { IconCards } from "@tabler/icons-react";

export default function Page() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background overflow-hidden relative">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-50 p-6">
                <Link href="/" className="flex items-center gap-2 w-fit">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                        <IconCards className="size-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold">LaMap241</span>
                </Link>
            </header>

            {/* Cartes décoratives flottantes */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Carte en haut à gauche */}
                <div className="absolute top-20 left-10 transform -rotate-12 opacity-20 lg:opacity-30">
                    <PlayingCard suit="clubs" rank="A" width={120} height={168} className="lg:w-[180px] lg:h-[252px]" />
                </div>
                
                {/* Carte en haut à droite */}
                <div className="absolute top-32 right-10 transform rotate-12 opacity-20 lg:opacity-30">
                    <CardBack width={120} height={168} className="lg:w-[180px] lg:h-[252px]" />
                </div>
                
                {/* Carte en bas à gauche */}
                <div className="absolute bottom-20 left-20 transform rotate-6 opacity-20 lg:opacity-30">
                    <PlayingCard suit="hearts" rank="Q" width={120} height={168} className="lg:w-[180px] lg:h-[252px]" />
                </div>
                
                {/* Carte en bas à droite */}
                <div className="absolute bottom-32 right-20 transform -rotate-6 opacity-20 lg:opacity-30">
                    <PlayingCard suit="spades" rank="K" width={120} height={168} className="lg:w-[180px] lg:h-[252px]" />
                </div>
                
                {/* Carte cachée sur mobile, visible sur desktop */}
                <div className="hidden lg:block absolute top-1/2 right-20 transform rotate-45 opacity-20">
                    <PlayingCard suit="diamonds" rank="J" width={180} height={252} />
                </div>
            </div>

            {/* Effets de brillance */}
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-pulse" />

            {/* Particules flottantes */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-primary/60 rounded-full animate-float-slow" />
                <div className="absolute bottom-2/3 left-1/3 w-3 h-3 bg-primary/40 rounded-full animate-float-medium" />
                <div className="absolute top-2/3 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-float-fast" />
            </div>

            {/* Formulaire d'inscription */}
            <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 relative z-10">
                <div className="w-full max-w-sm">
                    <SignupForm />
                </div>
            </div>
        </div>
    );
}
