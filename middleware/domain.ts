import { Request, Response, NextFunction } from "express";
import { pool } from "../models/db.ts";

export const domainMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const host = req.headers.host;
  if (!host) return next();

  // Define main domains that should not be treated as custom domains
  const mainDomains = [
    "lookprice.net",
    "www.lookprice.net",
    "ais-dev-fw5matlno23z7prjfvwxwu-416165499277.europe-west2.run.app", // AI Studio Dev URL
    "ais-pre-fw5matlno23z7prjfvwxwu-416165499277.europe-west2.run.app", // AI Studio Preview URL
    "localhost:3000",
    "0.0.0.0:3000"
  ];

  // If it's a main domain, just continue
  if (mainDomains.some(d => host.includes(d))) {
    return next();
  }

  try {
    // Check if this host is a custom domain for any store
    const result = await pool.query("SELECT slug FROM stores WHERE custom_domain = $1", [host]);
    
    if (result.rows.length > 0) {
      const storeSlug = result.rows[0].slug;
      
      // If the path is already for a store or scan, don't rewrite
      if (req.url.startsWith("/s/") || req.url.startsWith("/store/") || req.url.startsWith("/scan/") || req.url.startsWith("/api/")) {
        return next();
      }

      // Rewrite the URL internally to serve the store showcase
      // We use req.url for internal routing in Express
      req.url = `/s/${storeSlug}${req.url === "/" ? "" : req.url}`;
      console.log(`Custom domain ${host} mapped to store ${storeSlug}. New URL: ${req.url}`);
    }
  } catch (error) {
    console.error("Domain middleware error:", error);
  }

  next();
};
