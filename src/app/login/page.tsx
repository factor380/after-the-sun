import { Suspense } from "react";
import { T } from "@/components/T";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-16 text-[var(--sand-muted)]">
          <T k="loading" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
