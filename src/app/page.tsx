'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { signInWithEmail, signInWithGoogle } from "@/supabase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "@/supabase";
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking } from "@/supabase/non-blocking-updates";
import { User } from "@/lib/types";


const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);


  const onSubmit = async (data: LoginFormValues) => {
    try {
      const { data: authData, error } = await signInWithEmail(data.email, data.password);

      if (error) {
        let description = "An unexpected error occurred. Please try again.";
        if (error.message.includes('Invalid login credentials')) {
          description = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message) {
          description = error.message;
        }

        toast({
          variant: "destructive",
          title: "Login Failed",
          description: description,
        });
        return;
      }

      if (authData.user) {
        toast({
          title: "Logged In!",
          description: "Redirecting to your dashboard.",
        });
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await signInWithGoogle();

      if (error) {
        if (error.message.includes('not enabled')) {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Google Sign-In is not enabled for this project. Please contact an administrator.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Google Sign-in Failed",
            description: error.message || "Could not sign in with Google. Please try again.",
          });
        }
        return;
      }

      // User profile will be created by auth state change listener
      toast({
        title: "Logged In with Google!",
        description: "Redirecting to your dashboard.",
      });
    } catch (error: any) {
      console.error("Google Sign-in Error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-in Failed",
        description: "Could not sign in with Google. Please try again.",
      });
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Redirecting...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold font-headline">Campus Hub</CardTitle>
            </div>
            <CardDescription>
              Sign in to your account to access events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <Link
                          href="#"
                          className="ml-auto inline-block text-sm underline"
                        >
                          Forgot your password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input id="password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} type="button">
                  Login with Google
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
