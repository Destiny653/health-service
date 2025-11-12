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

// ✅ ContactPersonnel interface + password
export interface ContactPersonnel {
  firstName: string;
  lastName: string;
  role: "admin" | "receptionist";
  tel1: string;
  tel2: string;
  institution: string;
  email: string;
  password: string;
  lastActivity: string;
}

// ✅ Dummy users to simulate sign-in
const DUMMY_USERS: ContactPersonnel[] = [
  {
    firstName: "John",
    lastName: "Smith",
    role: "admin",
    tel1: "+237600000001",
    tel2: "+237699999999",
    institution: "St. Francis Hospital",
    email: "admin@example.com",
    password: "admin123",
    lastActivity: "2025-11-12T09:00:00Z",
  },
  {
    firstName: "Maria",
    lastName: "Ndiaye",
    role: "receptionist",
    tel1: "+237670000001",
    tel2: "+237677777777",
    institution: "St. Francis Hospital",
    email: "reception@example.com",
    password: "reception123",
    lastActivity: "2025-11-12T09:10:00Z",
  },
];

// ✅ Form validation schema
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
  const [redirectUrl, setRedirectUrl] = useState<string>("");

  useEffect(() => {
    const url = searchParams.get("redirectUrl") || "";
    setRedirectUrl(url);
  }, [searchParams]);

  // ✅ Mutation to simulate sign-in logic
  const signInMutation = useMutation<
    { success: boolean; message: string; data?: any },
    Error,
    z.infer<typeof formSchema>
  >({
    mutationFn: async (data) => {
      // Simulate backend check delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const user = DUMMY_USERS.find(
        (u) =>
          u.email.toLowerCase() === data.email.toLowerCase() &&
          u.password === data.password
      );

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Simulated token & response
      return {
        success: true,
        message: `Welcome back, ${user.firstName}!`,
        data: {
          accessToken: "fake-jwt-token-" + Math.random().toString(36).slice(2),
          user,
        },
      };
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Save token and user to cookies/localStorage
        Cookies.set("authToken", data.data.accessToken, { expires: 7 });
        localStorage.setItem("userInfo", JSON.stringify(data.data.user));

        // Redirect
        const redirectUrl = form.getValues("redirectUrl");
        if (redirectUrl && isValidUrl(redirectUrl)) {
          router.push(redirectUrl);
        } else {
          router.push("/");
        }

        toast.success(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", redirectUrl },
  });

  useEffect(() => {
    form.setValue("redirectUrl", redirectUrl);
  }, [redirectUrl, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    signInMutation.mutate(values);
  }

  return (
    <div className="space-y-6 w-full  flex flex-col justify-center mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="text-gray-500 text-sm">Use admin or receptionist credentials</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Email / Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    {...field}
                    className="rounded-none shadow-none py-6 px-5 border-b-2 focus:border-b-[#04b301] border-x-0 border-t-0 bg-blue-50"
                  />
                </FormControl>
                <Mail
                  size={20}
                  className="absolute right-3 top-12 -translate-y-1/2 text-gray-400"
                />
                <FormMessage className="absolute -bottom-4" />
              </FormItem>
            )}
          />

          {/* Password field */}
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
                    className="rounded-none shadow-none py-6 px-5 border-b-2 focus:border-b-[#04b301] border-x-0 border-t-0 bg-blue-50"
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

          {/* Remember me + forgot password */}
          <div className="flex justify-between items-center">
            <div className="text-gray-400 flex items-center justify-center gap-1 relative">
              <Input
                type="checkbox"
                className="h-4 w-4 border-gray-400 bg-gray-300 absolute left-0 top-[2px]"
              />
              <span className="font-[400] pl-6">Remember me</span>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm font-[500] text-[#021EF5] hover:underline"
            >
              Recover password
            </Link>
          </div>

          {/* Submit button */}
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
