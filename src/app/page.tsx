import Link from "next/link";
import { PriceTrackerTable } from "@/components/PriceTrackerTable";
import { ProductInfoCard } from "@/components/ProductInfoCard";
import { ProductToolbar } from "@/components/ProductToolbar";
import {
  getDashboardData,
  type TrackerProduct,
} from "@/lib/pricing/getDashboardData";

export const dynamic = "force-dynamic";

const HomePage = async () => {
  let products: TrackerProduct[] | null = null;
  let errorMessage: string | null = null;

  try {
    ({ products } = await getDashboardData());
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Database error";
  }

  if (products == null) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <h1 className="text-xl font-semibold text-white">Database not ready</h1>
        <p className="text-sm text-zinc-400">
          The app connected to Neon but the schema is missing. Run the migration to create tables.
        </p>
        <p className="text-sm text-zinc-500">{errorMessage}</p>
        <div className="rounded-md border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
          <pre className="overflow-x-auto text-zinc-400">npm run db:migrate</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Price tracker</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Monitor pricing movement, drops, and increases across tracked products.
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex rounded-full bg-[#0080FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0066cc]"
        >
          Add product
        </Link>
      </div>

      <ProductToolbar
        productCount={products.length}
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          domain: product.domain,
        }))}
      />
      <ProductInfoCard />
      <PriceTrackerTable products={products} />
    </div>
  );
};

export default HomePage;
