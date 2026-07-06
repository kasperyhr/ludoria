import { Hono } from "hono";
import { getGameCatalogFromDb } from "@ludoria/db";
import type { WorkerEnv } from "../env";
import { createMetadataDb } from "../services/metadata";
import { gameCatalog } from "../catalog";

export const gamesRoutes = new Hono<{ Bindings: WorkerEnv }>();

gamesRoutes.get("/api/games", async (c) => {
  try {
    const db = createMetadataDb(c.env.DB);
    const rows = await getGameCatalogFromDb(db);

    if (rows.length > 0) {
      return c.json(rows);
    }
  } catch (err) {
    console.warn("D1 game_catalog read failed, falling back to mock catalog:", String(err));
  }

  return c.json(gameCatalog);
});
