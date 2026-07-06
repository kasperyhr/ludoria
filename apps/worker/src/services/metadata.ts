import { drizzle } from "drizzle-orm/d1";
import * as schema from "@ludoria/db";
import type { MetadataDb } from "@ludoria/db";

export function createMetadataDb(d1: D1Database): MetadataDb {
  return drizzle(d1, { schema });
}
