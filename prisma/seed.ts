import {hash} from "bcryptjs";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

const cloudinaryImages = {
  hero: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613527/valentro/site/hero-bg.webp",
  heroLight: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613528/valentro/site/hero-bg-light.webp",
  emporioArmani: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613530/valentro/fragrances/emporio-armani.webp",
  ultraMale: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613535/valentro/fragrances/ultra-male.webp",
  valentinoUomo: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613536/valentro/fragrances/valentino-uomo.webp"
};

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.review.deleteMany();
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

  const layla = await prisma.user.create({
    data: {
      email: "layla.customer@example.com",
      passwordHash,
      name: "Layla Hassan",
      role: "CUSTOMER"
    }
  });

  const omar = await prisma.user.create({
    data: {
      email: "omar.customer@example.com",
      passwordHash,
      name: "Omar Nabil",
      role: "CUSTOMER"
    }
  });

  const salma = await prisma.user.create({
    data: {
      email: "salma.customer@example.com",
      passwordHash,
      name: "Salma Kareem",
      role: "CUSTOMER"
    }
  });

  await prisma.announcement.create({
    data: {
      textEn: "LIMITED TIME OFFER: DISCOVER OUR PRIVATE COLLECTION",
      textAr: "عرض لفترة محدودة: اكتشف مجموعتنا الخاصة",
      isActive: true,
      bgColor: "#F7EEDF",
      textColor: "#A97832"
    }
  });

  await prisma.testimonial.createMany({
    data: [
      {
        messageEn:
          "The fragrance settles with a quiet confidence: warm, polished, and unmistakably refined from the first hour to the last.",
        messageAr:
          "يستقر العطر بثقة هادئة: دافئ ومصقول وراقي بوضوح من الساعة الأولى حتى الأخيرة.",
        imageUrl: cloudinaryImages.emporioArmani,
        imageAltEn: "Valentro fragrance bottle in warm light",
        rating: 5,
        imageAltAr: "زجاجة عطر فالنترو في ضوء دافئ",
        position: 1,
        isPublished: true
      },
      {
        messageEn:
          "It feels composed rather than loud, leaving a memorable trail that makes evening wear feel complete.",
        messageAr:
          "يشعر بأنه متوازن لا صاخب، ويترك أثرا لا ينسى يجعل إطلالة المساء مكتملة.",
        imageUrl: cloudinaryImages.valentinoUomo,
        imageAltEn: "Deep-toned Valentro fragrance bottle",
        rating: 4,
        imageAltAr: "زجاجة عطر فالنترو بدرجات عميقة",
        position: 2,
        isPublished: true
      },
      {
        messageEn:
          "A smooth, elegant scent with enough character to feel personal and enough restraint to wear every day.",
        messageAr:
          "عطر ناعم وأنيق، فيه شخصية كافية ليبدو خاصا واتزان كاف لاستخدامه يوميا.",
        imageUrl: cloudinaryImages.ultraMale,
        imageAltEn: "Valentro fragrance bottle with refined styling",
        rating: 5,
        imageAltAr: "زجاجة عطر فالنترو بتنسيق راق",
        position: 3,
        isPublished: true
      }
    ]
  });

  const privateCollection = await prisma.collection.create({
    data: {
      slug: "private-collection",
      nameEn: "Private Collection",
      nameAr: "المجموعة الخاصة",
      descriptionEn:
        "Limited compositions built around resin, smoke, and polished warmth.",
      descriptionAr: "تركيبات محدودة من الراتنج والدخان والدفء المصقول.",
      coverImage: cloudinaryImages.hero,
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
      coverImage: cloudinaryImages.heroLight,
      position: 2,
      isPublished: true
    }
  });

  const noirVanille = await prisma.fragrance.create({
    data: {
      slug: "emporio-armani",
      nameEn: "Emporio Armani",
      nameAr: "نوار فانيلا",
      taglineEn: "Vanilla, amber, and smoked woods with an addictive warm trail.",
      taglineAr: "أثر مخملي من الفانيلا والعنبر والأخشاب المدخنة.",
      descriptionEn:
        "Noir Vanille opens with polished bergamot before settling into a deep vanilla heart wrapped in ambered woods.",
      descriptionAr:
        "يفتتح نوار فانيلا ببرغموت مصقول قبل أن يستقر في قلب فانيلا عميق تحيط به الأخشاب العنبرية.",
      gender: "UNISEX",
      scentProfile: "VANILLA",
      avoidIf: ["Avoids sweet amber", "Prefers very fresh scents"],
      bestFor: ["Evening events", "Date night", "Cool weather"],
      seasons: ["FALL", "WINTER"],
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
            url: cloudinaryImages.emporioArmani,
            altEn: "Emporio Armani fragrance bottle",
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
          },
          {
            collection: {
              connect: {id: signatureCollection.id}
            }
          }
        ]
      }
    }
  });

  const oudImperial = await prisma.fragrance.create({
    data: {
      slug: "valentino-umo",
      nameEn: "Valentino Umo",
      nameAr: "عود إمبريال",
      taglineEn: "A refined woody amber profile with lavender, spice, and depth.",
      taglineAr: "عود نادر وحرارة الزعفران وقاعدة ذهبية راتنجية.",
      descriptionEn:
        "A commanding oud composition balanced by soft spice and a measured, luminous drydown.",
      descriptionAr:
        "تركيبة عود آسرة تتوازن مع توابل ناعمة وخاتمة مضيئة محسوبة.",
      gender: "HIM",
      scentProfile: "OUD",
      avoidIf: ["Sensitive to oud", "Wants a discreet office scent"],
      bestFor: ["Formal evenings", "Winter", "Statement dressing"],
      seasons: ["WINTER", "FALL"],
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
            url: cloudinaryImages.valentinoUomo,
            altEn: "Valentino Umo fragrance bottle",
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
          },
          {
            collection: {
              connect: {id: signatureCollection.id}
            }
          }
        ]
      }
    }
  });

  const floralMusk = await prisma.fragrance.create({
    data: {
      slug: "ultra-male",
      nameEn: "Ultra Male",
      nameAr: "فلورال مسك",
      taglineEn: "A bold aromatic gourmand profile with pear, vanilla, and spice.",
      taglineAr: "زهور بيضاء ومسك نظيف ونعومة بودرية على البشرة.",
      descriptionEn:
        "A refined floral musk for daylight wear, cut with airy citrus and a polished powder finish.",
      descriptionAr:
        "مسك زهري راق للنهار، ينسجم مع حمضيات خفيفة ولمسة بودرية مصقولة.",
      gender: "HER",
      scentProfile: "FLORAL",
      avoidIf: ["Allergic to musk", "Dislikes powdery florals"],
      bestFor: ["Daytime", "Brunch", "Spring"],
      seasons: ["SPRING", "SUMMER", "ALL_YEAR"],
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
            url: cloudinaryImages.ultraMale,
            altEn: "Ultra Male fragrance bottle",
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

  const ultraMaleReview = await prisma.review.create({
    data: {
      fragranceId: floralMusk.id,
      userId: layla.id,
      reviewerName: layla.name ?? "Layla Hassan",
      rating: 5,
      messageEn:
        "A smooth, elegant scent with enough character to feel personal and enough restraint to wear every day.",
      messageAr:
        "عطر ناعم وأنيق، فيه شخصية كافية ليبدو خاصا واتزان كاف لاستخدامه يوميا.",
      isPublished: true
    }
  });

  const valentinoReview = await prisma.review.create({
    data: {
      fragranceId: oudImperial.id,
      userId: omar.id,
      reviewerName: omar.name ?? "Omar Nabil",
      rating: 4,
      messageEn:
        "It feels composed rather than loud, leaving a memorable trail that makes evening wear feel complete.",
      messageAr:
        "يشعر بأنه متوازن لا صاخب، ويترك أثرا لا ينسى يجعل إطلالة المساء مكتملة.",
      isPublished: true
    }
  });

  const emporioReview = await prisma.review.create({
    data: {
      fragranceId: noirVanille.id,
      userId: salma.id,
      reviewerName: salma.name ?? "Salma Kareem",
      rating: 5,
      messageEn:
        "The fragrance settles with a quiet confidence: warm, polished, and unmistakably refined from the first hour to the last.",
      messageAr:
        "يستقر العطر بثقة هادئة: دافئ ومصقول وراقي بوضوح من الساعة الأولى حتى الأخيرة.",
      isPublished: true
    }
  });

  await prisma.fragrance.update({
    where: {id: floralMusk.id},
    data: {ratingAverage: "5.00", ratingCount: 1}
  });

  await prisma.fragrance.update({
    where: {id: oudImperial.id},
    data: {ratingAverage: "4.00", ratingCount: 1}
  });

  await prisma.fragrance.update({
    where: {id: noirVanille.id},
    data: {ratingAverage: "5.00", ratingCount: 1}
  });

  await prisma.testimonial.updateMany({
    where: {position: 1},
    data: {
      fragranceId: floralMusk.id,
      reviewId: ultraMaleReview.id,
      messageEn: ultraMaleReview.messageEn,
      messageAr: ultraMaleReview.messageAr ?? "",
      rating: ultraMaleReview.rating
    }
  });

  await prisma.testimonial.updateMany({
    where: {position: 2},
    data: {
      fragranceId: oudImperial.id,
      reviewId: valentinoReview.id,
      messageEn: valentinoReview.messageEn,
      messageAr: valentinoReview.messageAr ?? "",
      rating: valentinoReview.rating
    }
  });

  await prisma.testimonial.updateMany({
    where: {position: 3},
    data: {
      fragranceId: noirVanille.id,
      reviewId: emporioReview.id,
      messageEn: emporioReview.messageEn,
      messageAr: emporioReview.messageAr ?? "",
      rating: emporioReview.rating
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
