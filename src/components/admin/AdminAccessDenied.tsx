import Link from "next/link";
import { dictionary } from "@/lib/i18n/dictionaries";

export function AdminAccessDenied({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--sand)]">
        {title}
      </h1>
      <p className="mt-3 text-[var(--sand-muted)]">{dictionary.adminForbiddenEdit}</p>
      <p className="mt-8">
        <Link href="/" className="text-sm text-[var(--sand-muted)] underline">
          {dictionary.backToMap}
        </Link>
      </p>
    </div>
  );
}
