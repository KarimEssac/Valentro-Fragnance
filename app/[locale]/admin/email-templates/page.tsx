import AdminEmailTemplatesClient from "@/components/admin/AdminEmailTemplatesClient";
import {renderBulkDiscountEmailTemplate} from "@/lib/bulk-discount-email";
import {renderNewsletterEmailTemplate} from "@/lib/newsletter-email";
import {
  renderRestockDemandOwnerEmailTemplate,
  renderRestockEmailTemplate
} from "@/lib/restock-email";
import {
  orderEmailTemplateKinds,
  renderOrderEmailTemplate,
  type OrderEmailOrder
} from "@/lib/order-email";

type AdminEmailTemplatesPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const previewOrder: OrderEmailOrder = {
  id: "cmailpreview2026order",
  status: "PENDING",
  paymentMethod: "CASH_ON_DELIVERY",
  subtotal: "2600",
  discountAmount: "150",
  total: "2450",
  addressSnapshot: {
    firstName: "Layla",
    lastName: "Hassan",
    address: "14 Garden City Avenue",
    apartment: "Apartment 8",
    city: "Cairo",
    governorate: "Cairo",
    postalCode: "11511",
    phone: "+20 100 555 0198",
    country: "Egypt"
  },
  createdAt: "2026-07-18T10:30:00.000Z",
  user: {
    name: "Layla Hassan",
    email: "layla.customer@example.com"
  },
  items: [
    {
      fragranceNameEn: "Valentino Uomo",
      sizeML: 100,
      quantity: 1,
      unitPrice: "1650",
      totalPrice: "1650"
    },
    {
      fragranceNameEn: "Emporio Armani",
      sizeML: 50,
      quantity: 1,
      unitPrice: "950",
      totalPrice: "950"
    }
  ]
};

export default async function AdminEmailTemplatesPage({
  params
}: AdminEmailTemplatesPageProps) {
  const {locale} = await params;
  const orderTemplates = orderEmailTemplateKinds.map((kind) =>
    renderOrderEmailTemplate(kind, previewOrder)
  );
  const newsletterTemplate = renderNewsletterEmailTemplate(
    "The Autumn Collection Reveal",
    "A new chapter in the atelier is now open.\n\nDiscover the season’s considered collection, selected for evenings that linger.",
    "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613528/valentro/site/hero-bg-light.webp"
  );
  const restockTemplate = renderRestockEmailTemplate({
    locale: "en",
    variant: {
      sizeML: 50,
      fragrance: {
        slug: "emporio-armani",
        nameEn: "Emporio Armani",
        nameAr: "Emporio Armani",
        imageUrl: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613530/valentro/fragrances/emporio-armani.webp"
      }
    }
  });
  const restockOwnerTemplate = renderRestockDemandOwnerEmailTemplate({
    requestId: "crestockpreview2026",
    requesterEmail: "layla.customer@example.com",
    requestedAt: "2026-07-18T10:30:00.000Z",
    variant: {
      sizeML: 50,
      fragrance: {
        slug: "emporio-armani",
        nameEn: "Emporio Armani",
        nameAr: "Emporio Armani",
        imageUrl: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613530/valentro/fragrances/emporio-armani.webp"
      }
    }
  });
  const bulkDiscountTemplate = renderBulkDiscountEmailTemplate({
    coupon: {
      id: "cbulkpreview2026",
      code: "BULK-VIP15",
      type: "PERCENTAGE",
      value: "15",
      minOrderAmount: "1200",
      startsAt: "2026-08-01T00:00:00.000Z",
      expiresAt: "2026-08-31T23:59:59.000Z"
    },
    recipient: {
      id: "ccustomerpreview2026",
      name: "Layla Hassan",
      email: "layla.customer@example.com"
    }
  });

  return (
    <AdminEmailTemplatesClient
      locale={locale}
      templates={[
        ...orderTemplates,
        bulkDiscountTemplate,
        newsletterTemplate,
        restockTemplate,
        restockOwnerTemplate
      ]}
    />
  );
}
