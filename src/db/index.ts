import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const createDb = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return drizzle(neon(connectionString), { schema });
};

type Db = ReturnType<typeof createDb>;

let dbInstance: Db | undefined;

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    if (!dbInstance) {
      dbInstance = createDb();
    }
    const value = Reflect.get(dbInstance, prop, receiver);
    return typeof value === "function" ? value.bind(dbInstance) : value;
  },
});
