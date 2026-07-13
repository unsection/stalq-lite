import { desc } from "drizzle-orm";
import { db } from "@/db";
import { ownProducts, type OwnProduct } from "@/db/schema";

export const getOwnProducts = async (): Promise<OwnProduct[]> => {
  return db.select().from(ownProducts).orderBy(desc(ownProducts.createdAt));
};
