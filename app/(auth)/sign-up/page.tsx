"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, User, Phone, ChevronRight } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  firstName: z.string().min(3, { message: "First name must be at least 3 characters." }),
  lastName: z.string().min(3, { message: "Last name must be at least 3 characters." }),

  // Step 2
  gender: z.enum(["Male", "Female"], { message: "Please select a gender." }),
  phone: z.string().min(8, { message: "Please enter a valid phone number." }),
});

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const signUpMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/auth/create-superuser", data),
    onSuccess: () => {
      toast.success("Account created! Please check your email.");
      router.push("/sign-in");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to sign up.");
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      gender: "Male",
      phone: "",
    },
  });

  function goToStep2() {
    const valid = form.trigger(["username", "email", "password", "firstName", "lastName"]);
    valid.then((isValid) => {
      if (isValid) setStep(2);
    });
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    signUpMutation.mutate(values);
  }

  // Tailwind border color logic
  const fieldClass = (hasError: boolean) =>
    `rounded-none shadow-none py-6 px-5 border-b-2 border-x-0 border-t-0 bg-blue-50 focus:border-b-[#04b301] ${
      hasError ? "!border-b-red-500" : ""
    }`;

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Create an account</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {step === 1 && (
            <>
              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field, fieldState }) => (
                  <FormItem className="relative">
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="john_doe" className={fieldClass(!!fieldState.error)} />
                    </FormControl>
                    <User size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* First + Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <FormItem className="relative">
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John" className={fieldClass(!!fieldState.error)} />
                      </FormControl>
                      <User size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <FormItem className="relative">
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Doe" className={fieldClass(!!fieldState.error)} />
                      </FormControl>
                      <User size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem className="relative">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="example@mail.com" className={fieldClass(!!fieldState.error)} />
                    </FormControl>
                    <Mail size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                    <FormMessage />
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
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={fieldClass(!!fieldState.error)}
                      />
                    </FormControl>
                    <span
                      className="absolute right-3 top-12 -translate-y-1/2 cursor-pointer text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </span>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                onClick={goToStep2}
                className="w-full bg-blue-600 text-white py-6 rounded-none"
              >
                Continue <ChevronRight className="ml-2" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <select {...field} className={fieldClass(!!fieldState.error)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <FormItem className="relative">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="674000000" className={fieldClass(!!fieldState.error)} />
                    </FormControl>
                    <Phone size={20} className="absolute right-3 top-12 -translate-y-1/2 text-gray-400" />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={signUpMutation.isPending}
                className="w-full bg-blue-700 text-white py-6 rounded-none"
              >
                {signUpMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </>
          )}
        </form>
      </Form>

      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-blue-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}
