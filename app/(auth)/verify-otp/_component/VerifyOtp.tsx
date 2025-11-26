"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";

import apiClient from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, MailCheck, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Temp credentials helpers (same as in SignIn)
const TEMP_CREDENTIALS_KEY = "temp_login_creds";

function getTempCredentials(): { username: string; password: string } | null {
    const raw = Cookies.get(TEMP_CREDENTIALS_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(atob(raw));
    } catch {
        return null;
    }
}

function clearTempCredentials() {
    Cookies.remove(TEMP_CREDENTIALS_KEY);
}

// Schema for 5-digit OTP
const otpSchema = z.object({
    otp: z.string().length(5, "OTP must be 5 digits"),
});

type OtpFormValues = z.infer<typeof otpSchema>;

export default function VerifyOtpPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirectUrl") || "/";

    const [emailPreview] = useState("royal*****@gmail.com"); // You can extract from username if needed

    const form = useForm<OtpFormValues>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: "" },
    });

    // Step 1: Validate OTP with persisted credentials
    const validateOtpMutation = useMutation({
        mutationFn: async ({ otp }: OtpFormValues) => {
            const creds = getTempCredentials();
            if (!creds) throw new Error("Session expired. Please sign in again.");

            const res = await apiClient.post<{ access_token: string }>(`/auth/login/validate?otp=${otp}`, {
                username: creds.username,
                password: creds.password
            });
            return res;
        },
        onSuccess: (data) => {
            // Save real token
            Cookies.set("authToken", data.access_token, { expires: 7 });

            // Clean up temp credentials
            clearTempCredentials();

            toast.success("Login successful!");
            router.push(decodeURIComponent(redirectUrl));
        },
        onError: (error: any) => {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Invalid or expired OTP. Please try again.";
            toast.error(message);
            form.setError("otp", { message });
        },
    });

    // Step 2: Resend OTP (re-triggers the first login step)
    const resendOtpMutation = useMutation({
        mutationFn: async () => {
            const creds = getTempCredentials();
            if (!creds) throw new Error("Session expired. Please sign in again.");

            const res = await apiClient.post<{ message: string }>("/auth/login", {
                username: creds.username,
                password: creds.password,
            });
            return res;
        },
        onSuccess: (data) => {
            toast.success(data.message || "New OTP sent to your email!");
            form.reset();
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message || "Failed to resend OTP. Please sign in again."
            );
            // If resend fails critically, redirect to login
            if (!getTempCredentials()) {
                router.push("/sign-in");
            }
        },
    });

    // Auto-redirect if no temp credentials (security)
    useEffect(() => {
        if (!getTempCredentials()) {
            toast.error("Session expired. Please sign in again.");
            router.push("/sign-in");
        }
    }, [router]);

    function onSubmit(values: OtpFormValues) {
        validateOtpMutation.mutate(values);
    }

    // Loading full screen
    if (validateOtpMutation.isPending || resendOtpMutation.isPending) {
        return (
            <div className="flex flex-col items-center justify-center space-y-6">
                <Loader2 className="h-16 w-16 animate-spin text-[#021EF5]" />
                <p className="text-xl">Validating...</p>
            </div>
        );
    }

    // Success screen
    if (validateOtpMutation.isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center  space-y-8 text-center px-6">
                <CheckCircle className="h-20 w-20 text-green-600" />
                <h1 className="text-3xl font-bold">Login Successful!</h1>
                <p className="text-muted-foreground">Redirecting you to your dashboard...</p>
            </div>
        );
    }

    // Main OTP Form
    return (
        <div className="flex flex-col items-center justify-center space-y-10 px-6">
            <div className="text-center space-y-3 max-w-md">
                <h1 className="text-3xl font-bold">Enter Verification Code</h1>
                <p className="text-muted-foreground">
                    We've sent a 5-digit code to <>{emailPreview}</>
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 w-full">
                    <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-4 items-center">
                                <FormControl>
                                    <InputOTP maxLength={5} {...field}>
                                        <InputOTPGroup className="gap-3">
                                            {[0, 1, 2, 3, 4].map((index) => (
                                                <InputOTPSlot
                                                    key={index}
                                                    index={index}
                                                    className="w-14 h-14 text-xl font-bold border border-b-2 shadow-sm border-x-0 border-t-0 rounded-none bg-gray-50 data-[focused=true]:ring-2 data-[focused=true]:ring-[#021EF5] data-[focused=true]:border-[#021EF5]"
                                                />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </FormControl>
                                <FormMessage className="mt-3" />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-10 w-full">
                        <div className="text-center gap-2 flex items-center">
                            <button
                                type="button"
                                onClick={() => resendOtpMutation.mutate()}
                                disabled={resendOtpMutation.isPending}
                                className="text-[#34CAA5] font-medium hover:underline disabled:opacity-50"
                            >
                                {resendOtpMutation.isPending ? "Sending..." : "Resend the code again"}
                            </button>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-[#021EF5] hover:bg-[#021ef5d7] text-white py-7 text-lg rounded-none"
                            disabled={validateOtpMutation.isPending}
                        >
                            {validateOtpMutation.isPending ? "Verifying..." : "Verify & Sign In"}
                        </Button>

                    </div>
                </form>
            </Form>
        </div>
    );
}