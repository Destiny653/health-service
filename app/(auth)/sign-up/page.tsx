// app/(auth)/sign-up/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import apiClient  from "@/lib/axios";
import { CreateUserDto } from "@/types/index";
import { useEffect, useState } from "react";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { Mail, User } from "lucide-react";
import { toast } from "sonner";

// Schema for sign-up validation, based on your CreateUserDto
const formSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  firstName: z.string().min(3, { message: "First name must be at least 3 characters." }),
  lastName: z.string().min(3, { message: "Last name must be at least 3 characters." }),
});

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const signUpMutation = useMutation({
    mutationFn: (data: CreateUserDto) => apiClient.post('/auth/register', data),
    onSuccess: () => {
      toast.success("Sign-up successful! Please check your email for verification.");
      router.push('/sign-in');
    },
    onError: (error: any) => {
      console.error("Sign-up failed", error);
      toast.error(error.response?.data?.message || "An error occurred.");
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", email: "", password: "", firstName: "", lastName: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    signUpMutation.mutate(values);
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create an account</h1> 
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="john_doe" {...field} className="rounded-none shadow-none py-6 px-5" />
                </FormControl>
                <User size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                <FormMessage className="absolute -bottom-4" />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} className="rounded-none shadow-none py-6 px-5" />
                  </FormControl>
                  <User size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                  <FormMessage className="absolute -bottom-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} className="rounded-none shadow-none py-6 px-5" />
                  </FormControl>
                  <User size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                  <FormMessage className="absolute -bottom-4" />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} className="rounded-none shadow-none py-6 px-5" />
                </FormControl>
                <Mail size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                <FormMessage className="absolute -bottom-4" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} className="rounded-none shadow-none py-6 px-5" />
                </FormControl>
                <span className="absolute right-3 top-12 -translate-y-1/2 cursor-pointer text-gray-400 " onClick={() => setShowPassword(!showPassword)} >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
                <FormMessage className="absolute -bottom-4" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full bg-auth-primary text-white hover:bg-auth-primary/90 rounded-none shadow-none py-6 px-5 bg-green-600 hover:bg-green-500"
            disabled={signUpMutation.isPending}
          >
            {signUpMutation.isPending ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-semibold text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}