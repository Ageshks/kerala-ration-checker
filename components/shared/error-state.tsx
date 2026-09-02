import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ErrorState({
  title,
  message,
  href,
  linkLabel = "Back to Home",
}: {
  title: string;
  message: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <Alert variant="destructive" className="max-w-2xl">
      <AlertTitle className="flex items-center gap-2">
        <span aria-hidden="true">⚠️</span>
        {title}
      </AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        <div className="mt-4">
          <Link href={href ?? "/"} className={buttonVariants({ variant: "outline" })}>
            {linkLabel}
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function EmptyState({
  title = "No results found",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-dashed bg-muted/40 p-10 text-center">
      <p className="mb-1 text-2xl" aria-hidden="true">
        🔍
      </p>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}