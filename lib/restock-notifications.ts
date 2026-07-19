import {prisma} from "@/lib/prisma";
import {
  renderRestockDemandOwnerEmailTemplate,
  renderRestockEmailTemplate,
  type RestockDemandOwnerEmailRequest
} from "@/lib/restock-email";

export type RestockNotificationResult = {
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
  configured: boolean;
};

function isBlockedTestAddress(email: string) {
  const domain = email.split("@").pop()?.toLowerCase();

  return Boolean(
    domain &&
      [
        "example.com",
        "example.net",
        "example.org",
        "test.com",
        "test.net",
        "test.org"
      ].includes(domain)
  );
}

export async function sendRestockNotifications(
  variantIds: string[]
): Promise<RestockNotificationResult> {
  const uniqueVariantIds = [...new Set(variantIds)];

  if (uniqueVariantIds.length === 0) {
    return {pending: 0, sent: 0, failed: 0, skipped: 0, configured: true};
  }

  const requests = await prisma.restockRequest.findMany({
    where: {
      variantId: {in: uniqueVariantIds},
      notifiedAt: null,
      variant: {stock: {gt: 0}}
    },
    orderBy: {requestedAt: "asc"},
    select: {
      id: true,
      email: true,
      locale: true,
      requestedAt: true,
      variant: {
        select: {
          sizeML: true,
          fragrance: {
            select: {
              slug: true,
              nameEn: true,
              nameAr: true,
              images: {
                orderBy: [{isPrimary: "desc"}, {position: "asc"}],
                take: 1,
                select: {url: true}
              }
            }
          }
        }
      }
    }
  });

  if (requests.length === 0) {
    return {pending: 0, sent: 0, failed: 0, skipped: 0, configured: true};
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      pending: requests.length,
      sent: 0,
      failed: requests.length,
      skipped: 0,
      configured: false
    };
  }

  const usesResendTestSender = from.toLowerCase().includes("@resend.dev");
  const sendable = requests.filter(
    (request) =>
      !isBlockedTestAddress(request.email) &&
      (!usesResendTestSender || request.email.toLowerCase().endsWith("@resend.dev"))
  );
  const skipped = requests.length - sendable.length;
  const successfulIds: string[] = [];
  let failed = 0;

  for (let index = 0; index < sendable.length; index += 20) {
    const batch = sendable.slice(index, index + 20);
    const outcomes = await Promise.all(
      batch.map(async (request) => {
        const content = renderRestockEmailTemplate({
          ...request,
          variant: {
            ...request.variant,
            fragrance: {
              ...request.variant.fragrance,
              imageUrl: request.variant.fragrance.images[0]?.url ?? null
            }
          }
        });

        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "Idempotency-Key": `restock-${request.id}-${request.requestedAt.getTime()}`
            },
            body: JSON.stringify({
              from,
              to: [request.email],
              subject: content.subject,
              html: content.html,
              text: content.text
            }),
            signal: AbortSignal.timeout(10_000)
          });

          if (!response.ok) {
            const providerError = (await response.json().catch(() => null)) as
              | {message?: string}
              | null;
            console.error(
              "Restock notification provider rejected an email:",
              providerError?.message ?? response.status
            );
            return false;
          }

          successfulIds.push(request.id);
          return true;
        } catch (error) {
          console.error(
            "Restock notification delivery failed:",
            error instanceof Error ? error.message : "Unknown error"
          );
          return false;
        }
      })
    );

    failed += outcomes.filter((sent) => !sent).length;
  }

  if (successfulIds.length > 0) {
    await prisma.restockRequest.deleteMany({
      where: {id: {in: successfulIds}}
    });
  }

  return {
    pending: requests.length,
    sent: successfulIds.length,
    failed,
    skipped,
    configured: true
  };
}

function isResendTestSender(from: string) {
  return from.toLowerCase().includes("@resend.dev");
}

export async function sendRestockDemandOwnerEmail(
  request: RestockDemandOwnerEmailRequest
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  const ownerEmail = (
    process.env.ORDER_NOTIFICATION_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ""
  ).trim().toLowerCase();

  if (!apiKey || !from || !ownerEmail) {
    console.warn("Restock demand owner email skipped because email delivery is not configured");
    return {sent: false, reason: "Email delivery is not configured"};
  }

  if (
    isBlockedTestAddress(ownerEmail) ||
    (isResendTestSender(from) && !ownerEmail.endsWith("@resend.dev"))
  ) {
    console.warn(`Restock demand owner email skipped for ${ownerEmail}`);
    return {sent: false, reason: "Recipient is not permitted by the email test configuration"};
  }

  const template = renderRestockDemandOwnerEmailTemplate(request);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `restock-demand-owner-${request.requestId}-${new Date(request.requestedAt).getTime()}`
      },
      body: JSON.stringify({
        from,
        to: [ownerEmail],
        subject: template.subject,
        html: template.html,
        text: template.text
      }),
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      const providerError = (await response.json().catch(() => null)) as
        | {message?: string}
        | null;
      console.error(
        "Restock demand owner email was rejected:",
        providerError?.message ?? response.status
      );
      return {sent: false, reason: providerError?.message ?? `Provider returned ${response.status}`};
    }

    return {sent: true};
  } catch (error) {
    console.error(
      "Restock demand owner email failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {sent: false, reason: error instanceof Error ? error.message : "Unknown error"};
  }
}
