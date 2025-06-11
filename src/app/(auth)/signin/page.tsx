
"use client";

import { Button } from "@/components/ui/button";
import { Github, Target, Zap, BarChartBig, BookHeart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithPopup, type AuthError } from "firebase/auth";
import { auth, githubProvider, googleProvider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { GitConsistentLogo } from '@/components/icons/git-consistent-logo';
import { FlipWords } from "@/components/ui/flip-words";

const GoogleLogoSvg = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

const features = [
  {
    icon: Target,
    title: "Goal Tracking",
    description: "Set meaningful goals and track your progress with beautiful, motivating visualizations.",
  },
  {
    icon: Zap,
    title: "Streak Power",
    description: "Build momentum with powerful streak tracking and gentle reminders that keep you going.",
  },
  {
    icon: BarChartBig,
    title: "Deep Analytics",
    description: "Understand your patterns with detailed insights and personalized recommendations.",
  },
  {
    icon: BookHeart,
    title: "Reflective Journaling",
    description: "Capture thoughts and moods, then receive AI summaries to foster self-awareness.",
  }
];

const flipWordsArray = ["Consistency", "Discipline", "Betterment"];

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async (provider: typeof googleProvider | typeof githubProvider, providerName: string) => {
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (error) {
      const authError = error as AuthError; 
      console.error(`${providerName} Sign-in error:`, authError.code, authError.message);
      
      if (authError.code === "auth/popup-closed-by-user" || authError.code === "auth/cancelled-popup-request") {
        toast({
          title: "Sign-in Popup Issue",
          description: `The ${providerName} sign-in popup was closed or blocked. Please try the following: 1. Check if your browser is blocking pop-ups and allow them for this site. 2. Temporarily disable ad blockers or privacy extensions. 3. Ensure your browser isn't blocking third-party cookies.`,
          variant: "destructive",
          duration: 9000, 
        });
      } else if (authError.code === "auth/account-exists-with-different-credential") {
         toast({
          title: "Account Exists",
          description: "An account already exists with the same email address but different sign-in credentials. Try signing in with the original method.",
          variant: "destructive",
          duration: 9000,
        });
      }
      else {
        toast({
          title: "Sign-in Error",
          description: `Could not sign in with ${providerName}. Error: ${authError.message || authError.code}. Please try again or check your network connection.`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-slate-100">
      <main className="flex-1 grid md:grid-cols-5 min-h-screen"> {/* Changed to md:grid-cols-5 */}
        {/* Left Panel - Designed for Excellence */}
        <div className="hidden md:flex md:col-span-3 flex-col items-center justify-center p-10 bg-black text-slate-100 md:border-r md:border-slate-700"> {/* Changed to md:col-span-3 */}
          <div className="w-full max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-headline font-bold mb-3 text-center">
              Designed for <FlipWords words={flipWordsArray} className="text-primary" />
            </h2>
            <p className="text-lg text-slate-400 mb-12 text-center">
              Build lasting habits, one day at a time. Your journey to consistency starts here.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature) => (
                <div 
                  key={feature.title} 
                  className="bg-black border border-slate-700 p-6 rounded-xl shadow-lg flex flex-col items-start transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1.5"
                >
                  <div className="p-3 bg-primary/20 rounded-lg mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-50 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="md:col-span-2 flex flex-col p-6 sm:p-8 overflow-y-auto"> {/* Changed to md:col-span-2 */}
          <div className="w-full max-w-sm space-y-6 m-auto">
            <div className="flex flex-col items-center justify-center mb-8">
              <Link href="/" className="flex items-center gap-2 text-3xl font-bold text-primary mb-3">
                <GitConsistentLogo className="h-10 w-10 text-primary" />
                <span className="font-headline">GitConsistent</span>
              </Link>
            </div>

            <div className="text-center">
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-100">Sign In</h1>
              <p className="text-sm text-slate-400 mt-2">
                Choose your preferred method to continue.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                variant="default" 
                className="w-full bg-transparent border border-slate-600 text-slate-200 hover:bg-slate-800 hover:border-slate-500" 
                onClick={() => handleSignIn(googleProvider, "Google")}
              >
                <GoogleLogoSvg /> 
                Sign in with Google
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-slate-500">
                  Or continue with
                </span>
              </div>
            </div>

            <Button 
              variant="default" 
              className="w-full bg-transparent border border-slate-600 text-slate-200 hover:bg-slate-800 hover:border-slate-500" 
              onClick={() => handleSignIn(githubProvider, "GitHub")}
            >
              <Github className="mr-2 h-4 w-4" />
              Sign in with GitHub
            </Button>

            <p className="px-0 sm:px-8 text-center text-xs text-slate-500">
              By clicking continue, you agree to our{" "}
              <Link
                href="#" 
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#" 
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
