// backend/src/routes/apy.ts
import { Router, Request, Response, NextFunction } from 'express';
// Legacy APY routes removed. File retained only to prevent import errors if referenced elsewhere.
// Prefer /api/envio/* endpoints backed by Envio HyperIndex.

export function apyRoutes() {
  const router = Router();
  // No routes: legacy endpoints removed

  return router;
}