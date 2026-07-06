import type { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { bookingPhotos, type BookingPhoto } from "@shared/schema";
import { requireAuth, requireRole } from "./middleware";

const UPLOAD_DIR = path.resolve(process.cwd(), "client/public/uploads/booking-photos");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export function registerPhotoRoutes(app: Express) {
  // POST /api/admin/bookings/:id/photos — upload a photo for a booking
  app.post(
    "/api/admin/bookings/:id/photos",
    requireRole("admin", "super_admin"),
    upload.single("photo"),
    async (req: Request, res: Response) => {
      try {
        const bookingId = Number(req.params.id);
        if (!Number.isFinite(bookingId)) {
          return res.status(400).json({ error: "Invalid booking id" });
        }
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const url = `/uploads/booking-photos/${req.file.filename}`;
        const caption = (req.body.caption as string | undefined) || null;
        const uploadedBy = req.session.userId!;

        const [photo] = await db
          .insert(bookingPhotos)
          .values({ bookingId, url, caption, uploadedBy })
          .returning();

        res.status(201).json(photo);
      } catch (err) {
        console.error("[photos] upload error:", err);
        res.status(500).json({ error: "Failed to upload photo" });
      }
    },
  );

  // GET /api/bookings/:id/photos — list all photos for a booking (auth required)
  app.get(
    "/api/bookings/:id/photos",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const bookingId = Number(req.params.id);
        if (!Number.isFinite(bookingId)) {
          return res.status(400).json({ error: "Invalid booking id" });
        }
        const photos: BookingPhoto[] = await db
          .select()
          .from(bookingPhotos)
          .where(eq(bookingPhotos.bookingId, bookingId));
        res.json(photos);
      } catch (err) {
        console.error("[photos] list error:", err);
        res.status(500).json({ error: "Failed to list photos" });
      }
    },
  );

  // PATCH /api/admin/bookings/:id/photos/:photoId — update caption
  app.patch(
    "/api/admin/bookings/:id/photos/:photoId",
    requireRole("admin", "super_admin"),
    async (req: Request, res: Response) => {
      try {
        const photoId = Number(req.params.photoId);
        if (!Number.isFinite(photoId)) {
          return res.status(400).json({ error: "Invalid photo id" });
        }
        const { caption } = req.body as { caption?: string };
        const [updated] = await db
          .update(bookingPhotos)
          .set({ caption: caption ?? null })
          .where(eq(bookingPhotos.id, photoId))
          .returning();
        if (!updated) {
          return res.status(404).json({ error: "Photo not found" });
        }
        res.json(updated);
      } catch (err) {
        console.error("[photos] update caption error:", err);
        res.status(500).json({ error: "Failed to update caption" });
      }
    },
  );

  // DELETE /api/admin/bookings/:id/photos/:photoId — delete a photo
  app.delete(
    "/api/admin/bookings/:id/photos/:photoId",
    requireRole("admin", "super_admin"),
    async (req: Request, res: Response) => {
      try {
        const bookingId = Number(req.params.id);
        const photoId = Number(req.params.photoId);
        if (!Number.isFinite(bookingId) || !Number.isFinite(photoId)) {
          return res.status(400).json({ error: "Invalid id" });
        }

        const [photo] = await db
          .select()
          .from(bookingPhotos)
          .where(and(eq(bookingPhotos.id, photoId), eq(bookingPhotos.bookingId, bookingId)));

        if (!photo) {
          return res.status(404).json({ error: "Photo not found" });
        }

        // Delete file from disk
        const filePath = path.resolve(process.cwd(), `client/public${photo.url}`);
        try {
          fs.unlinkSync(filePath);
        } catch {
          // File may not exist on disk; continue with DB delete
        }

        await db.delete(bookingPhotos).where(eq(bookingPhotos.id, photoId));
        res.json({ success: true });
      } catch (err) {
        console.error("[photos] delete error:", err);
        res.status(500).json({ error: "Failed to delete photo" });
      }
    },
  );
}
