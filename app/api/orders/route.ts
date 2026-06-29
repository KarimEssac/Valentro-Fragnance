import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {Prisma, PaymentMethod} from "@prisma/client";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";
import {randomBytes} from "crypto";
import {hash} from "bcryptjs";

import {authOptions} from "@/lib/auth";
import {validateCsrfToken, csrfCookieName} from "@/lib/csrf";
import {prisma} from "@/lib/prisma";

type OrderItemInput = {
  variantId: unknown;
  quantity: unknown;
};

type CheckoutPayload = {
  csrfToken?: unknown;
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  address?: unknown;
  apartment?: unknown;
  city?: unknown;
  governorate?: unknown;
  postalCode?: unknown;
  phone?: unknown;
  notes?: unknown;
  paymentMethod?: unknown;
  billingAddress?: unknown;
  items?: unknown;
};

const egyptGovernorates = new Set([
  "Alexandria",
  "Aswan",
  "Asyut",
  "Beheira",
  "Beni Suef",
  "Cairo",
  "Dakahlia",
  "Damietta",
  "Faiyum",
  "Gharbia",
  "Giza",
  "Ismailia",
  "Kafr El Sheikh",
  "Luxor",
  "Matruh",
  "Minya",
  "Monufia",
  "New Valley",
  "North Sinai",
  "Port Said",
  "Qalyubia",
  "Qena",
  "Red Sea",
  "Sharqia",
  "Sohag",
  "South Sinai",
  "Suez"
]);

const deniedSpecialCharacters = /[<>{}[\]$;'"`|\\]/;
const namePattern = /^[\p{L}\s-]+$/u;
const addressPattern = /^[\p{L}\p{N}\s.,/-]+$/u;
const phonePattern = /^\+?[0-9\s-]{8,18}$/;
const postalPattern = /^[0-9-]{3,12}$/;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function validateText(
  value: unknown,
  label: string,
  options: {
    max: number;
    min?: number;
    pattern?: RegExp;
    required?: boolean;
  }
) {
  const text = asString(value);

  if (!text) {
    if (options.required === false) return "";
    throw new Error(`${label} is required`);
  }

  if (text.length < (options.min ?? 1) || text.length > options.max) {
    throw new Error(`${label} has an invalid length`);
  }

  if (deniedSpecialCharacters.test(text)) {
    throw new Error(`${label} contains unsupported characters`);
  }

  if (options.pattern && !options.pattern.test(text)) {
    throw new Error(`${label} contains unsupported characters`);
  }

  return text;
}

function validateCheckoutPayload(payload: CheckoutPayload) {
  const email = validateText(payload.email, "Email", {
    max: 120,
    pattern: /^[^\s@<>"'`;]+@[^\s@<>"'`;]+\.[^\s@<>"'`;]+$/
  }).toLowerCase();
  const firstName = validateText(payload.firstName, "First name", {
    max: 40,
    min: 2,
    pattern: namePattern
  });
  const lastName = validateText(payload.lastName, "Last name", {
    max: 40,
    min: 2,
    pattern: namePattern
  });
  const address = validateText(payload.address, "Address", {
    max: 120,
    min: 5,
    pattern: addressPattern
  });
  const apartment = validateText(payload.apartment, "Apartment", {
    max: 80,
    pattern: addressPattern,
    required: false
  });
  const city = validateText(payload.city, "City", {
    max: 50,
    min: 2,
    pattern: namePattern
  });
  const governorate = validateText(payload.governorate, "Governorate", {
    max: 40,
    min: 2,
    pattern: namePattern
  });
  const postalCode = validateText(payload.postalCode, "Postal code", {
    max: 12,
    pattern: postalPattern,
    required: false
  });
  const phone = validateText(payload.phone, "Phone", {
    max: 18,
    min: 8,
    pattern: phonePattern
  });
  const notes = validateText(payload.notes, "Additional instructions", {
    max: 300,
    pattern: addressPattern,
    required: false
  });

  if (!egyptGovernorates.has(governorate)) {
    throw new Error("Governorate is not supported");
  }

  if (payload.paymentMethod !== "CASH_ON_DELIVERY") {
    throw new Error("Selected payment method is not available yet");
  }

  if (payload.billingAddress !== "same") {
    throw new Error("Different billing address is not available yet");
  }

  if (!Array.isArray(payload.items) || payload.items.length < 1) {
    throw new Error("Your cart is empty");
  }

  if (payload.items.length > 20) {
    throw new Error("Too many cart items");
  }

  const items = payload.items.map((item) => {
    const orderItem = item as OrderItemInput;
    const variantId = validateText(orderItem.variantId, "Cart item", {
      max: 64,
      min: 8,
      pattern: /^[A-Za-z0-9_-]+$/
    });
    const quantity = Number(orderItem.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error("Cart item quantity is invalid");
    }

    return {variantId, quantity};
  });

  return {
    email,
    firstName,
    lastName,
    address,
    apartment,
    city,
    governorate,
    postalCode,
    phone,
    notes,
    items
  };
}

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;

  let payload: CheckoutPayload;

  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return NextResponse.json({message: "Invalid checkout request"}, {status: 400});
  }

  if (
    !validateCsrfToken(
      asString(payload.csrfToken),
      request.cookies.get(csrfCookieName)?.value
    )
  ) {
    return NextResponse.json({message: "Invalid checkout token"}, {status: 403});
  }

  let checkout;

  try {
    checkout = validateCheckoutPayload(payload);
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Invalid checkout details"},
      {status: 400}
    );
  }

  const quantities = new Map<string, number>();
  checkout.items.forEach((item) => {
    quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
  });

  try {
    const guestPasswordHash = session?.user?.id
      ? ""
      : await hash(randomBytes(32).toString("hex"), 12);

    const order = await prisma.$transaction(async (tx) => {
      const sessionUser = session?.user?.id
        ? await tx.user.findUnique({
            where: {id: session.user.id},
            select: {id: true}
          })
        : null;
      const customerId = sessionUser?.id ??
        (
          await tx.user.upsert({
            where: {email: checkout.email},
            update: {
              name: `${checkout.firstName} ${checkout.lastName}`.trim()
            },
            create: {
              email: checkout.email,
              name: `${checkout.firstName} ${checkout.lastName}`.trim(),
              passwordHash: guestPasswordHash
            },
            select: {id: true}
          })
        ).id;

      const variants = await tx.fragranceVariant.findMany({
        where: {
          id: {in: Array.from(quantities.keys())},
          fragrance: {isPublished: true}
        },
        include: {
          fragrance: {
            select: {
              nameEn: true,
              nameAr: true
            }
          }
        }
      });

      if (variants.length !== quantities.size) {
        throw new Error("One or more cart items are no longer available");
      }

      const orderItems = [];
      let subtotal = 0;

      for (const variant of variants) {
        const quantity = quantities.get(variant.id) ?? 0;

        if (variant.stock < quantity) {
          throw new Error(`${variant.fragrance.nameEn} is low on stock`);
        }

        const stockUpdate = await tx.fragranceVariant.updateMany({
          where: {
            id: variant.id,
            stock: {gte: quantity}
          },
          data: {
            stock: {decrement: quantity}
          }
        });

        if (stockUpdate.count !== 1) {
          throw new Error(`${variant.fragrance.nameEn} is low on stock`);
        }

        const unitPrice = Number(variant.price);
        const totalPrice = unitPrice * quantity;
        subtotal += totalPrice;

        orderItems.push({
          variantId: variant.id,
          fragranceNameEn: variant.fragrance.nameEn,
          fragranceNameAr: variant.fragrance.nameAr,
          sizeML: variant.sizeML,
          quantity,
          unitPrice: new Prisma.Decimal(unitPrice),
          totalPrice: new Prisma.Decimal(totalPrice)
        });
      }

      return tx.order.create({
        data: {
          userId: customerId,
          paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
          subtotal: new Prisma.Decimal(subtotal),
          total: new Prisma.Decimal(subtotal),
          notes: checkout.notes || null,
          addressSnapshot: {
            email: checkout.email,
            firstName: checkout.firstName,
            lastName: checkout.lastName,
            address: checkout.address,
            apartment: checkout.apartment || null,
            city: checkout.city,
            governorate: checkout.governorate,
            postalCode: checkout.postalCode || null,
            phone: checkout.phone,
            country: "Egypt"
          },
          items: {
            create: orderItems
          }
        },
        select: {
          id: true,
          total: true
        }
      });
    });

    return NextResponse.json({
      message: "Order placed",
      orderId: order.id,
      total: order.total.toString()
    });
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Unable to place order"},
      {status: 409}
    );
  }
}
