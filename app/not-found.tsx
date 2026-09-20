import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card p-10 text-center animate-rise">
      <p className="text-[0.7rem] uppercase tracking-[0.14em] text-fog">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        That page isn&rsquo;t here
      </h1>
      <p className="mt-2 text-sm text-fog">
        The journey or lesson you were after has been deleted, or the link is wrong.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to your journeys
      </Link>
    </div>
  );
}
