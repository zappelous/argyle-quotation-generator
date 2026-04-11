import { prisma } from '../src/lib/prisma'

async function main() {
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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
