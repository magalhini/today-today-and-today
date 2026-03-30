import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-5xl md:text-6xl font-semibold text-charcoal leading-[1.1] mb-8">
          Today, Today
          <br />
          <span className="italic font-light">and Today</span>
        </h1>

        <div className="font-[family-name:var(--font-body)] text-charcoal-light leading-relaxed space-y-6 text-lg">
          <p>
            A quiet place for daily writing.
          </p>
          <p>
            One entry per day. No comments. No metrics.
            Just words, weather, and the phase of the moon.
          </p>
        </div>

        <div className="mt-12">
          <Link
            href="/login"
            className="text-sm uppercase tracking-wider text-terracotta hover:text-terracotta-light underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
