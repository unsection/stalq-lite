"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OwnProduct } from "@/db/schema";
import { AddOwnProductModal } from "@/components/AddOwnProductModal";
import { MarginCostsModal } from "@/components/MarginCostsModal";
import { ProductInfoCard } from "@/components/ProductInfoCard";
import { ProductToolbar } from "@/components/ProductToolbar";
import { PriceTrackerTable } from "@/components/PriceTrackerTable";
import { type PickerProduct } from "@/components/ProductPickerModal";
import type { TrackerProduct } from "@/lib/pricing/getDashboardData";
import { extractDomain } from "@/lib/utils";

type ProductWorkspaceProps = {
  ownProducts: OwnProduct[];
  competitors: TrackerProduct[];
};

const toPickerProduct = (product: OwnProduct): PickerProduct => ({
  id: product.id,
  name: product.name,
  sku: product.sku ?? undefined,
  domain: product.url ? extractDomain(product.url) : undefined,
  url: product.url,
});

export const ProductWorkspace = ({ ownProducts, competitors }: ProductWorkspaceProps) => {
  const router = useRouter();
  const [products, setProducts] = useState(ownProducts);
  const [selectedId, setSelectedId] = useState<string | null>(ownProducts[0]?.id ?? null);
  const [addOpen, setAddOpen] = useState(false);
  const [costsOpen, setCostsOpen] = useState(false);

  const selected = products.find((product) => product.id === selectedId) ?? null;
  const selectedCompetitors = competitors.filter((competitor) => competitor.ownProductId === selected?.id);

  const handleSelect = (product: PickerProduct) => setSelectedId(product.id);
  const handleAddProduct = () => setAddOpen(true);
  const handleCloseAdd = () => setAddOpen(false);

  const handleCreated = (product: OwnProduct) => {
    setProducts((prev) => [product, ...prev]);
    setSelectedId(product.id);
    router.refresh();
  };

  const handleCostsSaved = (updatedProduct: OwnProduct) => {
    setProducts((current) => current.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)));
    router.refresh();
  };

  return (
    <>
      <ProductToolbar
        products={products.map(toPickerProduct)}
        selected={selected ? toPickerProduct(selected) : null}
        onSelect={handleSelect}
        onAddProduct={handleAddProduct}
      />
      <ProductInfoCard
        product={selected}
        competitors={selectedCompetitors}
        onAddProduct={handleAddProduct}
        onEditCosts={() => setCostsOpen(true)}
      />
      {selected ? <PriceTrackerTable products={selectedCompetitors} ownProduct={selected} /> : null}
      <AddOwnProductModal open={addOpen} onClose={handleCloseAdd} onCreated={handleCreated} />
      <MarginCostsModal
        product={selected}
        open={costsOpen}
        onClose={() => setCostsOpen(false)}
        onSaved={handleCostsSaved}
      />
    </>
  );
};
