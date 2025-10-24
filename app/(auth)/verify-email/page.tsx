// app/(auth)/verify-email/page.tsx
"use client";
import { Suspense } from "react";
import VerifyEmailForm from "./_component/VerifyEmail";


export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyEmailForm />
        </Suspense>
    );
}