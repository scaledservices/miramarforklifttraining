import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

export interface IPdfStore {
  exists(relativePath: string): Promise<boolean>;
  write(relativePath: string, data: Buffer): Promise<void>;
  read(relativePath: string): Promise<Buffer>;
  getFullPath(relativePath: string): string;
}

export class LocalPdfStore implements IPdfStore {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), "server", "generated-pdfs");
  }

  async exists(relativePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(relativePath);
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async write(relativePath: string, data: Buffer): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    const dir = path.dirname(fullPath);
    await fs.promises.mkdir(dir, { recursive: true });

    const tmpFile = path.join(dir, `.tmp-${crypto.randomBytes(8).toString("hex")}`);
    try {
      await fs.promises.writeFile(tmpFile, data);
      await fs.promises.rename(tmpFile, fullPath);
    } catch (err) {
      try { await fs.promises.unlink(tmpFile); } catch {}
      throw err;
    }
  }

  async read(relativePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(relativePath);
    return fs.promises.readFile(fullPath);
  }

  getFullPath(relativePath: string): string {
    return path.join(this.baseDir, relativePath);
  }
}

export class ObjectPdfStore implements IPdfStore {
  async exists(_relativePath: string): Promise<boolean> {
    throw new Error("ObjectPdfStore not implemented. Configure S3/R2 credentials and implement.");
  }
  async write(_relativePath: string, _data: Buffer): Promise<void> {
    throw new Error("ObjectPdfStore not implemented. Configure S3/R2 credentials and implement.");
  }
  async read(_relativePath: string): Promise<Buffer> {
    throw new Error("ObjectPdfStore not implemented. Configure S3/R2 credentials and implement.");
  }
  getFullPath(_relativePath: string): string {
    throw new Error("ObjectPdfStore not implemented.");
  }
}

const mode = process.env.PDF_STORAGE_MODE || "local";

export const pdfStore: IPdfStore = mode === "object"
  ? new ObjectPdfStore()
  : new LocalPdfStore();
