'use client'
import { Suspense } from "react"
import SignIn from "./_component/signIn"


export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  )
}