import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Search KEDBs
  app.post("/api/kedbs/search", async (req, res) => {
    try {
      const { incidentDescription } = req.body;
      
      if (!incidentDescription || typeof incidentDescription !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Incident description is required",
        });
      }
      
      // Log search request
      await storage.createSearchRequest({ query: incidentDescription });
      
      const results = await storage.searchKEDBs(incidentDescription);
      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      console.error("Search KEDBs error:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to search KEDBs" 
      });
    }
  });

  // Get specific KEDB by ID
  app.get("/api/kedbs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const kedb = await storage.getKEDBById(id);
      
      if (!kedb) {
        return res.status(404).json({ 
          success: false, 
          message: "KEDB not found" 
        });
      }
      
      res.json({ success: true, data: kedb });
    } catch (error) {
      console.error("Get KEDB error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve KEDB" 
      });
    }
  });

  // Generate new KEDB
  app.post("/api/kedbs/generate", async (req, res) => {
    try {
      const { incidentDescription } = req.body;
      
      if (!incidentDescription || typeof incidentDescription !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Incident description is required",
        });
      }
      
      const generatedKEDB = await storage.generateKEDB(incidentDescription);
      res.json({ success: true, data: generatedKEDB });
    } catch (error) {
      console.error("Generate KEDB error:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to generate KEDB" 
      });
    }
  });

  // Update KEDB
  app.put("/api/kedbs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedKEDB = await storage.updateKEDB(id, updates);
      
      if (!updatedKEDB) {
        return res.status(404).json({ 
          success: false, 
          message: "KEDB not found" 
        });
      }
      
      res.json({ success: true, data: updatedKEDB });
    } catch (error) {
      console.error("Update KEDB error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update KEDB" 
      });
    }
  });

  // Download KEDB content
  app.get("/api/kedbs/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const kedb = await storage.getKEDBById(id);
      
      if (!kedb) {
        return res.status(404).json({ 
          success: false, 
          message: "KEDB not found" 
        });
      }
      
      const filename = `${kedb.id}_${kedb.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      const content = `${kedb.title}\n\n${kedb.content}`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      console.error("Download KEDB error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to download KEDB" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}