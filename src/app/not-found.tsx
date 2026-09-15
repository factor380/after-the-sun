import { dictionary } from "@/lib/i18n/dictionaries";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-5 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        {dictionary.notFoundTitle}
      </h1>
      <p className="mt-3 text-[var(--sand-muted)]">{dictionary.notFoundHint}</p>
      <Link
        href="/"
        className="mt-8 border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-center font-medium text-[var(--sand)] transition hover:border-[var(--ember)]"
      >
        {dictionary.backHome}
      </Link>
    </div>
  );
}
