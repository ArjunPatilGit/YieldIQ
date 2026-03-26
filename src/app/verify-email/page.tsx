"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { sendEmailVerification, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft, RefreshCw, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { user, isUserLoading } = useUser();
  const [isResending, setIsResending] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
    if (!isUserLoading && user?.emailVerified) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleResend = async () => {
    if (!user) return;
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and spam folder.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resend verification email.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold font-headline">Verify Your Email</CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a verification link to <span className="font-semibold text-foreground">{user?.email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Please click the link in the email to activate your YieldIQ account. You'll need to refresh this page after verifying.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                I've Verified My Email
              </Button>
              <Button 
                onClick={handleResend} 
                variant="outline" 
                className="w-full"
                disabled={isResending}
              >
                {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Resend Verification Email
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out and try another email
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
