// app/(auth)/verify-email/page.tsx
"use client";
import { Suspense } from "react";
import VerifyOtpPage from "./_component/VerifyOtp";


export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyOtpPage />
        </Suspense>
    );
}