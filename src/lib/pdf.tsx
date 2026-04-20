'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

interface Template {
  companyName: string
  companyUen?: string | null
  companyAddress: string
  companyPhone?: string | null
  companyEmail: string
  companyLogo?: string | null
  contactPerson?: string | null
  bankName?: string | null
  bankAccount?: string | null
  bankAddress?: string | null
  swiftCode?: string | null
  bankCurrency: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  showLogo: boolean
  showUen: boolean
  showBankDetails: boolean
  showSignatures: boolean
  headerStyle: string
  tableStyle: string
  currency: string
  taxName: string
}

interface Customer {
  name: string
  email: string
  phone?: string | null
  address: string
  uen?: string | null
}

interface QuotationItem {
  id: string
  quantity: number
  unitPrice: number
  amount: number
  description?: string | null
  displayName: string
  lineNo: number
  sku?: {
    model?: string | null
    code?: string
    performance?: string | null
  } | null
}

interface Quotation {
  quotationNo: string
  issueDate: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  deliveryTerms?: string | null
  paymentTerms?: string | null
  warranty?: string | null
  dispatchDate?: string | null
  notes?: string | null
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  } : { r: 0.12, g: 0.16, b: 0.23 }
}

export function QuotationPDF({
  template,
  customer,
  quotation,
  items,
}: {
  template: Template
  customer: Customer
  quotation: Quotation
  items: QuotationItem[]
}) {
  const primary = hexToRgb(template.primaryColor)
  const secondary = hexToRgb(template.secondaryColor)
  
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB')

  const fmtMoney = (n: number) =>
    `${template.currency} ${Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 10,
      fontFamily: template.fontFamily || 'Helvetica',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      borderBottom: `1px solid ${template.primaryColor}`,
      paddingBottom: 10,
    },
    headerModern: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      borderBottomWidth: 3,
      borderBottomColor: template.primaryColor,
      paddingBottom: 15,
    },
    headerCentered: {
      alignItems: 'center',
      textAlign: 'center',
      marginBottom: 20,
      borderBottom: `1px solid ${template.primaryColor}`,
      paddingBottom: 15,
    },
    headerSidebar: {
      flexDirection: 'row',
      marginBottom: 20,
      borderBottom: `1px solid ${template.primaryColor}`,
      paddingBottom: 10,
    },
    sidebarBox: {
      width: '35%',
      backgroundColor: template.primaryColor,
      padding: 15,
      marginRight: 15,
      marginLeft: -30,
      marginTop: -30,
      justifyContent: 'center',
    },
    companyInfo: {
      width: '60%',
    },
    companyInfoCentered: {
      alignItems: 'center',
    },
    companyInfoSidebar: {
      flex: 1,
    },
    companyName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: template.primaryColor,
      marginBottom: 4,
    },
    companyNameCentered: {
      fontSize: 20,
      fontWeight: 'bold',
      color: template.primaryColor,
      marginBottom: 8,
      textAlign: 'center',
    },
    companyNameSidebar: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
    },
    invoiceTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'right',
      color: template.primaryColor,
    },
    invoiceTitleCentered: {
      fontSize: 12,
      fontWeight: 'bold',
      color: template.secondaryColor,
      marginTop: 4,
    },
    section: {
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    bold: {
      fontWeight: 'bold',
      color: template.primaryColor,
    },
    table: {
      display: 'flex',
      width: '100%',
      borderStyle: 'solid',
      borderWidth: template.tableStyle === 'minimal' || template.tableStyle === 'clean' || template.tableStyle === 'professional' ? 0 : 1,
      borderColor: template.primaryColor,
      marginTop: 10,
      marginBottom: 10,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: template.tableStyle === 'minimal' || template.tableStyle === 'clean' ? '#e2e8f0' : template.primaryColor,
    },
    tableHeader: {
      backgroundColor: template.tableStyle === 'striped' ? template.primaryColor : template.tableStyle === 'professional' ? template.accentColor : '#f0f0f0',
      fontWeight: 'bold',
      color: template.tableStyle === 'striped' || template.tableStyle === 'professional' ? '#ffffff' : template.primaryColor,
    },
    tableCell: {
      padding: template.tableStyle === 'clean' || template.tableStyle === 'professional' ? 6 : 4,
      borderRightWidth: template.tableStyle === 'minimal' || template.tableStyle === 'clean' || template.tableStyle === 'professional' ? 0 : 1,
      borderRightColor: template.tableStyle === 'minimal' || template.tableStyle === 'clean' ? 'transparent' : template.primaryColor,
    },
    tableCellClean: {
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    colNo: { width: '6%' },
    colModel: { width: '12%' },
    colDesc: { width: '32%' },
    colPerf: { width: '14%' },
    colQty: { width: '8%', textAlign: 'center' },
    colPrice: { width: '14%', textAlign: 'right' },
    colAmount: { width: '14%', textAlign: 'right', borderRightWidth: 0 },
    totals: {
      marginTop: 10,
      alignItems: 'flex-end',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      width: '40%',
      borderBottomWidth: 1,
      borderBottomColor: template.tableStyle === 'minimal' || template.tableStyle === 'clean' ? '#e2e8f0' : template.primaryColor,
      paddingVertical: template.tableStyle === 'clean' || template.tableStyle === 'professional' ? 4 : 3,
    },
    totalLabel: {
      width: '60%',
      textAlign: 'right',
      fontWeight: 'bold',
      color: template.primaryColor,
    },
    totalValue: {
      width: '40%',
      textAlign: 'right',
    },
    termsSection: {
      marginTop: 20,
    },
    termRow: {
      marginBottom: 4,
    },
    signatures: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 40,
    },
    signatureBox: {
      width: '45%',
    },
    signatureLine: {
      borderTopWidth: 1,
      borderTopColor: template.primaryColor,
      marginTop: 30,
      paddingTop: 4,
    },
  })

  const isMinimalHeader = template.headerStyle === 'minimal'
  const isBannerHeader = template.headerStyle === 'banner'
  const isModernHeader = template.headerStyle === 'modern'
  const isCenteredHeader = template.headerStyle === 'centered'
  const isSidebarHeader = template.headerStyle === 'sidebar'

  // Render different header based on style
  const renderHeader = () => {
    if (isCenteredHeader) {
      return (
        <View style={styles.headerCentered}>
          {template.showLogo && template.companyLogo && (
            <Image src={template.companyLogo} style={{ width: 80, height: 80, marginBottom: 8 }} />
          )}
          <Text style={styles.companyNameCentered}>{template.companyName}</Text>
          {template.showUen && template.companyUen && (
            <Text style={{ color: template.secondaryColor, marginBottom: 2 }}>UEN: {template.companyUen}</Text>
          )}
          <Text style={{ color: template.secondaryColor }}>{template.companyAddress}</Text>
          {template.companyPhone && (
            <Text style={{ color: template.secondaryColor }}>Tel: {template.companyPhone}</Text>
          )}
          <Text style={{ color: template.secondaryColor }}>Email: {template.companyEmail}</Text>
          <Text style={styles.invoiceTitleCentered}>PROFORMA INVOICE</Text>
          <Text style={{ color: template.secondaryColor, marginTop: 4 }}>
            {quotation.quotationNo} · {fmtDate(quotation.issueDate)}
          </Text>
        </View>
      )
    }

    if (isSidebarHeader) {
      return (
        <View style={styles.headerSidebar}>
          <View style={styles.sidebarBox}>
            <Text style={styles.companyNameSidebar}>{template.companyName}</Text>
            {template.showUen && template.companyUen && (
              <Text style={{ color: '#ffffff', fontSize: 9 }}>UEN: {template.companyUen}</Text>
            )}
            <Text style={{ color: '#ffffff', fontSize: 9 }}>{template.companyEmail}</Text>
          </View>
          <View style={styles.companyInfoSidebar}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: template.primaryColor, marginBottom: 8 }}>
              Proforma Invoice
            </Text>
            <Text style={{ color: template.secondaryColor, marginBottom: 2 }}>
              {template.companyAddress}
            </Text>
            {template.companyPhone && (
              <Text style={{ color: template.secondaryColor }}>Tel: {template.companyPhone}</Text>
            )}
            {template.contactPerson && (
              <Text style={{ color: template.secondaryColor }}>Contact: {template.contactPerson}</Text>
            )}
            <Text style={{ color: template.secondaryColor, marginTop: 4 }}>
              Invoice No: {quotation.quotationNo}
            </Text>
            <Text style={{ color: template.secondaryColor }}>
              Issue Date: {fmtDate(quotation.issueDate)}
            </Text>
          </View>
        </View>
      )
    }

    if (isModernHeader) {
      return (
        <View style={styles.headerModern}>
          <View style={styles.companyInfo}>
            {template.showLogo && template.companyLogo && (
              <Image src={template.companyLogo} style={{ width: 50, height: 50, marginBottom: 6 }} />
            )}
            <Text style={styles.companyName}>{template.companyName}</Text>
            {template.showUen && template.companyUen && (
              <Text style={{ color: template.secondaryColor, fontSize: 9 }}>UEN: {template.companyUen}</Text>
            )}
            <Text style={{ color: template.secondaryColor, fontSize: 9 }}>{template.companyAddress}</Text>
            <Text style={{ color: template.secondaryColor, fontSize: 9 }}>{template.companyEmail}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: template.primaryColor }}>INVOICE</Text>
            <Text style={{ textAlign: 'right', color: template.secondaryColor, fontSize: 9, marginTop: 4 }}>
              {quotation.quotationNo}
            </Text>
            <Text style={{ textAlign: 'right', color: template.secondaryColor, fontSize: 9 }}>
              {fmtDate(quotation.issueDate)}
            </Text>
          </View>
        </View>
      )
    }

    // Default / Minimal / Banner
    return (
      <View style={[
        styles.header,
        ...(isBannerHeader ? [{
          backgroundColor: template.primaryColor,
          padding: 15,
          marginHorizontal: -30,
          marginTop: -30,
          paddingTop: 20,
        }] : [])
      ]}>
        <View style={styles.companyInfo}>
          {template.showLogo && template.companyLogo && (
            <Image src={template.companyLogo} style={{ width: 60, height: 60, marginBottom: 6 }} />
          )}
          <Text style={[
            styles.companyName,
            ...(isBannerHeader ? [{ color: '#ffffff' }] : [])
          ]}>
            {template.companyName}
          </Text>
          {template.showUen && template.companyUen && (
            <Text style={isBannerHeader ? { color: '#ffffff' } : {}}>
              UEN: {template.companyUen}
            </Text>
          )}
          <Text style={isBannerHeader ? { color: '#ffffff' } : {}}>{template.companyAddress}</Text>
          {template.companyPhone && (
            <Text style={isBannerHeader ? { color: '#ffffff' } : {}}>Tel: {template.companyPhone}</Text>
          )}
          <Text style={isBannerHeader ? { color: '#ffffff' } : {}}>Email: {template.companyEmail}</Text>
          {template.contactPerson && (
            <Text style={isBannerHeader ? { color: '#ffffff' } : {}}>Contact: {template.contactPerson}</Text>
          )}
        </View>
        <View>
          <Text style={[
            styles.invoiceTitle,
            ...(isBannerHeader ? [{ color: '#ffffff' }] : [])
          ]}>
            Proforma Invoice
          </Text>
          <Text style={{ textAlign: 'right', marginTop: 8, color: isBannerHeader ? '#ffffff' : '#000000' }}>
            Invoice No: {quotation.quotationNo}
          </Text>
          <Text style={{ textAlign: 'right', color: isBannerHeader ? '#ffffff' : '#000000' }}>
            Issue Date: {fmtDate(quotation.issueDate)}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        {/* Header */}
        {renderHeader()}

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.bold}>TO THE BUYER:</Text>
          <Text>{customer.name}</Text>
          {customer.uen && <Text>UEN/NIPC: {customer.uen}</Text>}
          <Text>Contact: {customer.phone}</Text>
          <Text>EMAIL: {customer.email}</Text>
          <Text>Address: {customer.address}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.colNo]}>No.</Text>
            <Text style={[styles.tableCell, styles.colModel]}>Model</Text>
            <Text style={[styles.tableCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableCell, styles.colPerf]}>Performance</Text>
            <Text style={[styles.tableCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableCell, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableCell, styles.colAmount]}>Amount</Text>
          </View>

          {items.map((item, idx) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={[styles.tableCell, styles.colNo]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, styles.colModel]}>
                {item.sku?.model || item.sku?.code || ''}
              </Text>
              <Text style={[styles.tableCell, styles.colDesc]}>
                {item.displayName}
                {item.description ? `\n${item.description}` : ''}
              </Text>
              <Text style={[styles.tableCell, styles.colPerf]}>
                {item.sku?.performance || ''}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {fmtMoney(Number(item.unitPrice))}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                {fmtMoney(Number(item.amount))}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmtMoney(Number(quotation.subtotal))}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{template.taxName ? `${template.taxName} ${Number(quotation.taxRate)}%` : 'Tax'}</Text>
            <Text style={styles.totalValue}>{fmtMoney(Number(quotation.taxAmount))}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{fmtMoney(Number(quotation.total))}</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          {quotation.deliveryTerms && (
            <View style={styles.termRow}>
              <Text style={styles.bold}>Delivery Terms:</Text>
              <Text>{quotation.deliveryTerms}</Text>
            </View>
          )}

          {quotation.paymentTerms && (
            <View style={styles.termRow}>
              <Text style={styles.bold}>Payment Terms:</Text>
              <Text>{quotation.paymentTerms}</Text>
            </View>
          )}

          {quotation.dispatchDate && (
            <View style={styles.termRow}>
              <Text style={styles.bold}>Dispatching Date:</Text>
              <Text>{quotation.dispatchDate}</Text>
            </View>
          )}

          {quotation.warranty && (
            <View style={styles.termRow}>
              <Text style={styles.bold}>Warranty:</Text>
              <Text>{quotation.warranty}</Text>
            </View>
          )}

          {template.showBankDetails && template.bankAccount && (
            <View style={styles.termRow}>
              <Text style={styles.bold}>Bank Details for Payments:</Text>
              <Text>Beneficiary: {template.bankName || template.companyName}</Text>
              {template.bankAddress && <Text>Bank Address: {template.bankAddress}</Text>}
              <Text>Account No: {template.bankAccount}</Text>
              {template.swiftCode && <Text>SWIFT CODE: {template.swiftCode}</Text>}
            </View>
          )}

          {quotation.notes && (
            <View style={styles.termRow}>
              <Text style={styles.bold}>Notes:</Text>
              <Text>{quotation.notes}</Text>
            </View>
          )}
        </View>

        {/* Signatures */}
        {template.showSignatures && (
          <View style={styles.signatures}>
            <View style={styles.signatureBox}>
              <Text style={styles.bold}>Party A: {template.companyName}</Text>
              <Text>Signatory: {template.contactPerson || ''}</Text>
              <Text>Position: CEO</Text>
              <View style={styles.signatureLine}>
                <Text>Signature: {template.contactPerson || ''}</Text>
              </View>
              <Text>Date: {fmtDate(quotation.issueDate)}</Text>
            </View>

            <View style={styles.signatureBox}>
              <Text style={styles.bold}>Party B: {customer.name}</Text>
              <Text>Signatory:</Text>
              <Text>Position:</Text>
              <View style={styles.signatureLine}>
                <Text>Signature:</Text>
              </View>
              <Text>Date: {fmtDate(quotation.issueDate)}</Text>
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}
