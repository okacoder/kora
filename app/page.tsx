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