"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChromeIcon, GithubIcon } from "lucide-react"; // Using ChromeIcon as a stand-in for Google

export function SignInButtons() {
  const router = useRouter();

  const handleSignIn = async (provider: typeof googleProvider | typeof githubProvider) => {
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (error) {
      console.error("Sign-in error:", error);
      // Handle error (e.g., show a toast message)
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSignIn(googleProvider)}
      >
        <ChromeIcon className="mr-2 h-5 w-5" />
        Sign in with Google
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSignIn(githubProvider)}
      >
        <GithubIcon className="mr-2 h-5 w-5" />
        Sign in with GitHub
      </Button>
    </div>
  );
}
