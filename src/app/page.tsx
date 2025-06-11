
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Bot, CheckSquare, Github, Palette } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GitConsistentLogo } from '@/components/icons/git-consistent-logo';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <GitConsistentLogo className="h-8 w-8 text-primary" />
          <span className="font-headline">GitConsistent</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/signin">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signin">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary/15 via-background to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight mb-6">
              Build Better Habits, <span className="text-primary">Achieve Your Goals.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              GitConsistent helps you track your progress, stay consistent, and get personalized coaching to transform your life, one habit at a time.
            </p>
            <Button size="lg" asChild className="shadow-lg hover:shadow-primary/30 transition-shadow">
              <Link href="/signin">
                Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <div className="mt-16">
              <Image
                src="https://placehold.co/1200x600.png"
                alt="GitConsistent dashboard preview"
                width={1200}
                height={600}
                className="rounded-lg shadow-2xl mx-auto"
                data-ai-hint="dashboard graph"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
              Why GitConsistent?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-in-out">
                <CardHeader className="items-center text-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-4">
                    <CheckSquare className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-xl">Visual Habit Tracking</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Visualize your progress with a GitHub-style contribution graph. Stay motivated by seeing your streaks grow.
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-in-out">
                <CardHeader className="items-center text-center">
                   <div className="p-3 bg-accent/10 rounded-full mb-4">
                    <Bot className="h-10 w-10 text-accent" />
                  </div>
                  <CardTitle className="font-headline text-xl">AI-Powered Coach</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Get personalized tips and insights from our AI habit coach to improve consistency and overcome challenges.
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-in-out">
                <CardHeader className="items-center text-center">
                   <div className="p-3 bg-primary/10 rounded-full mb-4">
                    <Palette className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-xl">Customizable Themes</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Switch between light and dark modes for a comfortable viewing experience, day or night.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Call to Action Section */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">
              Ready to Transform Your Habits?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Join GitConsistent today and take the first step towards a more productive and fulfilling life.
            </p>
            <Button size="lg" asChild className="shadow-lg hover:shadow-primary/30 transition-shadow">
              <Link href="/signin">
                Sign Up for Free
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GitConsistent. All rights reserved.</p>
          <p className="text-sm mt-1">
            Built with <GitConsistentLogo className="inline h-4 w-4 text-primary" /> and <Github className="inline h-4 w-4" />.
          </p>
        </div>
      </footer>
    </div>
  );
}
