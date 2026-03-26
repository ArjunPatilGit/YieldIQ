
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update basic profile in Auth
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // Send verification email
      await sendEmailVerification(user);

      // Create UserProfile document in Firestore
      // This allows admins to see user details (excluding passwords) in the Firebase Console
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        preferredLanguage: "en",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Account Created",
        description: "A verification email has been sent to your inbox.",
      });

      router.push("/verify-email");
    } catch (error: any) {
      let errorMessage = "Could not create account.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please try signing in instead.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please use at least 6 characters.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }

      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Leaf className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold font-headline">YieldIQ</span>
          </Link>
        </div>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join YieldIQ to start optimizing your harvest with AI.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input 
                    id="first-name" 
                    placeholder="Anil" 
                    required 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input 
                    id="last-name" 
                    placeholder="Kumar" 
                    required 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Min. 6 characters"
                  required 
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 p-2 bg-primary/5 rounded border border-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>By signing up, you agree to our Terms and Privacy Policy.</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
