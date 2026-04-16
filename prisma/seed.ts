import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Création des données de démo KLARA...");

  // Organisation de démo
  const org = await prisma.organization.create({
    data: {
      clerkOrgId: "org_demo_klara",
      name: "Boutique Excellence",
      email: "contact@boutique-excellence.tg",
      phone: "+22890123456",
      address: "45 Rue du Commerce",
      city: "Lomé",
      country: "TG",
      currency: "XOF",
      sector: "Commerce",
      plan: "BUSINESS",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Utilisateur owner
  const user = await prisma.user.create({
    data: {
      clerkUserId: "user_demo_01",
      email: "aminata@boutique-excellence.tg",
      name: "Aminata Mensah",
      role: "OWNER",
      organizationId: org.id,
    },
  });

  // Clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Hôtel Palm Beach",
        email: "reservation@palmbeach.tg",
        phone: "+22891234567",
        address: "Boulevard du Mono",
        city: "Lomé",
        type: "ENTREPRISE",
        taxNumber: "NIF-TO-2024-001",
        notes: "Client fidèle, paiement régulier",
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Jean-Pierre Agbéko",
        email: "jp.agbeko@gmail.com",
        phone: "+22890345678",
        city: "Lomé",
        type: "PARTICULIER",
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Restaurant Chez Maman",
        email: "chezmaman@gmail.com",
        phone: "+22890456789",
        address: "Marché Ahanoukpé",
        city: "Lomé",
        type: "ENTREPRISE",
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Kofi Améga",
        phone: "+22890567890",
        city: "Kpalimé",
        type: "PARTICULIER",
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Société Togo Télécom",
        email: "comptabilite@togotelecom.tg",
        phone: "+22891678901",
        address: "Avenue de l'Indépendance",
        city: "Lomé",
        type: "ENTREPRISE",
        taxNumber: "NIF-TO-2024-045",
      },
    }),
  ]);

  // Factures
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const invoices = await Promise.all([
    // Facture payée - Hôtel Palm Beach
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[0].id,
        number: "FAC-2024-001",
        status: "PAYEE",
        issueDate: sixtyDaysAgo,
        dueDate: new Date(sixtyDaysAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 850000,
        taxRate: 18,
        taxAmount: 153000,
        total: 1003000,
        paidAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        paidAmount: 1003000,
        sentAt: sixtyDaysAgo,
        items: {
          create: [
            { description: "Fournitures de chambre (linge)", quantity: 50, unitPrice: 10000, total: 500000, order: 0 },
            { description: "Produits d'accueil", quantity: 100, unitPrice: 3500, total: 350000, order: 1 },
          ],
        },
      },
    }),
    // Facture en retard - Jean-Pierre
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[1].id,
        number: "FAC-2024-002",
        status: "EN_RETARD",
        issueDate: sixtyDaysAgo,
        dueDate: fifteenDaysAgo,
        subtotal: 250000,
        taxRate: 18,
        taxAmount: 45000,
        total: 295000,
        sentAt: sixtyDaysAgo,
        items: {
          create: [
            { description: "Vente articles divers", quantity: 1, unitPrice: 250000, total: 250000, order: 0 },
          ],
        },
      },
    }),
    // Facture envoyée - Restaurant Chez Maman
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[2].id,
        number: "FAC-2024-003",
        status: "ENVOYEE",
        issueDate: tenDaysAgo,
        dueDate: new Date(tenDaysAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 420000,
        taxRate: 18,
        taxAmount: 75600,
        total: 495600,
        sentAt: tenDaysAgo,
        items: {
          create: [
            { description: "Ustensiles de cuisine", quantity: 20, unitPrice: 15000, total: 300000, order: 0 },
            { description: "Plats et assiettes", quantity: 40, unitPrice: 3000, total: 120000, order: 1 },
          ],
        },
      },
    }),
    // Facture payée - Togo Télécom
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[4].id,
        number: "FAC-2024-004",
        status: "PAYEE",
        issueDate: thirtyDaysAgo,
        dueDate: new Date(thirtyDaysAgo.getTime() + 15 * 24 * 60 * 60 * 1000),
        subtotal: 1750000,
        taxRate: 18,
        taxAmount: 315000,
        total: 2065000,
        paidAt: new Date(thirtyDaysAgo.getTime() + 10 * 24 * 60 * 60 * 1000),
        paidAmount: 2065000,
        sentAt: thirtyDaysAgo,
        items: {
          create: [
            { description: "Équipements bureautiques", quantity: 5, unitPrice: 200000, total: 1000000, order: 0 },
            { description: "Fournitures de bureau", quantity: 1, unitPrice: 750000, total: 750000, order: 1 },
          ],
        },
      },
    }),
    // Facture brouillon
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[3].id,
        number: "FAC-2024-005",
        status: "BROUILLON",
        issueDate: fiveDaysAgo,
        dueDate: new Date(fiveDaysAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 75000,
        taxRate: 18,
        taxAmount: 13500,
        total: 88500,
        items: {
          create: [
            { description: "Articles divers", quantity: 3, unitPrice: 25000, total: 75000, order: 0 },
          ],
        },
      },
    }),
  ]);

  // Dévis
  await Promise.all([
    prisma.quote.create({
      data: {
        organizationId: org.id,
        clientId: clients[0].id,
        number: "DEV-2024-001",
        status: "ACCEPTE",
        issueDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        subtotal: 500000,
        taxRate: 18,
        taxAmount: 90000,
        total: 590000,
        convertedToInvoiceId: invoices[0].id,
        items: {
          create: [
            { description: "Services de nettoyage mensuel", quantity: 1, unitPrice: 500000, total: 500000, order: 0 },
          ],
        },
      },
    }),
    prisma.quote.create({
      data: {
        organizationId: org.id,
        clientId: clients[2].id,
        number: "DEV-2024-002",
        status: "ENVOYE",
        issueDate: fiveDaysAgo,
        expiryDate: new Date(fiveDaysAgo.getTime() + 15 * 24 * 60 * 60 * 1000),
        subtotal: 320000,
        taxRate: 18,
        taxAmount: 57600,
        total: 377600,
        items: {
          create: [
            { description: "Plan de rénovation cuisine", quantity: 1, unitPrice: 320000, total: 320000, order: 0 },
          ],
        },
      },
    }),
  ]);

  // Dépenses
  const expenseCategories = [
    { cat: "LOYER", desc: "Loyer boutique décembre", amount: 350000, method: "VIREMENT" },
    { cat: "SALAIRES", desc: "Salaires employés décembre", amount: 600000, method: "VIREMENT" },
    { cat: "FOURNITURES", desc: "Achat stock marchandises", amount: 1200000, method: "MOBILE_MONEY" },
    { cat: "TRANSPORT", desc: "Carburant livraison", amount: 85000, method: "ESPECES" },
    { cat: "COMMUNICATION", desc: "Forfait internet + téléphone", amount: 35000, method: "MOBILE_MONEY" },
    { cat: "MARKETING", desc: "Publicité Facebook", amount: 50000, method: "MOBILE_MONEY" },
    { cat: "IMPOTS", desc: "Impôt patronal", amount: 95000, method: "VIREMENT" },
    { cat: "ELECTRICITE", desc: "Facture électricité", amount: 75000, method: "MOBILE_MONEY" },
    { cat: "MAINTENANCE", desc: "Réparation climatisation", amount: 45000, method: "ESPECES" },
    { cat: "AUTRE", desc: "Fournitures de bureau diverses", amount: 28000, method: "ESPECES" },
  ];

  for (const exp of expenseCategories) {
    await prisma.expense.create({
      data: {
        organizationId: org.id,
        category: exp.cat === "ELECTRICITE" ? "AUTRE" : exp.cat,
        description: exp.desc,
        amount: exp.amount,
        date: fifteenDaysAgo,
        paymentMethod: exp.method,
        createdBy: user.id,
      },
    });
  }

  // Paiements
  await Promise.all([
    prisma.payment.create({
      data: {
        organizationId: org.id,
        invoiceId: invoices[0].id,
        amount: 1003000,
        method: "VIREMENT",
        provider: "MANUEL",
        status: "CONFIRME",
        paidAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        organizationId: org.id,
        invoiceId: invoices[3].id,
        amount: 2065000,
        method: "MOBILE_MONEY",
        provider: "CINETPAY",
        transactionId: "CP-2024-001",
        status: "CONFIRME",
        paidAt: new Date(thirtyDaysAgo.getTime() + 10 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Relances
  await prisma.reminderLog.create({
    data: {
      invoiceId: invoices[1].id,
      organizationId: org.id,
      type: "EMAIL",
      status: "ENVOYE",
      daysAfterDue: 7,
    },
  });

  console.log("✅ Données de démo créées avec succès !");
  console.log(`   - 1 organisation : ${org.name}`);
  console.log(`   - 1 utilisateur : ${user.name}`);
  console.log(`   - 5 clients`);
  console.log(`   - 5 factures`);
  console.log(`   - 2 devis`);
  console.log(`   - 10 dépenses`);
  console.log(`   - 2 paiements`);
  console.log(`   - 1 relance`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
