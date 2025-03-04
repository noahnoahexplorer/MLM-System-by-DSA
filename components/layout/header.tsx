"use client";

import { Button } from "@/components/ui/button";
import { LogOut, KeyRound, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { ChangePasswordDialog } from "@/components/ui/change-password-dialog";

export default function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    setIsSigningOut(true);
    console.log("Sign out button clicked");
    
    try {
      toast({
        title: "Signing out",
        description: "Please wait...",
      });
      
      // Set a timeout to force redirect if signOut takes too long
      const timeoutId = setTimeout(() => {
        console.log("Sign out timeout - forcing redirect");
        window.location.href = '/login';
      }, 3000);
      
      await signOut();
      
      // Clear the timeout if signOut completes normally
      clearTimeout(timeoutId);
      
      // Force a hard navigation to ensure we're fully logged out
      window.location.href = '/login';
    } catch (error) {
      console.error("Error during sign out:", error);
      setIsSigningOut(false);
      toast({
        title: "Error",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 sm:px-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mr-2">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Profit Buddies</span>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <div className="flex items-center gap-2 mr-4">
            {/* Change Password Button */}
            <ChangePasswordDialog 
              trigger={
                <Button variant="ghost" size="icon">
                  <KeyRound className="h-5 w-5" />
                  <span className="sr-only">Change Password</span>
                </Button>
              } 
            />

            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}