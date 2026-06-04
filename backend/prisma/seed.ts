import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const streams = await Promise.all(
    ["Form 1A", "Form 1B", "Form 2A"].map((name) =>
      prisma.stream.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const subjects = await Promise.all(
    [
      { name: "Mathematics", code: "MATH" },
      { name: "English", code: "ENG" },
      { name: "Kiswahili", code: "KIS" },
      { name: "Integrated Science", code: "SCI" },
      { name: "Social Studies", code: "SST" },
    ].map((subject) =>
      prisma.subject.upsert({
        where: { code: subject.code },
        update: { name: subject.name },
        create: subject,
      })
    )
  );

  await Promise.all(
    streams.map((stream) =>
      prisma.stream.update({
        where: { id: stream.id },
        data: {
          subjects: {
            connect: subjects.map((subject) => ({ id: subject.id })),
          },
        },
      })
    )
  );

  console.log("Seed complete: 3 streams and 5 subjects are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
