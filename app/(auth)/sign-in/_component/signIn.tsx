"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import apiClient from "@/lib/axios";

// -------------------------
// VALIDATION SCHEMA
// -------------------------
const formSchema = z.object({
  username: z.string().min(4, { message: "Please enter a valid username." }),
  password: z.string().min(1, { message: "Password is required." }),
  redirectUrl: z.string().optional(),
});

// Temporary storage for credentials until OTP is verified
const TEMP_CREDENTIALS_KEY = "temp_login_creds";

function setTempCredentials(username: string, password: string) {
  const payload = btoa(JSON.stringify({ username, password })); // light obfuscation
  Cookies.set(TEMP_CREDENTIALS_KEY, payload, { expires: 1 / 24 }); // expires in 1 hour
}

export function getTempCredentials(): { username: string; password: string } | null {
  const raw = Cookies.get(TEMP_CREDENTIALS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(atob(raw));
  } catch {
    return null;
  }
}

export function clearTempCredentials() {
  Cookies.remove(TEMP_CREDENTIALS_KEY);
}

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string>("");

  useEffect(() => {
    const url = searchParams.get("redirectUrl") || "";
    setRedirectUrl(url);
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "", redirectUrl },
  });

  useEffect(() => {
    form.setValue("redirectUrl", redirectUrl);
  }, [redirectUrl, form]);

  // -------------------------
  // STEP 1: Request OTP (new login endpoint behavior)
  // -------------------------
  const signInMutation = useMutation<
    { message: string }, // now we only get a message, no token yet
    Error,
    z.infer<typeof formSchema>
  >({
    mutationFn: async (data) => {
      const res = await apiClient.post<{ message: string }>("/auth/login", {
        username: data.username,
        password: data.password,
      });
      return res;
    },
    onSuccess: (data) => {
      const message = data.message || "OTP code has been sent to your email.";

      // 1. Persist credentials for OTP verification step
      setTempCredentials(form.getValues("username"), form.getValues("password"));

      // 2. Show the exact message from backend
      toast.success(message);

      // 3. Navigate to OTP verification page
      const redirect = redirectUrl ? `?redirectUrl=${encodeURIComponent(redirectUrl)}` : "";
      router.push(`/verify-otp${redirect}`);
    },
    onError: (error: any) => {
      if (error.code === "ERR_NETWORK") {
        toast.error("No internet connection. Please try again.");
      } else if (error.response?.status === 401) {
        toast.error("Invalid username or password.");
      } else {
        toast.error(error.response?.data?.message || "Login failed. Please try again.");
      }
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    signInMutation.mutate(values);
  }

  return (
    <div className="space-y-6 w-full flex flex-col justify-center mx-auto max-w-md">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="text-gray-500 text-sm">Use admin or receptionist credentials</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field, fieldState }) => (
              <FormItem className="relative">
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Username"
                    {...field}
                    className={`rounded-none shadow-none py-6 px-5 border-b-2 border-x-0 border-t-0 bg-blue-50 ${fieldState.error ? "border-red-500" : "focus:border-b-[#04b301]"
                      }`}
                  />
                </FormControl>
                <Mail size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                <FormMessage className="absolute -bottom-4 text-red-500" />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem className="relative">
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...field}
                    className={`rounded-none shadow-none py-6 px-5 border-b-2 border-x-0 border-t-0 bg-blue-50 ${fieldState.error ? "border-red-500" : "focus:border-b-[#04b301]"
                      }`}
                  />
                </FormControl>
                <span
                  className="absolute right-3 top-12 -translate-y-1/2 cursor-pointer text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
                <FormMessage className="absolute -bottom-4 text-red-500" />
              </FormItem>
            )}
          />

          {/* Remember + forgot */}
          <div className="flex justify-between items-center">
            <div className="text-gray-400 flex items-center justify-center gap-1 relative">
              <Input
                type="checkbox"
                className="h-4 w-4 border-gray-400 bg-gray-300 absolute left-0 top-[2px]"
              />
              <span className="font-[400] pl-6">Remember me</span>
            </div>
            <Link href="/forgot-password" className="text-sm font-[500] text-[#021EF5] hover:underline">
              Recover password
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[#021EF5] text-white hover:bg-[#021ef5d7] rounded-none shadow-none py-6 px-5"
            disabled={signInMutation.isPending}
          >
            {signInMutation.isPending ? "Sending OTP..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Don’t have an account?{" "}
        <Link href="/sign-up" className="font-semibold text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}