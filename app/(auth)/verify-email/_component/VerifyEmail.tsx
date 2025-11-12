"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import apiClient from "@/lib/axios";
import { Loader2, CheckCircle, XCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Link from "next/link";
import { toast } from "sonner";

// ✅ Schema for verifying the 5-digit code
const verifyCodeSchema = z.object({
    code: z
        .string()
        .min(5, { message: "Please enter the 5-digit code." })
        .max(5, { message: "Code must be 5 digits long." }),
});

export default function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [showResendForm, setShowResendForm] = useState(false);

    // ✅ Mutation for verifying a code
    const verificationMutation = useMutation({
        mutationFn: (data: { code: string }) => apiClient.post("/auth/verify-code", data),
        onSuccess: () => {
            toast.success("Code verified successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Invalid or expired code.");
        },
    });

    // ✅ Mutation for resending a code (example: via email)
    const resendMutation = useMutation({
        mutationFn: () => apiClient.post("/auth/resend-verification-email"),
        onSuccess: () => {
            toast.success("A new code has been sent to your email!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "An error occurred while resending the code.");
        },
    });

    const form = useForm<z.infer<typeof verifyCodeSchema>>({
        resolver: zodResolver(verifyCodeSchema),
        defaultValues: { code: "" },
    });

    // ✅ Submit handler for verification code
    function onSubmit(values: z.infer<typeof verifyCodeSchema>) {
        verificationMutation.mutate(values);
    }

    // ✅ Automatically verify token from URL if present
    useEffect(() => {
        if (token) {
            verificationMutation.mutate({ code: token });
        }
    }, [token]);

    // ✅ UI rendering based on state
    const renderContent = () => {
        // ✳️ Success state
        if (verificationMutation.isSuccess) {
            return (
                <>
                    <CheckCircle className="h-16 w-16 text-green-600" />
                    <h1 className="text-3xl font-bold">Email Verified!</h1>
                    <p className="text-muted-foreground">Your account is now active. You can sign in.</p>
                    <Button
                        asChild
                        className="w-full bg-[#021EF5] text-white rounded-none shadow-none py-6 px-5 hover:bg-[#021ef5d7]"
                    >
                        <Link href="/sign-in">Proceed to Sign In</Link>
                    </Button>
                </>
            );
        }

        // ✳️ Failed verification or no token
        if (!token || verificationMutation.isError) {
            if (showResendForm) {
                if (resendMutation.isSuccess) {
                    return (
                        <>
                            <MailCheck className="h-16 w-16 text-green-600" />
                            <h1 className="text-3xl font-bold">New Code Sent!</h1>
                            <p className="text-muted-foreground">
                                Please check your email for the new verification code.
                            </p>
                            <Button
                                asChild
                                className="w-full bg-[#021EF5] text-white rounded-none shadow-none py-6 px-5 hover:bg-[#021ef5d7]"
                            >
                                <Link href="/sign-in">Back to Sign In</Link>
                            </Button>
                        </>
                    );
                }

                return (
                    <div className="w-[500px] space-y-6">
                        <h1 className="text-3xl font-bold text-center">Enter verification code</h1>
                        <p className="text-center text-muted-foreground">
                            We have just sent a verification code to tynisha*****@mail.com
                        </p>

                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-col items-center space-y-8"
                            >
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col items-center">
                                            <FormControl>
                                                <InputOTP maxLength={5} {...field}>
                                                    <InputOTPGroup className="flex gap-4">
                                                        <InputOTPSlot
                                                            className="p-6 border rounded-none bg-gray-100 focus:bg-green-200"
                                                            index={0}
                                                        />
                                                        <InputOTPSlot
                                                            className="p-6 border rounded-none bg-gray-100 focus:bg-green-200"
                                                            index={1}
                                                        />
                                                        <InputOTPSlot
                                                            className="p-6 border rounded-none bg-gray-100 focus:bg-green-200"
                                                            index={2}
                                                        />
                                                        <InputOTPSlot
                                                            className="p-6 border rounded-none bg-gray-100 focus:bg-green-200"
                                                            index={3}
                                                        />
                                                        <InputOTPSlot
                                                            className="p-6 border rounded-none bg-gray-100 focus:bg-green-200"
                                                            index={4}
                                                        />
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="w-full space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => resendMutation.mutate()}
                                        className="w-full text-[#04b301] font-medium hover:underline text-left pb-4"
                                        disabled={resendMutation.isPending}
                                    >
                                        {resendMutation.isPending ? "Resending..." : "Send code again"}
                                    </button>
                                    <Button
                                        type="submit"
                                        className="w-full bg-[#021EF5] text-white rounded-none shadow-none py-6 px-5 hover:bg-[#021ef5d7]"
                                        disabled={verificationMutation.isPending}
                                    >
                                        {verificationMutation.isPending ? "Verifying..." : "Verify Code"}
                                    </Button>
                                    {verificationMutation.isError && (
                                        <p className="text-sm text-center text-destructive">
                                            Invalid or expired code. Please try again.
                                        </p>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </div>
                );
            }

            // ✳️ Initial failure or expired link
            return (
                <>
                    <XCircle className="h-16 w-16 text-destructive" />
                    <h1 className="text-3xl font-bold">Verification Failed</h1>
                    <p className="text-muted-foreground">
                        This verification link is invalid or has expired.
                    </p>
                    <div className="w-full space-y-2">
                        <Button
                            onClick={() => setShowResendForm(true)}
                            variant="outline"
                            className="w-full text-black rounded-none shadow-none py-6 px-5 border"
                        >
                            Resend Verification Code
                        </Button>
                        <Button
                            asChild
                            className="w-full bg-[#021EF5] text-white rounded-none shadow-none py-6 px-5 hover:bg-[#021ef5d7]"
                        >
                            <Link href="/sign-in">Back to Sign In</Link>
                        </Button>
                    </div>
                </>
            );
        }

        // ✳️ Loading state
        return (
            <>
                <Loader2 className="h-16 w-16 animate-spin" />
                <h1 className="text-3xl font-bold">Verifying your email...</h1>
                <p className="text-muted-foreground">Please wait a moment.</p>
            </>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-6 text-center max-w-sm mx-auto">
            {renderContent()}
        </div>
    );
}
