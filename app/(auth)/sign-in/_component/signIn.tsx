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

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string>("");

  useEffect(() => {
    const url = searchParams.get("redirectUrl") || "";
    setRedirectUrl(url);
  }, [searchParams]);

  // -------------------------
  // FORM INSTANCE
  // -------------------------
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "", redirectUrl },
  });

  useEffect(() => {
    form.setValue("redirectUrl", redirectUrl);
  }, [redirectUrl, form]);

  // -------------------------
  // LOGIN MUTATION (Only Login — No Personality Fetch)
  // -------------------------
  const signInMutation = useMutation<
    { status: number; access_token: string; message: string; data: { access_token: string } },
    Error,
    z.infer<typeof formSchema>
  >({
    mutationFn: async (data) => {
      const res = await apiClient.post("/auth/login", data);
      return res.data;
    },
    retry: (failureCount, error: any) => {
      if (error.code === "ERR_NETWORK" && failureCount < 3) return true;
      return false;
    },
    // retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {

        // Save token
        Cookies.set("authToken", data?.access_token, { expires: 7 });

        toast.success("Login successful!");

        // Redirect — MainLayout will fetch /personality
        router.push("/");
    },
    onError: (error: any) => {
      if (error.code === "ERR_NETWORK") {
        toast.error("No internet connection. Please try again.");
      } else if (error.response?.status === 401) {
        toast.error("Invalid username or password.");
      } else {
        toast.error(error.message || "Login failed.");
      }
    },
  });

  // -------------------------
  // SUBMIT HANDLER
  // -------------------------
  function onSubmit(values: z.infer<typeof formSchema>) {
    signInMutation.mutate(values);
  }

  // -------------------------
  // UI
  // -------------------------
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
                    className={`rounded-none shadow-none py-6 px-5 border-b-2 border-x-0 border-t-0 bg-blue-50
                      ${fieldState.error ? "border-red-500" : "focus:border-b-[#04b301]"}
                    `}
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
                    className={`rounded-none shadow-none py-6 px-5 border-b-2 border-x-0 border-t-0 bg-blue-50
                      ${fieldState.error ? "border-red-500" : "focus:border-b-[#04b301]"}
                    `}
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
            {signInMutation.isPending ? "Signing In..." : "Sign In"}
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