/**
 * Geo region endpoint — GET /api/geo/region
 *
 * Returns the detected region for the current visitor. Used by the client
 * useRegion() hook to decide whether to show the online-first hero.
 */
import type { Express, Request, Response } from "express";
import { getClientIp, getRegionFromIp, type RegionInfo } from "../geo";

export function registerGeoRoutes(app: Express) {
  app.get("/api/geo/region", async (req: Request, res: Response) => {
    try {
      const ip = getClientIp(req);
      const region: RegionInfo = await getRegionFromIp(ip);
      return res.status(200).json(region);
    } catch (err) {
      console.error("[geo] /api/geo/region error:", err);
      // Fail open: default to full service-area experience.
      return res.status(200).json({ state: "", isServiceArea: true });
    }
  });
}
