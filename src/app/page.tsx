
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, CheckSquare, Bot, BarChart3, Github } from "lucide-react";
import Link from "next/link";
import { GitConsistentLogo } from '@/components/icons/git-consistent-logo';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <GitConsistentLogo className="h-7 w-7 text-primary" />
          <span>GitConsistent</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/signin">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signin">
              Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 md:py-36">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-5 leading-[1.08]">
              Build better habits.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-10">
              Track consistency with a contribution graph, get AI coaching, and make progress visible.
            </p>
            <Button size="lg" asChild>
              <Link href="/signin">
                Start tracking <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features — plain columns, no cards */}
        <section className="py-16 md:py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              <div>
                <CheckSquare className="h-5 w-5 text-foreground mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Contribution graph</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize consistency with a GitHub-style heatmap for every habit you track.
                </p>
              </div>
              <div>
                <Bot className="h-5 w-5 text-foreground mb-3" />
                <h3 className="font-semibold text-foreground mb-1">AI coaching</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized advice from an AI coach that understands your patterns.
                </p>
              </div>
              <div>
                <BarChart3 className="h-5 w-5 text-foreground mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Weekly insights</h3>
                <p className="text-sm text-muted-foreground">
                  Automated reviews that surface what is working and where to adjust.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 border-t">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to start?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Free to use. Sign in and add your first habit in under a minute.
            </p>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signin">
                Sign up free
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} GitConsistent</p>
        </div>
      </footer>
    </div>
  );
}
