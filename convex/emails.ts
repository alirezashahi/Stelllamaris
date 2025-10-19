import { action, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Define the type for a single order item based on the schema
type OrderItem = {
  productName: string;
  variantName?: string;
  quantity: number;
  totalPrice: number;
};

// Define the type for the order based on getOrderByNumber query
type Order = {
  _id: any;
  orderNumber: string;
  email: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  charityDonationAmount: number;
  selectedCharityType?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
};

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

function charityName(code?: string) {
  if (!code) return "Charity";
  switch (code) {
    case "animal_shelter":
      return "Animal Shelters";
    case "environmental":
      return "Environmental Causes";
    case "children":
      return "Children's Education";
    case "education":
      return "Adult Education";
    default:
      return "Charity";
  }
}

function renderOrderEmailHtml(order: Order): string {
  const itemsHtml = order.items
    .map(
      (item: OrderItem) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#111;">${item.productName}${item.variantName ? ` – ${item.variantName}` : ""}</div>
            <div style="font-size:12px;color:#555;">Qty: ${item.quantity}</div>
          </td>
          <td style="padding:8px;text-align:right;border-bottom:1px solid #eee;color:#111;">${formatMoney(item.totalPrice)}</td>
        </tr>
      `
    )
    .join("");

  const shipping = order.shippingAddress;

  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;background:#f0fdf4;border-bottom:1px solid #e5e7eb;">
        <h1 style="margin:0;font-size:20px;color:#065f46;">Order Confirmed</h1>
        <p style="margin:4px 0 0;color:#065f46;">Thank you for your purchase! Your order has been placed.</p>
      </div>

      <div style="padding:24px;">
        <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:16px;">
          <div>
            <div style="font-size:12px;color:#6b7280;">Order Number</div>
            <div style="font-weight:600;color:#111827;">${order.orderNumber}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;color:#6b7280;">Total</div>
            <div style="font-weight:600;color:#111827;">${formatMoney(order.totalAmount)}</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-top:8px;">${itemsHtml}</table>

        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
          <div style="display:flex;justify-content:space-between;color:#111827;">
            <div>Subtotal</div>
            <div>${formatMoney(order.subtotal)}</div>
          </div>
          <div style="display:flex;justify-content:space-between;color:#111827;margin-top:6px;">
            <div>Tax</div>
            <div>${formatMoney(order.taxAmount)}</div>
          </div>
          <div style="display:flex;justify-content:space-between;color:#111827;margin-top:6px;">
            <div>Shipping</div>
            <div>${formatMoney(order.shippingAmount)}</div>
          </div>
          ${order.discountAmount > 0 ? `
          <div style="display:flex;justify-content:space-between;color:#111827;margin-top:6px;">
            <div>Discount</div>
            <div>−${formatMoney(order.discountAmount)}</div>
          </div>` : ""}
          ${order.charityDonationAmount > 0 ? `
          <div style="display:flex;justify-content:space-between;color:#111827;margin-top:6px;">
            <div>Charity Donation (${charityName(order.selectedCharityType)})</div>
            <div>${formatMoney(order.charityDonationAmount)}</div>
          </div>` : ""}
        </div>

        <div style="margin-top:20px;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
          <div style="font-weight:600;color:#111827;margin-bottom:8px;">Shipping Address</div>
          <div style="color:#374151;">
            ${shipping.firstName} ${shipping.lastName}<br />
            ${shipping.addressLine1}${shipping.addressLine2 ? `, ${shipping.addressLine2}` : ""}<br />
            ${shipping.city}, ${shipping.state} ${shipping.zipCode}<br />
            ${shipping.country}
          </div>
        </div>

        <div style="margin-top:24px;color:#6b7280;font-size:12px;">
          You’ll receive tracking details when your order ships. If you have any questions, reply to this email.
        </div>
      </div>
    </div>
  </div>
  `;
}

export const sendOrderConfirmationEmail = action({
  args: {
    orderNumber: v.string(),
  },
  handler: async (ctx, args): Promise<{ status: string; id?: string }> => {
    "use node";

    console.log("[emails] sendOrderConfirmationEmail invoked", { orderNumber: args.orderNumber });

    const order: Order | null = await ctx.runQuery(api.orders.getOrderByNumber, {
      orderNumber: args.orderNumber,
    });

    console.log("[emails] getOrderByNumber result", order ? { orderNumber: order.orderNumber, email: order.email } : null);

    if (!order) {
      return { status: "not_found" };
    }

    const hasApiKey = !!process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "orders@stellamaris.com";
    const fromName = process.env.EMAIL_FROM_NAME || "Stellamaris";

    console.log("[emails] env check", { hasApiKey, fromEmail, fromName });

    if (!hasApiKey) {
      throw new Error("RESEND_API_KEY not configured in Convex environment");
    }

    const html = renderOrderEmailHtml(order);

    console.log("[emails] sending to Resend", { to: order.email, from: `${fromName} <${fromEmail}>` });

    const response: Response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [order.email],
        subject: `Order ${order.orderNumber} Confirmation`,
        html,
      }),
    });

    const data: any = await response.json().catch(() => ({}));
    console.log("[emails] Resend response", { status: response.status, ok: response.ok, data });

    if (!response.ok) {
      throw new Error(
        typeof data === "object" && data && (data as any).error?.message
          ? (data as any).error.message
          : `Resend API error (${response.status})`
      );
    }

    return { status: "sent", id: (data as any)?.id };
  },
});