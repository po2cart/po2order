/**
 * Matching Worker Handler
 *
 * After extraction, this worker:
 * 1. Loads extracted line items from the database
 * 2. Matches each product code against the workspace's product catalog
 * 3. Updates line items with matched productId and confidence
 * 4. Determines if the PO needs human review or can be auto-approved
 */

import { db } from "@po2order/db";
import { ProductMatcher } from "@po2order/matching";
import { CONFIDENCE_THRESHOLDS, type Product } from "@po2order/core";
import type { ProductMatchWarning } from "@po2order/matching";

export interface MatchingJobData {
  purchaseOrderId: string;
  workspaceId: string;
}

export async function processMatching(data: MatchingJobData): Promise<void> {
  const { purchaseOrderId, workspaceId } = data;

  const productMatcher = new ProductMatcher();

  // Load line items and product catalog
  const [lines, products] = await Promise.all([
    db.purchaseOrderLine.findMany({
      where: { purchaseOrderId },
      orderBy: { lineNumber: "asc" },
    }),
    loadProducts(workspaceId),
  ]);

  if (lines.length === 0) {
    console.log("[matching] No lines to match — skipping");
    return;
  }

  const allWarnings: ProductMatchWarning[] = [];
  let matchedCount = 0;
  let unmatchedCount = 0;

  // Match each line item
  for (const line of lines) {
    if (!line.productCode) {
      unmatchedCount++;
      continue;
    }

    const { match, warnings } = productMatcher.matchWithValidation(
      line.productCode,
      products,
      {
        quantity: line.quantity ? Number(line.quantity) : undefined,
        unit: line.unit ?? undefined,
      },
    );

    allWarnings.push(...warnings);

    if (match) {
      matchedCount++;
      await db.purchaseOrderLine.update({
        where: { id: line.id },
        data: {
          productId: match.item.id,
          productCodeConfidence: match.confidence,
        },
      });
    } else {
      unmatchedCount++;
    }
  }

  // Determine PO status based on matching results
  const totalLines = lines.length;
  const allMatched = unmatchedCount === 0;
  const hasWarnings = allWarnings.length > 0;

  // Auto-set status: if all lines matched with high confidence and no warnings → approved
  // Otherwise stays in review for human verification
  let newStatus = "review";
  if (allMatched && !hasWarnings) {
    // Check all confidences are above threshold
    const matchedLines = await db.purchaseOrderLine.findMany({
      where: { purchaseOrderId },
    });
    const allHighConfidence = matchedLines.every(
      (l) =>
        l.productCodeConfidence != null &&
        Number(l.productCodeConfidence) >= CONFIDENCE_THRESHOLDS.HIGH,
    );
    if (allHighConfidence) {
      newStatus = "approved";
    }
  }

  // Build warning notes
  const warningNotes = allWarnings
    .map((w) => `[${w.type}] ${w.message}`)
    .join("\n");

  await db.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: {
      status: newStatus,
      notes: warningNotes
        ? await appendNotes(purchaseOrderId, warningNotes)
        : undefined,
    },
  });

  console.log(
    `[matching] Done — ${matchedCount}/${totalLines} matched, ${unmatchedCount} unmatched, ${allWarnings.length} warnings → status: ${newStatus}`,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadProducts(workspaceId: string): Promise<Product[]> {
  const dbProducts = await db.product.findMany({
    where: { workspaceId },
  });

  return dbProducts.map((p) => ({
    id: p.id,
    workspaceId: p.workspaceId,
    code: p.code,
    description: p.description,
    barcode: p.barcode ?? undefined,
    unit: p.unit ?? undefined,
    price: p.price ? Number(p.price) : undefined,
    active: p.active,
  }));
}

async function appendNotes(
  purchaseOrderId: string,
  newNotes: string,
): Promise<string> {
  const po = await db.purchaseOrder.findUniqueOrThrow({
    where: { id: purchaseOrderId },
    select: { notes: true },
  });

  if (po.notes) {
    return `${po.notes}\n\n--- Matching Warnings ---\n${newNotes}`;
  }
  return `--- Matching Warnings ---\n${newNotes}`;
}
