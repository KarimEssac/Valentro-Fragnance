import {hash} from "bcryptjs";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.fragranceCollection.deleteMany();
  await prisma.fragranceImage.deleteMany();
  await prisma.fragranceIngredient.deleteMany();
  await prisma.fragranceVariant.deleteMany();
  await prisma.fragrance.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("Admin1234!", 12);

  await prisma.user.create({
    data: {
      email: "admin@valentro.com",
      passwordHash,
      name: "Valentro Admin",
      role: "ADMIN"
    }
  });

  await prisma.announcement.create({
    data: {
      textEn: "LIMITED TIME OFFER: DISCOVER OUR PRIVATE COLLECTION",
      textAr: "عرض لفترة محدودة: اكتشف مجموعتنا الخاصة",
      isActive: true,
      bgColor: "#402A08",
      textColor: "#DEBC7E"
    }
  });

  const privateCollection = await prisma.collection.create({
    data: {
      slug: "private-collection",
      nameEn: "Private Collection",
      nameAr: "المجموعة الخاصة",
      descriptionEn:
        "Limited compositions built around resin, smoke, and polished warmth.",
      descriptionAr: "تركيبات محدودة من الراتنج والدخان والدفء المصقول.",
      coverImage: "/uploads/collections/private-collection.jpg",
      position: 1,
      isPublished: true
    }
  });

  const signatureCollection = await prisma.collection.create({
    data: {
      slug: "signature-line",
      nameEn: "Signature Line",
      nameAr: "الخط المميز",
      descriptionEn:
        "Everyday luxury fragrances with modern projection and refined texture.",
      descriptionAr: "عطور فاخرة يومية بانتشار عصري وملمس راق.",
      coverImage: "/uploads/collections/signature-line.jpg",
      position: 2,
      isPublished: true
    }
  });

  await prisma.fragrance.create({
    data: {
      slug: "noir-vanille",
      nameEn: "Noir Vanille",
      nameAr: "نوار فانيلا",
      taglineEn: "A velvet trail of vanilla, amber, and smoked woods.",
      taglineAr: "أثر مخملي من الفانيلا والعنبر والأخشاب المدخنة.",
      descriptionEn:
        "Noir Vanille opens with polished bergamot before settling into a deep vanilla heart wrapped in ambered woods.",
      descriptionAr:
        "يفتتح نوار فانيلا ببرغموت مصقول قبل أن يستقر في قلب فانيلا عميق تحيط به الأخشاب العنبرية.",
      gender: "UNISEX",
      scentProfile: "VANILLA",
      avoidIf: ["Avoids sweet amber", "Prefers very fresh scents"],
      bestFor: ["Evening events", "Date night", "Cool weather"],
      sillage: "NOTICEABLE",
      longevity: 10,
      isPublished: true,
      isFeatured: true,
      position: 1,
      variants: {
        create: [
          {
            sizeML: 50,
            price: "115.00",
            compareAtPrice: "140.00",
            stock: 28,
            sku: "VAL-NV-050"
          },
          {
            sizeML: 100,
            price: "180.00",
            compareAtPrice: null,
            stock: 16,
            sku: "VAL-NV-100"
          }
        ]
      },
      ingredients: {
        create: [
          {nameEn: "Bergamot", nameAr: "برغموت", note: "TOP"},
          {nameEn: "Madagascar Vanilla", nameAr: "فانيلا مدغشقر", note: "MIDDLE"},
          {nameEn: "Amber Woods", nameAr: "أخشاب عنبرية", note: "BASE"}
        ]
      },
      images: {
        create: [
          {
            url: "/uploads/fragrances/noir-vanille-primary.jpg",
            altEn: "Noir Vanille fragrance bottle",
            altAr: "زجاجة عطر نوار فانيلا",
            position: 1,
            isPrimary: true
          }
        ]
      },
      collections: {
        create: [
          {
            collection: {
              connect: {id: privateCollection.id}
            }
          }
        ]
      }
    }
  });

  await prisma.fragrance.create({
    data: {
      slug: "oud-imperial",
      nameEn: "Oud Imperial",
      nameAr: "عود إمبريال",
      taglineEn: "Rare oud, saffron heat, and a resinous golden base.",
      taglineAr: "عود نادر وحرارة الزعفران وقاعدة ذهبية راتنجية.",
      descriptionEn:
        "A commanding oud composition balanced by soft spice and a measured, luminous drydown.",
      descriptionAr:
        "تركيبة عود آسرة تتوازن مع توابل ناعمة وخاتمة مضيئة محسوبة.",
      gender: "HIM",
      scentProfile: "OUD",
      avoidIf: ["Sensitive to oud", "Wants a discreet office scent"],
      bestFor: ["Formal evenings", "Winter", "Statement dressing"],
      sillage: "STRONG",
      longevity: 14,
      isPublished: true,
      isFeatured: true,
      position: 2,
      variants: {
        create: [
          {
            sizeML: 50,
            price: "135.00",
            compareAtPrice: null,
            stock: 20,
            sku: "VAL-OI-050"
          },
          {
            sizeML: 100,
            price: "220.00",
            compareAtPrice: "250.00",
            stock: 11,
            sku: "VAL-OI-100"
          }
        ]
      },
      ingredients: {
        create: [
          {nameEn: "Saffron", nameAr: "زعفران", note: "TOP"},
          {nameEn: "Laotian Oud", nameAr: "عود لاوسي", note: "MIDDLE"},
          {nameEn: "Labdanum", nameAr: "لادن", note: "BASE"}
        ]
      },
      images: {
        create: [
          {
            url: "/uploads/fragrances/oud-imperial-primary.jpg",
            altEn: "Oud Imperial fragrance bottle",
            altAr: "زجاجة عطر عود إمبريال",
            position: 1,
            isPrimary: true
          }
        ]
      },
      collections: {
        create: [
          {
            collection: {
              connect: {id: privateCollection.id}
            }
          }
        ]
      }
    }
  });

  await prisma.fragrance.create({
    data: {
      slug: "floral-musk",
      nameEn: "Floral Musk",
      nameAr: "فلورال مسك",
      taglineEn: "White florals, clean musk, and soft powdered skin.",
      taglineAr: "زهور بيضاء ومسك نظيف ونعومة بودرية على البشرة.",
      descriptionEn:
        "A refined floral musk for daylight wear, cut with airy citrus and a polished powder finish.",
      descriptionAr:
        "مسك زهري راق للنهار، ينسجم مع حمضيات خفيفة ولمسة بودرية مصقولة.",
      gender: "HER",
      scentProfile: "FLORAL",
      avoidIf: ["Allergic to musk", "Dislikes powdery florals"],
      bestFor: ["Daytime", "Brunch", "Spring"],
      sillage: "MODERATE",
      longevity: 8,
      isPublished: true,
      isFeatured: false,
      position: 3,
      variants: {
        create: [
          {
            sizeML: 30,
            price: "78.00",
            compareAtPrice: null,
            stock: 32,
            sku: "VAL-FM-030"
          },
          {
            sizeML: 50,
            price: "108.00",
            compareAtPrice: null,
            stock: 24,
            sku: "VAL-FM-050"
          }
        ]
      },
      ingredients: {
        create: [
          {nameEn: "Mandarin", nameAr: "يوسفي", note: "TOP"},
          {nameEn: "Jasmine", nameAr: "ياسمين", note: "MIDDLE"},
          {nameEn: "Clean Musk", nameAr: "مسك نقي", note: "BASE"}
        ]
      },
      images: {
        create: [
          {
            url: "/uploads/fragrances/floral-musk-primary.jpg",
            altEn: "Floral Musk fragrance bottle",
            altAr: "زجاجة عطر فلورال مسك",
            position: 1,
            isPrimary: true
          }
        ]
      },
      collections: {
        create: [
          {
            collection: {
              connect: {id: signatureCollection.id}
            }
          }
        ]
      }
    }
  });

  await prisma.coupon.create({
    data: {
      code: "PRIVATE10",
      type: "PERCENTAGE",
      value: "10.00",
      minOrderAmount: "100.00",
      maxUses: 100,
      isActive: true,
      applicableTo: "ALL"
    }
  });

  console.log("Seed complete: admin@valentro.com / Admin1234!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
