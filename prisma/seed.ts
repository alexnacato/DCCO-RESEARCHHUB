import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function removeDemoArticles() {
  const demos = await db.article.findMany({
    where: {
      title: { startsWith: "[DEMO] " },
      articleUrl: { startsWith: "https://example.org/?dcco-demo=" }
    },
    select: { id: true }
  });
  const ids = demos.map(item => item.id);
  if (!ids.length) return 0;

  await db.$transaction(async tx => {
    await tx.articleReview.deleteMany({ where: { articleId: { in: ids } } });
    await tx.article.deleteMany({ where: { id: { in: ids } } });
    await tx.author.deleteMany({
      where: {
        fullName: { in: [
          "Equipo de Investigación DCCO (dato de prueba)",
          "Investigadora de Prueba (dato de prueba)"
        ] },
        articles: { none: {} }
      }
    });
  });
  return ids.length;
}

async function main() {
  const passwordHash = await bcrypt.hash("DccoDemo2026!", 12);
  await db.user.upsert({
    where: { email: "admin@dcco.local" },
    update: {},
    create: { fullName: "Administradora DCCO", email: "admin@dcco.local", passwordHash, role: "ADMIN" }
  });
  await db.user.upsert({
    where: { email: "investigador@dcco.local" },
    update: {},
    create: { fullName: "Investigadora de Prueba", email: "investigador@dcco.local", passwordHash, role: "USER" }
  });

  const removed = await removeDemoArticles();
  console.log(`Seed listo: cuentas de prueba disponibles; ${removed} artículos ficticios eliminados.`);
}

main()
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
