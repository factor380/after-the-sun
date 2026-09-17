import type { Metadata } from "next";
import { Suspense } from "react";
import { T } from "@/components/T";
import { dictionary } from "@/lib/i18n/dictionaries";
import { noIndexRobots } from "@/lib/seo";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: dictionary.signInTitle,
  robots: noIndexRobots,
};

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
