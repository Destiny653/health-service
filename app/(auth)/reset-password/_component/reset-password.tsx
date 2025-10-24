import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import  apiClient  from "@/lib/axios";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters."),
});

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const resetPasswordMutation = useMutation({
    mutationFn: (data: { token: string; newPassword: string }) => apiClient.post('/auth/reset-password', data),
    onSuccess: () => {
      toast.success("Password reset successful");
      router.push('/sign-in');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "An error occurred.");
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) return; // Handle missing token
    resetPasswordMutation.mutate({ token, ...values });
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-destructive">Invalid Link</h1>
        <p>The password reset link is missing a token.</p>
      </div>
    );
  }

  return ( 
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Set a New Password</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>New Password</FormLabel>
                  <FormControl><Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} className="rounded-none shadow-none py-6 px-5" /></FormControl>
                  <span className="absolute right-3 top-12 -translate-y-1/2 cursor-pointer text-gray-400 " onClick={() => setShowPassword(!showPassword)} >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl><Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} className="rounded-none shadow-none py-6 px-5" /></FormControl>
                  <span className="absolute right-3 top-12 -translate-y-1/2 cursor-pointer text-gray-400 " onClick={() => setShowConfirmPassword(!showConfirmPassword)} >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-auth-primary text-white hover:bg-auth-primary/90 rounded-none shadow-none py-6 px-5 bg-green-600 hover:bg-green-500" disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      </div> 
  );
}