"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import apiClient  from "@/lib/axios";
import { SigninDto } from "@/types";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";

interface SigninResponseData {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      isEmailVerified: boolean;
    };
  };
  timestamp: string;
}

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
  redirectUrl: z.string().optional(),
});

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string>('');

  useEffect(() => {
    const url = searchParams.get('redirectUrl') || '';
    setRedirectUrl(url);
  }, [searchParams]);

  const signInMutation = useMutation<SigninResponseData, Error, SigninDto>({
    mutationFn: async (data: SigninDto) => {
      const response = await apiClient.post<SigninResponseData>('/auth/login', data);
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.success) {
        // Store the access token in cookies
        Cookies.set('authToken', data.data.accessToken, { expires: 7 }); // Expires in 7 days

        // Store user info in localStorage
        localStorage.setItem('userInfo', JSON.stringify(data.data.user));

        // Redirect to home or the redirectUrl
        const redirectUrl = form.getValues('redirectUrl');
        if (redirectUrl && isValidUrl(redirectUrl)) {
          router.push(redirectUrl);
        } else {
          router.push('/');
        }

        toast.success(data.message);
      } else {
        toast.error(data.message || 'Login failed');
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'An error occurred during login');
    }
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      redirectUrl: redirectUrl
    },
  });

  useEffect(() => {
    form.setValue('redirectUrl', redirectUrl);
  }, [redirectUrl, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    signInMutation.mutate({
      email: values.email,
      password: values.password,
      redirectUrl: values.redirectUrl
    });
  }

  return (
    <div className="space-y-6 w-full h-100vh">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Sign in</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    {...field}
                    className="rounded-none shadow-none py-6 px-5"
                  />
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
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...field}
                    className="rounded-none shadow-none py-6 px-5"
                  />
                </FormControl>
                <span
                  className="absolute right-3 top-12 -translate-y-1/2 cursor-pointer text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
                <FormMessage className="absolute -bottom-4" />
              </FormItem>
            )}
          />
          <div className="flex justify-end items-center">
            <Link href="/forgot-password" className="text-sm text-auth-primary hover:underline">
              Forgot password
            </Link>
          </div>
          <Button
            type="submit"
            className="w-full bg-auth-primary text-white hover:bg-auth-primary/90 rounded-none shadow-none py-6 px-5 bg-green-600 hover:bg-green-500"
            disabled={signInMutation.isPending}
          >
            {signInMutation.isPending ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/sign-up" className="font-semibold text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}