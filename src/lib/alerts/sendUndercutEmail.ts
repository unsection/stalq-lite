import { Resend } from "resend";
import type { UndercutAlert } from "@/lib/alerts/detectUndercuts";

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const buildHtml = (alerts: UndercutAlert[]) => {
  const rows = alerts
    .map((alert) => {
      const previous =
        alert.previousPrice == null
          ? "—"
          : formatMoney(alert.previousPrice, alert.currency);
      const next = formatMoney(alert.newPrice, alert.currency);
      const yours = formatMoney(alert.ownPrice, alert.currency);
      const difference = formatMoney(alert.ownPrice - alert.newPrice, alert.currency);

      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(alert.ownProductName)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
            <a href="${escapeAttr(alert.competitorUrl)}" style="color:#111827;">${escapeHtml(alert.competitorName)}</a>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${previous} → ${next}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${yours}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#b91c1c;">-${difference}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#111827;line-height:1.5;">
      <h1 style="font-size:18px;margin:0 0 8px;">Competitor price undercuts</h1>
      <p style="margin:0 0 16px;color:#4b5563;">
        ${alerts.length} competitor${alerts.length === 1 ? "" : "s"} dropped below your price in the latest scheduled check.
      </p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr style="text-align:left;background:#f9fafb;">
            <th style="padding:8px 12px;">Your product</th>
            <th style="padding:8px 12px;">Competitor</th>
            <th style="padding:8px 12px;">Price change</th>
            <th style="padding:8px 12px;">Your price</th>
            <th style="padding:8px 12px;">Gap</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const escapeAttr = (value: string) => escapeHtml(value).replaceAll("'", "&#39;");

export type SendUndercutEmailResult =
  | { sent: false; reason: "missing_env" | "empty" | "error"; message?: string }
  | { sent: true; id: string | null };

export const sendUndercutEmail = async (
  alerts: UndercutAlert[],
): Promise<SendUndercutEmailResult> => {
  if (alerts.length === 0) {
    return { sent: false, reason: "empty" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ALERT_EMAIL_FROM?.trim();
  const to = process.env.ALERT_EMAIL_TO?.trim();

  if (!apiKey || !from || !to) {
    console.warn(
      "[alerts] Skipping undercut email — set RESEND_API_KEY, ALERT_EMAIL_FROM, and ALERT_EMAIL_TO",
    );
    return { sent: false, reason: "missing_env" };
  }

  const subject =
    alerts.length === 1
      ? "Stalq: 1 competitor undercut your price"
      : `Stalq: ${alerts.length} competitors undercut your price`;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html: buildHtml(alerts),
    });

    if (error) {
      console.error("[alerts] Resend error:", error);
      return { sent: false, reason: "error", message: error.message };
    }

    return { sent: true, id: data?.id ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("[alerts] Failed to send undercut email:", message);
    return { sent: false, reason: "error", message };
  }
};
