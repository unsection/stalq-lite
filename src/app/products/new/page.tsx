import { NewCompetitorForm } from "@/components/NewCompetitorForm";
import { getOwnProducts } from "@/lib/pricing/getOwnProducts";

type NewProductPageProps = {
  searchParams: Promise<{ ownProductId?: string | string[] }>;
};

const NewProductPage = async ({ searchParams }: NewProductPageProps) => {
  const ownProducts = await getOwnProducts();
  const { ownProductId } = await searchParams;
  const defaultOwnProductId =
    typeof ownProductId === "string" && ownProducts.some((product) => product.id === ownProductId)
      ? ownProductId
      : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Add competitor</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Choose the store product first, then configure the competitor URL and tracking settings.
        </p>
      </div>
      <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
        <NewCompetitorForm ownProducts={ownProducts} defaultOwnProductId={defaultOwnProductId} />
      </div>
    </div>
  );
};

export default NewProductPage;
