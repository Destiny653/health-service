 // app/(auth)/verify-email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import apiClient from "@/lib/axios";
import { Loader2, CheckCircle, XCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { toast } from "sonner";

// Schema for the resend verification form
const resendFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
}); 

export default function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [showResendForm, setShowResendForm] = useState(false);

    // Mutation for the initial token verification
    const verificationMutation = useMutation({
        mutationFn: (token: string) => apiClient.post('/auth/verify-email', { token }), 
        onSuccess: () => {
            toast.success("Email verified!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "An error occurred.");
        }
    });
    
    // Mutation for resending the verification link
    const resendMutation = useMutation({
        mutationFn: (data: { email: string }) => apiClient.post('/auth/resend-verification-email ', data),
        onSuccess: () => {
            toast.success("Verification link sent to your email!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "An error occurred.");
        }
    });

    const form = useForm<z.infer<typeof resendFormSchema>>({
        resolver: zodResolver(resendFormSchema),
        defaultValues: { email: "" },
    });
    
    function onResendSubmit(values: z.infer<typeof resendFormSchema>) {
        resendMutation.mutate(values);
    }

    useEffect(() => {
        // Only attempt verification if a token exists in the URL
        if (token) {
            verificationMutation.mutate(token);
        }
    }, [token]);

    // Main content renderer
    const renderContent = () => {
        // State 1: Verification Failed or No Token Provided
        if (!token || verificationMutation.isError) {
            // Sub-state: Show the resend form
            if (showResendForm) {
                 // Sub-state: Resend was successful
                if (resendMutation.isSuccess) {
                    return (
                        <>
                            <MailCheck className="h-16 w-16 text-green-600" />
                            <h1 className="text-3xl font-bold">New Link Sent!</h1>
                            <p className="text-muted-foreground">Please check your email for a new verification link.</p>
                            <Button asChild className="w-full bg-auth-primary text-white rounded-none shadow-none py-6 px-5 bg-green-600 hover:bg-green-500  ">
                                <Link href="/sign-in">Back to Sign In</Link>
                            </Button>
                        </>
                    );
                }

                return (
                    <>
                        <h1 className="text-3xl font-bold">Resend Verification</h1> 
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(onResendSubmit)} className="w-full space-y-6 text-left">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                    <FormItem className="relative">
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input placeholder="name@example.com" {...field} className="rounded-none shadow-none py-6 px-5" /></FormControl>
                                        <FormMessage className="absolute -bottom-4"/>
                                    </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full bg-auth-primary text-white rounded-none shadow-none py-6 px-5 bg-green-600 hover:bg-green-500" disabled={resendMutation.isPending} onClick={() => setShowResendForm(true)}>
                                    {resendMutation.isPending ? "Sending..." : "Resend Link"}
                                </Button>
                                {resendMutation.isError && <p className="text-sm text-center text-destructive">Failed to send link. Please try again.</p>}
                            </form>
                        </Form>
                    </>
                );
            }
            // Initial failure view
            return (
                <>
                    <XCircle className="h-16 w-16 text-destructive" />
                    <h1 className="text-3xl font-bold">Verification Failed</h1>
                    <p className="text-muted-foreground">This verification link is invalid or has expired.</p>
                    <div className="w-full space-y-2">
                        <Button onClick={() => setShowResendForm(true)} className="w-full bg-auth-primary text-black rounded-none shadow-none py-6 px-5 " variant="outline">
                            Resend Verification Link
                        </Button>
                        <Button   asChild className="w-full bg-auth-primary text-white rounded-none shadow-none py-6 px-5 bg-green-600 hover:bg-green-500">
                           <Link href="/sign-in">Back to Sign In</Link>
                        </Button>
                    </div>
                </>
            );
        }

        // State 2: Verification Succeeded
        if (verificationMutation.isSuccess) {
            return (
                <>
                    <CheckCircle className="h-16 w-16 text-green-600" />
                    <h1 className="text-3xl font-bold">Email Verified!</h1>
                    <p className="text-muted-foreground">Your account is now active. You can sign in.</p>
                    <Button asChild className="w-full bg-auth-primary text-white rounded-none shadow-none py-6 px-5 bg-green-600 hover:bg-green-500">
                        <Link href="/sign-in">Proceed to Sign In</Link>
                    </Button>
                </>
            );
        }

        // State 3: Loading (verifying token)
        return (
            <>
                <Loader2 className="h-16 w-16 animate-spin" />
                <h1 className="text-3xl font-bold">Verifying your email...</h1>
                <p className="text-muted-foreground">Please wait a moment.</p>
            </>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm mx-auto">
            {renderContent()}
        </div>
    );
}