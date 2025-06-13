import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      <section className="container px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-4xl text-center space-y-mobile">
          {/* Badge */}
          <Badge variant="outline" className="mb-4 px-4 py-1.5">
            <IconSparkles className="mr-1 size-3" />
            Jeu de cartes africain en ligne
          </Badge>

          {/* Titre principal */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Le duel de cartes <span className="text-primary">épique</span><br />
            vous attend !
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Devenez maître du Garame ! Affrontez des joueurs, misez de l'argent réel
            et remportez des gains instantanés dans ce jeu de cartes stratégique.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="btn-chip w-full sm:w-auto gap-2">
                Jouer maintenant
                <IconChevronRight className="size-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Voir les règles
            </Button>
          </div>

          {/* Cartes preview */}
          <div className="relative pt-8 pb-4">
            <div className="flex justify-center items-center -space-x-8">
              <div className="playing-card transform -rotate-12 card-game-effect z-10">
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary-foreground">J♦</span>
                </div>
              </div>
              <div className="playing-card transform rotate-0 card-game-effect z-20 scale-110">
                <div className="w-full h-full bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                  <span className="text-4xl font-bold text-secondary-foreground">K♠</span>
                </div>
              </div>
              <div className="playing-card transform rotate-12 card-game-effect z-10">
                <div className="w-full h-full bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center">
                  <span className="text-4xl font-bold text-accent-foreground">Q♥</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold mb-12">
            Entrez dans l'arène ultime !
          </h2>
          
          <div className="game-grid">
            {features.map((feature, index) => (
              <Card key={index} className="card-game-effect group hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50 py-12">
        <div className="container px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-mobile">
          <h2 className="text-center text-3xl font-bold">Comment ça marche ?</h2>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Card className="betting-zone mt-8">
            <CardContent className="p-6 text-center space-y-4">
              <IconCoin className="size-12 mx-auto text-primary" />
              <h3 className="text-xl font-semibold">Bonus de bienvenue</h3>
              <p className="text-2xl font-bold text-primary">500 FCFA</p>
              <p className="text-sm text-muted-foreground">
                Créez votre compte et recevez immédiatement 500 FCFA pour tester la plateforme !
              </p>
              <Link href="/signup">
                <Button className="w-full sm:w-auto gold-shine">
                  Récupérer mon bonus
                </Button>
              </Link>
            </CardContent>
          </Card>
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