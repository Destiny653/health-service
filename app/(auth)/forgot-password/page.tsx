// app/(auth)/forgot-pass/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from '@tanstack/react-query';
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import apiClient from "@/lib/axios";
import { Mail } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const forgotPasswordMutation = useMutation({
    mutationFn: (data: { email: string }) => apiClient.post('/auth/forgot-password', data),
    onSuccess: () => {
      toast.success("Password reset link sent to your email!");
      setIsSuccess(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "An error occurred.");
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    forgotPasswordMutation.mutate(values);
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">Check your email</h1>
        <p className="text-muted-foreground">
          We've sent a password reset link to the email address you provided.
        </p>
        <Button asChild className="w-full bg-auth-primary text-white hover:bg-auth-primary/90 rounded-none shadow-none py-6 px-5 bg-green-600 hover:bg-green-500">
          <Link href="/sign-in">Back to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Forgot Password?</h1>
        <p className="text-[14px] text-gray-400">
          Enter your email below, you will receive an email with instructions
          on how to reset your password in a few minutes.  You can also
          set a new password if you have never set one before.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Email</FormLabel>
                <FormControl><Input placeholder="name@example.com" {...field} className="rounded-none shadow-none py-6 px-5 border-b-2 focus:border-b-[#04b301] border-x-0 border-t-0 bg-blue-50" />
                </FormControl>
                <Mail size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                <FormMessage className="absolute -bottom-4" />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-auth-primary text-white hover:bg-auth-primary/90 rounded-none shadow-none py-6 px-5 bg-[#021EF5] hover:bg-[#021ef5d7]" disabled={forgotPasswordMutation.isPending}>
            {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </Form>
    </div>
  );
}