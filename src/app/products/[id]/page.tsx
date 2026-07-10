import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { priceHistory, products, scrapeLogs } from "@/db/schema";
import ProductDetailClient from "@/components/ProductDetailClient";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

const ProductPage = async ({ params }: ProductPageProps) => {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

  if (!product) {
    notFound();
  }

  const history = await db
    .select()
    .from(priceHistory)
    .where(eq(priceHistory.productId, id))
    .orderBy(priceHistory.scrapedAt);

  const logs = await db
    .select()
    .from(scrapeLogs)
    .where(eq(scrapeLogs.productId, id))
    .orderBy(scrapeLogs.createdAt);

  return <ProductDetailClient product={product} history={history} logs={logs} />;
};

export default ProductPage;
