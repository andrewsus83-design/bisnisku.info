import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookToken,
  isEventProcessed,
  recordWebhookEvent,
  markEventProcessed,
  markEventFailed,
  handleInvoicePaid,
  handleInvoiceExpired,
  handleRecurringEvent,
} from "@/lib/xendit/webhooks";

/**
 * POST /api/webhooks/xendit
 *
 * Receives webhook callbacks from Xendit for:
 * - Invoice status changes (paid, expired, failed)
 * - Recurring plan events (cycle succeeded, failed, plan deactivated)
 *
 * Security: Verifies x-callback-token header.
 * Idempotency: Deduplicates by Xendit callback ID.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook token
    const callbackToken = request.headers.get("x-callback-token") ?? "";
    if (!verifyWebhookToken(callbackToken)) {
      console.error("Xendit webhook: invalid callback token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();

    // 3. Determine event type and ID
    const eventId =
      body.id ?? body.callback_virtual_account_id ?? crypto.randomUUID();
    const eventType = detectEventType(body);

    // 4. Idempotency check
    if (await isEventProcessed(eventId)) {
      return NextResponse.json({ status: "already_processed" });
    }

    // 5. Record event
    await recordWebhookEvent(eventId, eventType, body);

    // 6. Process based on event type
    try {
      switch (eventType) {
        case "invoice.paid":
          await handleInvoicePaid({
            id: body.id,
            external_id: body.external_id,
            status: body.status,
            amount: body.amount,
            paid_amount: body.paid_amount,
            payment_method: body.payment_method,
            payment_channel: body.payment_channel,
            paid_at: body.paid_at,
          });
          break;

        case "invoice.expired":
          await handleInvoiceExpired({
            external_id: body.external_id,
          });
          break;

        case "recurring":
          await handleRecurringEvent({
            type: body.event,
            data: body.data,
          });
          break;

        default:
          console.log(`Xendit webhook: unhandled event type "${eventType}"`);
      }

      await markEventProcessed(eventId);
    } catch (processingError) {
      const errMsg =
        processingError instanceof Error
          ? processingError.message
          : "Unknown error";
      await markEventFailed(eventId, errMsg);
      console.error("Xendit webhook processing error:", processingError);
      // Still return 200 to prevent Xendit retries on business logic errors
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Xendit webhook error:", error);
    // Return 500 only for unexpected errors — Xendit will retry
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Detect event type from Xendit payload */
function detectEventType(body: Record<string, unknown>): string {
  // Recurring events have an "event" field like "recurring.cycle.succeeded"
  if (typeof body.event === "string" && body.event.startsWith("recurring.")) {
    return "recurring";
  }

  // Invoice callbacks have "status" field
  if (body.status === "PAID") return "invoice.paid";
  if (body.status === "EXPIRED") return "invoice.expired";
  if (body.status === "FAILED") return "invoice.failed";

  return "unknown";
}
