import { prisma } from '../src/lib/prisma'

async function main() {
  // Create default template
  const template = await prisma.template.create({
    data: {
      name: 'Argyle Solar',
      isDefault: true,
      companyName: 'Argyle Solar Pte Ltd',
      companyUen: '201907784K',
      companyAddress: '160 Robinson Road, #14-04 Singapore Business Federation Center, Singapore 068914',
      companyPhone: '65-6710-7016',
      companyEmail: 'sales@argylesolar.com.sg',
      contactPerson: 'Terry',
      bankName: 'DBS Bank Ltd',
      bankAccount: '003-922866-1',
      bankAddress: '12 Marina Boulevard, DBS Asia Central, Marina Bay Financial Centre Tower 3, Singapore 018982',
      swiftCode: 'DBSSSGSG',
      bankCurrency: 'SGD',
      currency: 'SGD',
      taxRate: 0,
      taxName: 'GST',
      primaryColor: '#1e293b',
      secondaryColor: '#64748b',
      accentColor: '#0f172a',
      showLogo: true,
      showUen: true,
      showBankDetails: true,
      showSignatures: true,
      headerStyle: 'standard',
      tableStyle: 'bordered',
      defaultDeliveryTerms: 'DDP',
      defaultPaymentTerms: 'T/T 30% advance payment, the balance of 70% paid before shipment',
      defaultWarranty: '25 years for PV panel, 5 years for Smart PV Controller, and 2 years for Accessories',
    }
  })
  console.log('Created default template:', template.name)

  await prisma.sKU.createMany({
    data: [
      {
        code: 'LONGI-54C-490W',
        name: 'LONGi 54c HiMo x10-54pc PV panel',
        model: 'LONGi 54c HiMo x10-54pc PV panel',
        performance: '490w 1800×1134×30mm',
        unitPrice: 209.0,
      },
      {
        code: 'HUAWEI-12KTL',
        name: 'Smart PV Controller',
        model: 'SUN2000-12KTL-M5',
        performance: '15,000Wp',
        unitPrice: 4230.0,
      },
      {
        code: 'MC6-RED',
        name: 'MC6 plug CABLE SOLAR ROJO',
        model: 'CS-100-RED',
        performance: '',
        unitPrice: 252.0,
      },
      {
        code: 'MC6-BLACK',
        name: 'MC6 plug CABLE SOLAR NEGRO',
        model: 'CS-100-BLACK',
        performance: '',
        unitPrice: 252.0,
      },
      {
        code: 'MOUNT-12KW',
        name: 'PV Mounting Structure',
        model: '12KW PV Roof Mounting Project',
        performance: 'The mounting rails are made of high-strength aluminum alloy.',
        unitPrice: 1000.0,
      },
      {
        code: 'INSTALL-12KW',
        name: 'Installation System',
        model: 'Installation',
        performance: '12KW PV Roof Mounting Project',
        unitPrice: 180.0,
      },
      {
        code: 'AC-DB-BOX',
        name: 'Complete PV AC Distribution Board',
        model: 'DC Combiner Box',
        performance: '',
        unitPrice: 1226.0,
      },
    ],
    skipDuplicates: true,
  })

  console.log('Seeded SKUs')

  // Create DXC Technology template
  const dxcTemplate = await prisma.template.create({
    data: {
      name: 'DXC Technology',
      isDefault: false,
      companyName: 'DXC Technology',
      companyUen: '',
      companyAddress: '1 Raffles Place, #25-01 Tower 2, Singapore 048616',
      companyPhone: '+65 6410 8000',
      companyEmail: 'singapore.sales@dxc.com',
      contactPerson: '',
      bankName: 'DBS Bank Ltd',
      bankAccount: '',
      bankAddress: '12 Marina Boulevard, Singapore 018982',
      swiftCode: 'DBSSSGSG',
      bankCurrency: 'SGD',
      currency: 'SGD',
      taxRate: 9,
      taxName: 'GST',
      primaryColor: '#5F249F',
      secondaryColor: '#000000',
      accentColor: '#2E1A47',
      fontFamily: 'Helvetica',
      showLogo: true,
      showUen: false,
      showBankDetails: true,
      showSignatures: true,
      headerStyle: 'modern',
      tableStyle: 'professional',
      defaultDeliveryTerms: 'As per project timeline',
      defaultPaymentTerms: 'Net 45 days from invoice date. Early payment discount: 2/10 net 30',
      defaultWarranty: '12 months standard warranty on all hardware. 90 days on services',
    }
  })
  console.log('Created DXC template:', dxcTemplate.name)

  // Assign all SKUs to DXC template too (with custom enterprise pricing)
  const allSkus = await prisma.sKU.findMany()
  for (const sku of allSkus) {
    await prisma.templateSKU.create({
      data: {
        templateId: dxcTemplate.id,
        skuId: sku.id,
        isActive: true,
        customPrice: Number(sku.unitPrice) * 0.85, // 15% enterprise discount
      }
    })
  }
  console.log('Assigned SKUs to DXC template with enterprise pricing')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
