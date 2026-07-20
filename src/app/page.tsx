import { ProductWorkspace } from "@/components/ProductWorkspace";
import {
  getDashboardData,
  type TrackerProduct,
} from "@/lib/pricing/getDashboardData";
import { getOwnProducts } from "@/lib/pricing/getOwnProducts";
import type { OwnProduct } from "@/db/schema";
import {
  classifyDatabaseError,
  type DatabaseErrorKind,
} from "@/lib/neon/databaseError";

export const dynamic = "force-dynamic";

const HomePage = async () => {
  let products: TrackerProduct[] | null = null;
  let ownProducts: OwnProduct[] = [];
  let errorMessage: string | null = null;
  let errorKind: DatabaseErrorKind = "unknown";

  try {
    [{ products }, ownProducts] = await Promise.all([getDashboardData(), getOwnProducts()]);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Database error";
    errorKind = classifyDatabaseError(error);
  }

  if (products == null) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <h1 className="text-xl font-semibold text-white">
          {errorKind === "schema" ? "Database setup incomplete" : "Could not connect to database"}
        </h1>
        <p className="text-sm text-zinc-400">
          {errorKind === "schema"
            ? "The database is connected, but one or more required tables are missing."
            : "Stalq could not reach Neon. Check the internet connection, then refresh this page."}
        </p>
        {errorKind === "schema" ? (
          <div className="rounded-md border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
            <pre className="overflow-x-auto text-zinc-400">npm run db:migrate</pre>
          </div>
        ) : null}
        <details className="text-xs text-zinc-600">
          <summary className="cursor-pointer text-zinc-500">Technical details</summary>
          <p className="mt-2 break-words">{errorMessage}</p>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Price tracker</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Monitor pricing movement, drops, and increases across tracked products.
        </p>
      </div>

      <ProductWorkspace ownProducts={ownProducts} competitors={products} />
    </div>
  );
};

export default HomePage;
