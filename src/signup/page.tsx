'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { signUpWithEmail, signInWithGoogle } from "@/supabase/auth";
import { setDocumentNonBlocking } from "@/supabase/non-blocking-updates";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "@/supabase";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["student", "club_organizer"], { required_error: "Please select a role." }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    }
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);
  

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const { data: authData, error: authError } = await signUpWithEmail(data.email, data.password);

      if (authError) {
        let description = "An unexpected error occurred. Please try again.";
        if (authError.message.includes('already registered')) {
          description = "This email address is already in use by another account.";
        } else if (authError.message) {
          description = authError.message;
        }

        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: description,
        });
        return;
      }

      if (authData.user) {
        const finalRole = data.role;
        const [firstName, ...lastNameParts] = data.fullName.split(' ');
        const lastName = lastNameParts.join(' ');

        const userProfile: User = {
          email: authData.user.email!,
          first_name: firstName,
          last_name: lastName,
          role: finalRole,
          id: authData.user.id,
          club_ids: data.role === 'club_organizer' ? [] : undefined,
          organizer_status: data.role === 'club_organizer' ? 'pending' : undefined,
        };

        setDocumentNonBlocking('users', userProfile);

        toast({
          title: "Account Created!",
          description: "You are now being redirected to the dashboard.",
        });
      }
    } catch (error: any) {
      console.error("Signup Error:", error);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { data, error } = await signInWithGoogle();

      if (error) {
        if (error.message.includes('not enabled')) {
          toast({
            variant: "destructive",
            title: "Sign-up Failed",
            description: "Google Sign-In is not enabled for this project. Please contact an administrator.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Google Sign-up Failed",
            description: error.message || "Could not sign up with Google. Please try again.",
          });
        }
        return;
      }

      // User profile will be created by auth state change listener
      toast({
        title: "Account Created with Google!",
        description: "Redirecting to your dashboard.",
      });
    } catch (error: any) {
      console.error("Google Sign-up Error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-up Failed",
        description: "Could not sign up with Google. Please try again.",
      });
    }
  }

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading...</p>
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
              Create an account to join the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="m@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>I am a...</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="club_organizer">Club Organizer</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
                <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignUp}>
                  Sign up with Google
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/" className="underline">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
