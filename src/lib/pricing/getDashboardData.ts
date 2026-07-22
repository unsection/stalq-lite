import { desc } from "drizzle-orm";
import { db } from "@/db";
import { priceHistory, products, type Product } from "@/db/schema";
import {
  computeDashboardSummary,
  computePriceMovement,
  type DashboardSummary,
  type PriceMovement,
} from "./movement";

type TrackerHistoryPoint = {
  price: number;
  scrapedAt: string;
};

export type TrackerProduct = Product & {
  movement: PriceMovement;
  /** Price observations used for the 30-day competitor strip. */
  history: TrackerHistoryPoint[];
};

export type DashboardData = {
  products: TrackerProduct[];
  summary: DashboardSummary;
};

export const getDashboardData = async (): Promise<DashboardData> => {
  const productRows = await db.select().from(products).orderBy(desc(products.createdAt));
  const historyRows = await db
    .select()
    .from(priceHistory)
    .orderBy(priceHistory.scrapedAt);

  const historyByProduct = new Map<string, Array<{ price: number; scrapedAt: Date }>>();

  for (const row of historyRows) {
    const points = historyByProduct.get(row.productId) ?? [];
    points.push({
      price: Number(row.price),
      scrapedAt: new Date(row.scrapedAt),
    });
    historyByProduct.set(row.productId, points);
  }

  const trackerProducts: TrackerProduct[] = productRows.map((product) => {
    const points = historyByProduct.get(product.id) ?? [];

    return {
      ...product,
      movement: computePriceMovement(
        points,
        product.currentPrice ? Number(product.currentPrice) : null,
      ),
      history: points.map((point) => ({
        price: point.price,
        scrapedAt: point.scrapedAt.toISOString(),
      })),
    };
  });

  return {
    products: trackerProducts,
    summary: computeDashboardSummary(trackerProducts.map((product) => product.movement)),
  };
};
