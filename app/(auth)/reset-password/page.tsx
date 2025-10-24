"use client";
import { Suspense } from "react"; 
import ResetPasswordForm from "./_component/reset-password";

export default function ResetPasswordPage() { 
  return (
    <Suspense>
     <ResetPasswordForm />
    </Suspense>
  );
}