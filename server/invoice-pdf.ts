import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { pdfStore } from "./pdf-store";
import { db } from "./db";
import { orders, orderItems, courses, users, groups } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { SHIPPING_RATES } from "./constants";
import { brand } from "@shared/config/brand";
import { theme } from "@shared/config/theme";

function getLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "client/public/images", brand.logo.serverFile),
    path.join(process.cwd(), "dist/public/images", brand.logo.serverFile),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getInvoicePath(invoiceNumber: string): string {
  return `invoices/${invoiceNumber}.pdf`;
}

export async function generateInvoiceNumber(orderId: number): Promise<string> {
  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new Error(`Order ${orderId} not found`);

    if (order.invoiceNumber) return order.invoiceNumber;

    const seqResult = await tx.execute(
      sql`SELECT ${brand.prefixes.invoiceNumber + '-'} || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('invoice_number_seq')::text, 6, '0') AS invoice_number`
    );
    const rows = seqResult as any;
    const invoiceNumber = (rows[0]?.invoice_number || rows.rows?.[0]?.invoice_number) as string;
    if (!invoiceNumber) throw new Error("Failed to generate invoice number from sequence");

    await tx.update(orders).set({ invoiceNumber, updatedAt: new Date() }).where(eq(orders.id, orderId));

    return invoiceNumber;
  });

  return result;
}

export async function generateInvoicePdf(orderId: number): Promise<string> {
  const invoiceNumber = await generateInvoiceNumber(orderId);
  const relativePath = getInvoicePath(invoiceNumber);

  const exists = await pdfStore.exists(relativePath);
  if (exists) return relativePath;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new Error(`Order ${orderId} not found`);

  const [user] = await db.select().from(users).where(eq(users.id, order.userId));
  if (!user) throw new Error(`User not found for order ${orderId}`);

  const items = await db.select({
    quantity: orderItems.quantity,
    unitPrice: orderItems.unitPrice,
    courseTitle: courses.title,
  }).from(orderItems)
    .innerJoin(courses, eq(orderItems.courseId, courses.id))
    .where(eq(orderItems.orderId, orderId));

  let groupName: string | null = null;
  if (order.groupId) {
    const [group] = await db.select().from(groups).where(eq(groups.id, order.groupId));
    if (group) groupName = group.name;
  }

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margins: { top: 50, bottom: 50, left: 50, right: 50 } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const logoPath = getLogoPath();
    if (logoPath) {
      doc.image(logoPath, 50, 45, { height: 40 });
    } else {
      doc.fontSize(20).fillColor(theme.pdf.titleColor).text(brand.name.toUpperCase(), 50, 50);
    }
    doc.fontSize(10).fillColor(theme.colors.text.medium).text(brand.domain, 50, 90);

    doc.fontSize(24).fillColor(theme.pdf.titleColor).text("INVOICE", 400, 50, { align: "right" });

    doc.moveDown(2);
    const infoY = 120;
    doc.fontSize(10).fillColor(theme.colors.text.dark);
    doc.text(`Invoice Number: ${invoiceNumber}`, 50, infoY);
    doc.text(`Order Number: ${order.orderNumber}`, 50, infoY + 15);
    doc.text(`Date: ${new Date(order.createdAt!).toLocaleDateString("en-US")}`, 50, infoY + 30);
    doc.text(`Status: ${order.status.toUpperCase()}`, 50, infoY + 45);

    doc.text(`Bill To:`, 350, infoY);
    doc.text(user.name, 350, infoY + 15);
    doc.text(user.email, 350, infoY + 30);
    if (groupName) doc.text(`Company: ${groupName}`, 350, infoY + 45);

    const tableTop = infoY + 80;
    doc.rect(50, tableTop, 512, 25).fill(theme.pdf.tableHeaderBg);
    doc.fontSize(10).fillColor(theme.pdf.tableHeaderText);
    doc.text("Item", 60, tableTop + 7, { width: 250 });
    doc.text("Qty", 320, tableTop + 7, { width: 50, align: "center" });
    doc.text("Unit Price", 380, tableTop + 7, { width: 80, align: "right" });
    doc.text("Total", 470, tableTop + 7, { width: 80, align: "right" });

    let rowY = tableTop + 30;
    let subtotal = 0;
    doc.fillColor(theme.colors.text.dark);

    for (const item of items) {
      const lineTotal = Number(item.unitPrice) * item.quantity;
      subtotal += lineTotal;

      if (rowY % 2 === 0) {
        doc.rect(50, rowY - 5, 512, 20).fill(theme.colors.background.row);
        doc.fillColor(theme.colors.text.dark);
      }

      doc.text(item.courseTitle, 60, rowY, { width: 250 });
      doc.text(String(item.quantity), 320, rowY, { width: 50, align: "center" });
      doc.text(`$${Number(item.unitPrice).toFixed(2)}`, 380, rowY, { width: 80, align: "right" });
      doc.text(`$${lineTotal.toFixed(2)}`, 470, rowY, { width: 80, align: "right" });
      rowY += 22;
    }

    doc.moveTo(50, rowY + 5).lineTo(562, rowY + 5).lineWidth(0.5).strokeColor(theme.colors.border.light).stroke();

    const summaryY = rowY + 15;
    doc.fontSize(10).fillColor(theme.colors.text.medium);
    doc.text("Subtotal:", 380, summaryY, { width: 80, align: "right" });
    doc.fillColor(theme.colors.text.dark).text(`$${subtotal.toFixed(2)}`, 470, summaryY, { width: 80, align: "right" });

    doc.fillColor(theme.colors.text.medium).text("Shipping:", 380, summaryY + 18, { width: 80, align: "right" });
    doc.fillColor(theme.colors.text.dark).text("$0.00", 470, summaryY + 18, { width: 80, align: "right" });

    doc.fillColor(theme.colors.text.medium).text("Tax:", 380, summaryY + 36, { width: 80, align: "right" });
    doc.fillColor(theme.colors.text.dark).text("$0.00", 470, summaryY + 36, { width: 80, align: "right" });

    doc.moveTo(380, summaryY + 54).lineTo(562, summaryY + 54).lineWidth(1).strokeColor(theme.pdf.totalLineColor).stroke();

    doc.fontSize(14).fillColor(theme.pdf.titleColor).text("Total:", 370, summaryY + 60, { width: 90, align: "right" });
    doc.text(`$${Number(order.total).toFixed(2)}`, 470, summaryY + 60, { width: 80, align: "right" });

    const footerY = 720;
    doc.fontSize(8).fillColor(theme.pdf.footerText).text(`${brand.legalEntity} | ${brand.domain}`, 50, footerY, { align: "center", width: 512 });
    doc.text("Thank you for your business!", 50, footerY + 12, { align: "center", width: 512 });

    doc.end();
  });

  await pdfStore.write(relativePath, pdfBuffer);
  return relativePath;
}
