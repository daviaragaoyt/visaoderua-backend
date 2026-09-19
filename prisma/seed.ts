import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultPrice = 1999.00; // Assumed default price

async function main() {
  console.log('Clearing existing products...');
  await prisma.orderItem.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('Seeding products...');

  const productsData = [
    // LINHA JULIET
    { name: 'Juliet Modelo 24 Lente Tanzanite', slug: 'juliet-24-tanzanite', stock_quantity: 1, image_url: '/images/juliet-24-tanzanite.png', price: defaultPrice },
    { name: 'Juliet 24k', slug: 'juliet-24k', stock_quantity: 1, image_url: '/images/juliet-24k.png', price: defaultPrice },
    { name: 'Juliet Plasma', slug: 'juliet-plasma', stock_quantity: 2, image_url: '/images/juliet-plasma.png', price: defaultPrice },
    { name: 'Juliet Polished', slug: 'juliet-polished', stock_quantity: 3, image_url: '/images/juliet-polished.png', price: defaultPrice },

    // LINHA ROMEO
    { name: 'Romeo 1', slug: 'romeo-1', stock_quantity: 2, image_url: '/images/romeo-1.png', price: defaultPrice },
    { name: 'Romeo 2', slug: 'romeo-2', stock_quantity: 2, image_url: '/images/romeo-2.png', price: defaultPrice },

    // LINHA MONSTER DOG
    { name: 'Monster Dog Marrom', slug: 'monster-dog-marrom', stock_quantity: 1, image_url: '/images/monster-dog-marrom.png', price: defaultPrice },
    { name: 'Monster Dog Preta', slug: 'monster-dog-preta', stock_quantity: 1, image_url: '/images/monster-dog-preta.png', price: defaultPrice },

    // LINHA MINUTE
    { name: 'Minute', slug: 'minute', stock_quantity: 2, image_url: '/images/minute.png', price: defaultPrice },
    { name: 'Minute Estrelar', slug: 'minute-estrelar', stock_quantity: 1, image_url: '/images/minute-estrelar.png', price: defaultPrice },

    // OUTROS MODELOS EXCLUSIVOS
    { name: 'Gascan', slug: 'gascan', stock_quantity: 1, image_url: '/images/gascan.png', price: defaultPrice },
    { name: 'Splice', slug: 'splice', stock_quantity: 3, image_url: '/images/splice.png', price: defaultPrice },
    { name: 'Radar Lock', slug: 'radar-lock', stock_quantity: 1, image_url: '/images/radar-lock.png', price: defaultPrice },
  ];

  for (const p of productsData) {
    await prisma.product.create({
      data: p,
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
