import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

// ── Types ───────────────────────────────────────────────────────────

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
  id: string
  name: string
  email: string
  phone?: string | null
  address: string
  uen?: string | null
}

interface LineItem {
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

interface QuotationData {
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

interface InvoiceData {
  invoiceNo: string
  issueDate: string
  dueDate?: string | null
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  amountPaid: number
  balanceDue: number
  deliveryTerms?: string | null
  paymentTerms?: string | null
  warranty?: string | null
  notes?: string | null
  status: string
}

interface PaymentRecord {
  id: string
  amount: number
  paymentDate: string
  paymentMethod: string
  referenceNo?: string | null
  notes?: string | null
}

interface StatementTransaction {
  date: string
  type: 'quotation' | 'invoice' | 'payment'
  docNo: string
  description: string
  debit: number
  credit: number
  balance: number
}

// ── Helpers ─────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  } : { r: 0.12, g: 0.16, b: 0.23 }
}

function useFormats(template: Template) {
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB')

  const fmtMoney = (n: number) =>
    `${template.currency} ${Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  return { fmtDate, fmtMoney }
}

function makeStyles(template: Template) {
  return StyleSheet.create({
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
    docTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'right',
      color: template.primaryColor,
    },
    docTitleCentered: {
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
    colNo: { width: '6%' },
    colDesc: { width: '48%' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '18%', textAlign: 'right' },
    colAmount: { width: '18%', textAlign: 'right', borderRightWidth: 0 },
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
    statusBadge: {
      padding: 4,
      borderRadius: 4,
      fontSize: 9,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 4,
    },
    paidStamp: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#16a34a',
      borderWidth: 3,
      borderColor: '#16a34a',
      padding: 8,
      textAlign: 'center',
      transform: 'rotate(-15deg)',
      position: 'absolute',
      top: 200,
      right: 40,
      opacity: 0.7,
    },
    statementTable: {
      display: 'flex',
      width: '100%',
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: template.primaryColor,
      marginTop: 10,
    },
    statementRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      minHeight: 24,
    },
    statementHeader: {
      backgroundColor: template.primaryColor,
      color: '#ffffff',
      fontWeight: 'bold',
    },
    colDate: { width: '14%' },
    colType: { width: '12%' },
    colDocNo: { width: '18%' },
    colDescStmt: { width: '26%' },
    colDebit: { width: '15%', textAlign: 'right' },
    colCredit: { width: '15%', textAlign: 'right', borderRightWidth: 0 },
    summaryBox: {
      marginTop: 15,
      padding: 10,
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: template.primaryColor,
    },
    watermark: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#e2e8f0',
      textAlign: 'center',
      position: 'absolute',
      top: '40%',
      left: '20%',
      transform: 'rotate(-30deg)',
      opacity: 0.3,
    },
  })
}

// ── Shared Header Renderer ──────────────────────────────────────────

function renderHeader(
  template: Template,
  styles: any,
  docType: string,
  docNo: string,
  issueDate: string,
  fmtDate: (d: string) => string
) {
  const isMinimal = template.headerStyle === 'minimal'
  const isBanner = template.headerStyle === 'banner'
  const isModern = template.headerStyle === 'modern'
  const isCentered = template.headerStyle === 'centered'
  const isSidebar = template.headerStyle === 'sidebar'

  const bannerBg = isBanner ? { backgroundColor: template.primaryColor, padding: 15, marginHorizontal: -30, marginTop: -30, paddingTop: 20 } : {}
  const bannerText = isBanner ? { color: '#ffffff' } : {}

  if (isCentered) {
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
        <Text style={styles.docTitleCentered}>{docType.toUpperCase()}</Text>
        <Text style={{ color: template.secondaryColor, marginTop: 4 }}>
          {docNo} · {fmtDate(issueDate)}
        </Text>
      </View>
    )
  }

  if (isSidebar) {
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
            {docType}
          </Text>
          <Text style={{ color: template.secondaryColor, marginBottom: 2 }}>{template.companyAddress}</Text>
          {template.companyPhone && <Text style={{ color: template.secondaryColor }}>Tel: {template.companyPhone}</Text>}
          {template.contactPerson && <Text style={{ color: template.secondaryColor }}>Contact: {template.contactPerson}</Text>}
          <Text style={{ color: template.secondaryColor, marginTop: 4 }}>No: {docNo}</Text>
          <Text style={{ color: template.secondaryColor }}>Date: {fmtDate(issueDate)}</Text>
        </View>
      </View>
    )
  }

  if (isModern) {
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
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: template.primaryColor }}>{docType.toUpperCase()}</Text>
          <Text style={{ textAlign: 'right', color: template.secondaryColor, fontSize: 9, marginTop: 4 }}>{docNo}</Text>
          <Text style={{ textAlign: 'right', color: template.secondaryColor, fontSize: 9 }}>{fmtDate(issueDate)}</Text>
        </View>
      </View>
    )
  }

  // Default / Minimal / Banner
  return (
    <View style={[styles.header, bannerBg]}>
      <View style={styles.companyInfo}>
        {template.showLogo && template.companyLogo && (
          <Image src={template.companyLogo} style={{ width: 60, height: 60, marginBottom: 6 }} />
        )}
        <Text style={[styles.companyName, bannerText]}>{template.companyName}</Text>
        {template.showUen && template.companyUen && <Text style={bannerText}>UEN: {template.companyUen}</Text>}
        <Text style={bannerText}>{template.companyAddress}</Text>
        {template.companyPhone && <Text style={bannerText}>Tel: {template.companyPhone}</Text>}
        <Text style={bannerText}>Email: {template.companyEmail}</Text>
        {template.contactPerson && <Text style={bannerText}>Contact: {template.contactPerson}</Text>}
      </View>
      <View>
        <Text style={[styles.docTitle, bannerText]}>{docType}</Text>
        <Text style={{ textAlign: 'right', marginTop: 8, color: isBanner ? '#ffffff' : '#000000' }}>
          No: {docNo}
        </Text>
        <Text style={{ textAlign: 'right', color: isBanner ? '#ffffff' : '#000000' }}>
          Date: {fmtDate(issueDate)}
        </Text>
      </View>
    </View>
  )
}

// ── Shared Items Table ──────────────────────────────────────────────

function renderItemsTable(
  items: LineItem[],
  styles: any,
  fmtMoney: (n: number) => string
) {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, styles.colNo]}>No.</Text>
        <Text style={[styles.tableCell, styles.colDesc]}>Description</Text>
        <Text style={[styles.tableCell, styles.colQty]}>Qty</Text>
        <Text style={[styles.tableCell, styles.colPrice]}>Price</Text>
        <Text style={[styles.tableCell, styles.colAmount]}>Amount</Text>
      </View>
      {items.map((item, idx) => (
        <View style={styles.tableRow} key={item.id}>
          <Text style={[styles.tableCell, styles.colNo]}>{idx + 1}</Text>
          <Text style={[styles.tableCell, styles.colDesc]}>
            {item.displayName}
            {item.sku?.model ? `\nModel: ${item.sku.model}` : ''}
            {item.sku?.performance ? ` | ${item.sku.performance}` : ''}
            {item.description && item.description !== item.displayName ? `\n${item.description}` : ''}
          </Text>
          <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
          <Text style={[styles.tableCell, styles.colPrice]}>{fmtMoney(Number(item.unitPrice))}</Text>
          <Text style={[styles.tableCell, styles.colAmount]}>{fmtMoney(Number(item.amount))}</Text>
        </View>
      ))}
    </View>
  )
}

// ── Shared Terms & Footer ───────────────────────────────────────────

function renderTerms(
  template: Template,
  styles: any,
  deliveryTerms?: string | null,
  paymentTerms?: string | null,
  dispatchDate?: string | null,
  warranty?: string | null,
  notes?: string | null
) {
  return (
    <View style={styles.termsSection}>
      {deliveryTerms && (
        <View style={styles.termRow}>
          <Text style={styles.bold}>Delivery Terms:</Text>
          <Text>{deliveryTerms}</Text>
        </View>
      )}
      {paymentTerms && (
        <View style={styles.termRow}>
          <Text style={styles.bold}>Payment Terms:</Text>
          <Text>{paymentTerms}</Text>
        </View>
      )}
      {dispatchDate && (
        <View style={styles.termRow}>
          <Text style={styles.bold}>Dispatching Date:</Text>
          <Text>{dispatchDate}</Text>
        </View>
      )}
      {warranty && (
        <View style={styles.termRow}>
          <Text style={styles.bold}>Warranty:</Text>
          <Text>{warranty}</Text>
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
      {notes && (
        <View style={styles.termRow}>
          <Text style={styles.bold}>Notes:</Text>
          <Text>{notes}</Text>
        </View>
      )}
    </View>
  )
}

function renderSignatures(
  template: Template,
  styles: any,
  customer: Customer,
  date: string,
  fmtDate: (d: string) => string
) {
  if (!template.showSignatures) return null
  return (
    <View style={styles.signatures}>
      <View style={styles.signatureBox}>
        <Text style={styles.bold}>Party A: {template.companyName}</Text>
        <Text>Signatory: {template.contactPerson || ''}</Text>
        <Text>Position: CEO</Text>
        <View style={styles.signatureLine}>
          <Text>Signature: {template.contactPerson || ''}</Text>
        </View>
        <Text>Date: {fmtDate(date)}</Text>
      </View>
      <View style={styles.signatureBox}>
        <Text style={styles.bold}>Party B: {customer.name}</Text>
        <Text>Signatory:</Text>
        <Text>Position:</Text>
        <View style={styles.signatureLine}>
          <Text>Signature:</Text>
        </View>
        <Text>Date: {fmtDate(date)}</Text>
      </View>
    </View>
  )
}

// ── Quotation PDF ───────────────────────────────────────────────────

export function QuotationPDF({
  template,
  customer,
  quotation,
  items,
}: {
  template: Template
  customer: Customer
  quotation: QuotationData
  items: LineItem[]
}) {
  const styles = makeStyles(template)
  const { fmtDate, fmtMoney } = useFormats(template)

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        {renderHeader(template, styles, 'Proforma Invoice', quotation.quotationNo, quotation.issueDate, fmtDate)}

        <View style={styles.section}>
          <Text style={styles.bold}>TO THE BUYER:</Text>
          <Text>{customer.name}</Text>
          {customer.uen && <Text>UEN/NIPC: {customer.uen}</Text>}
          <Text>Contact: {customer.phone}</Text>
          <Text>EMAIL: {customer.email}</Text>
          <Text>Address: {customer.address}</Text>
        </View>

        {renderItemsTable(items, styles, fmtMoney)}

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

        {renderTerms(template, styles, quotation.deliveryTerms, quotation.paymentTerms, quotation.dispatchDate, quotation.warranty, quotation.notes)}
        {renderSignatures(template, styles, customer, quotation.issueDate, fmtDate)}
      </Page>
    </Document>
  )
}

// ── Invoice PDF ─────────────────────────────────────────────────────

export function InvoicePDF({
  template,
  customer,
  invoice,
  items,
  payments,
}: {
  template: Template
  customer: Customer
  invoice: InvoiceData
  items: LineItem[]
  payments?: PaymentRecord[]
}) {
  const styles = makeStyles(template)
  const { fmtDate, fmtMoney } = useFormats(template)

  const statusColors: Record<string, string> = {
    draft: '#64748b',
    sent: '#2563eb',
    partial: '#d97706',
    paid: '#16a34a',
    overdue: '#dc2626',
    cancelled: '#9ca3af',
  }

  const isPaid = invoice.status === 'paid'

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        {renderHeader(template, styles, 'Tax Invoice', invoice.invoiceNo, invoice.issueDate, fmtDate)}

        <View style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.bold}>BILL TO:</Text>
              <Text>{customer.name}</Text>
              {customer.uen && <Text>UEN/NIPC: {customer.uen}</Text>}
              <Text>Contact: {customer.phone}</Text>
              <Text>EMAIL: {customer.email}</Text>
              <Text>Address: {customer.address}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.statusBadge, { color: '#ffffff', backgroundColor: statusColors[invoice.status] || '#64748b' }]}>
                {invoice.status.toUpperCase()}
              </Text>
              {invoice.dueDate && (
                <Text style={{ marginTop: 4 }}>Due Date: {fmtDate(invoice.dueDate)}</Text>
              )}
            </View>
          </View>
        </View>

        {renderItemsTable(items, styles, fmtMoney)}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmtMoney(Number(invoice.subtotal))}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{template.taxName ? `${template.taxName} ${Number(invoice.taxRate)}%` : 'Tax'}</Text>
            <Text style={styles.totalValue}>{fmtMoney(Number(invoice.taxAmount))}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{fmtMoney(Number(invoice.total))}</Text>
          </View>
          {invoice.amountPaid > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount Paid</Text>
                <Text style={styles.totalValue}>{fmtMoney(Number(invoice.amountPaid))}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { fontSize: 12 }]}>Balance Due</Text>
                <Text style={[styles.totalValue, { fontSize: 12, fontWeight: 'bold' }]}>{fmtMoney(Number(invoice.balanceDue))}</Text>
              </View>
            </>
          )}
        </View>

        {/* Payment History */}
        {payments && payments.length > 0 && (
          <View style={[styles.section, { marginTop: 15 }]}>
            <Text style={[styles.bold, { marginBottom: 6 }]}>Payment History</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '25%' }]}>Date</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>Method</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>Reference</Text>
                <Text style={[styles.tableCell, { width: '25%', borderRightWidth: 0, textAlign: 'right' }]}>Amount</Text>
              </View>
              {payments.map((p) => (
                <View style={styles.tableRow} key={p.id}>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{fmtDate(p.paymentDate)}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{p.paymentMethod}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{p.referenceNo || '-'}</Text>
                  <Text style={[styles.tableCell, { width: '25%', borderRightWidth: 0, textAlign: 'right' }]}>{fmtMoney(Number(p.amount))}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {renderTerms(template, styles, invoice.deliveryTerms, invoice.paymentTerms, undefined, invoice.warranty, invoice.notes)}
        {renderSignatures(template, styles, customer, invoice.issueDate, fmtDate)}

        {isPaid && (
          <View style={styles.paidStamp}>
            <Text>PAID</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

// ── Statement of Account PDF ──────────────────────────────────────

export function StatementPDF({
  template,
  customer,
  transactions,
  openingBalance,
  closingBalance,
  periodStart,
  periodEnd,
}: {
  template: Template
  customer: Customer
  transactions: StatementTransaction[]
  openingBalance: number
  closingBalance: number
  periodStart: string
  periodEnd: string
}) {
  const styles = makeStyles(template)
  const { fmtDate, fmtMoney } = useFormats(template)

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        {renderHeader(template, styles, 'Statement of Account', `SOA-${customer.id.slice(0, 6)}`, periodEnd, fmtDate)}

        <View style={styles.section}>
          <Text style={styles.bold}>CUSTOMER:</Text>
          <Text>{customer.name}</Text>
          {customer.uen && <Text>UEN/NIPC: {customer.uen}</Text>}
          <Text>Contact: {customer.phone}</Text>
          <Text>EMAIL: {customer.email}</Text>
          <Text>Address: {customer.address}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>Period: {fmtDate(periodStart)} — {fmtDate(periodEnd)}</Text>
        </View>

        <View style={styles.statementTable}>
          <View style={[styles.statementRow, styles.statementHeader]}>
            <Text style={[styles.tableCell, styles.colDate]}>Date</Text>
            <Text style={[styles.tableCell, styles.colType]}>Type</Text>
            <Text style={[styles.tableCell, styles.colDocNo]}>Document</Text>
            <Text style={[styles.tableCell, styles.colDescStmt]}>Description</Text>
            <Text style={[styles.tableCell, styles.colDebit]}>Debit</Text>
            <Text style={[styles.tableCell, styles.colCredit]}>Credit</Text>
          </View>

          {/* Opening Balance Row */}
          <View style={styles.statementRow}>
            <Text style={[styles.tableCell, styles.colDate]}>{fmtDate(periodStart)}</Text>
            <Text style={[styles.tableCell, styles.colType]}>—</Text>
            <Text style={[styles.tableCell, styles.colDocNo]}>—</Text>
            <Text style={[styles.tableCell, styles.colDescStmt]}>Opening Balance</Text>
            <Text style={[styles.tableCell, styles.colDebit]}>{openingBalance >= 0 ? fmtMoney(openingBalance) : ''}</Text>
            <Text style={[styles.tableCell, styles.colCredit]}>{openingBalance < 0 ? fmtMoney(Math.abs(openingBalance)) : ''}</Text>
          </View>

          {transactions.map((tx) => (
            <View style={styles.statementRow} key={`${tx.date}-${tx.docNo}-${tx.type}`}>
              <Text style={[styles.tableCell, styles.colDate]}>{fmtDate(tx.date)}</Text>
              <Text style={[styles.tableCell, styles.colType]}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</Text>
              <Text style={[styles.tableCell, styles.colDocNo]}>{tx.docNo}</Text>
              <Text style={[styles.tableCell, styles.colDescStmt]}>{tx.description}</Text>
              <Text style={[styles.tableCell, styles.colDebit]}>{tx.debit > 0 ? fmtMoney(tx.debit) : ''}</Text>
              <Text style={[styles.tableCell, styles.colCredit]}>{tx.credit > 0 ? fmtMoney(tx.credit) : ''}</Text>
            </View>
          ))}

          {/* Closing Balance Row */}
          <View style={[styles.statementRow, { backgroundColor: '#f0f0f0' }]}>
            <Text style={[styles.tableCell, styles.colDate]}>{fmtDate(periodEnd)}</Text>
            <Text style={[styles.tableCell, styles.colType]}>—</Text>
            <Text style={[styles.tableCell, styles.colDocNo]}>—</Text>
            <Text style={[styles.tableCell, styles.colDescStmt, styles.bold]}>Closing Balance</Text>
            <Text style={[styles.tableCell, styles.colDebit, styles.bold]}>{closingBalance > 0 ? fmtMoney(closingBalance) : ''}</Text>
            <Text style={[styles.tableCell, styles.colCredit, styles.bold]}>{closingBalance <= 0 ? fmtMoney(Math.abs(closingBalance)) : ''}</Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.bold}>Summary</Text>
          <View style={styles.row}>
            <Text>Opening Balance:</Text>
            <Text>{fmtMoney(openingBalance)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Total Invoiced:</Text>
            <Text>{fmtMoney(transactions.filter(t => t.type === 'invoice').reduce((s, t) => s + t.debit, 0))}</Text>
          </View>
          <View style={styles.row}>
            <Text>Total Payments Received:</Text>
            <Text>{fmtMoney(transactions.filter(t => t.type === 'payment').reduce((s, t) => s + t.credit, 0))}</Text>
          </View>
          <View style={[styles.row, { marginTop: 6, borderTopWidth: 1, borderTopColor: template.primaryColor, paddingTop: 4 }]}>
            <Text style={styles.bold}>Closing Balance Due:</Text>
            <Text style={styles.bold}>{fmtMoney(closingBalance)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={styles.bold}>Payment Instructions</Text>
          {template.showBankDetails && template.bankAccount && (
            <View style={{ marginTop: 4 }}>
              <Text>Please remit payment to:</Text>
              <Text>Beneficiary: {template.bankName || template.companyName}</Text>
              <Text>Account No: {template.bankAccount}</Text>
              {template.swiftCode && <Text>SWIFT CODE: {template.swiftCode}</Text>}
              {template.bankAddress && <Text>Bank Address: {template.bankAddress}</Text>}
            </View>
          )}
          <Text style={{ marginTop: 10, fontSize: 9, color: template.secondaryColor }}>
            If you have any questions about this statement, please contact {template.contactPerson || 'us'} at {template.companyEmail}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
