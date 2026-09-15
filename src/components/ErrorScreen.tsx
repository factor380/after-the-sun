"use client";

import Link from "next/link";
import { dictionary, type MessageKey } from "@/lib/i18n/dictionaries";

type ErrorScreenProps = {
  titleKey?: MessageKey;
  bodyKey?: MessageKey;
  onRetry?: () => void;
};

export function ErrorScreen({
  titleKey = "somethingWentWrong",
  bodyKey = "somethingWentWrongHint",
  onRetry,
}: ErrorScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-5 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        {dictionary[titleKey]}
      </h1>
      <p className="mt-3 text-[var(--sand-muted)]">{dictionary[bodyKey]}</p>
      <div className="mt-8 flex flex-col gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="bg-[var(--ember)] px-5 py-2.5 font-medium text-white transition hover:brightness-110"
          >
            {dictionary.tryAgain}
          </button>
        ) : null}
        <Link
          href="/"
          className="border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-center font-medium text-[var(--sand)] transition hover:border-[var(--ember)]"
        >
          {dictionary.backHome}
        </Link>
      </div>
    </div>
  );
}
