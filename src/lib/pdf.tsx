'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1px solid #000',
    paddingBottom: 10,
  },
  companyInfo: {
    width: '60%',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
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
  },
  table: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
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
    borderBottomColor: '#000',
    paddingVertical: 3,
  },
  totalLabel: {
    width: '60%',
    textAlign: 'right',
    fontWeight: 'bold',
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
    borderTopColor: '#000',
    marginTop: 30,
    paddingTop: 4,
  },
})

export function QuotationPDF({
  company,
  customer,
  quotation,
  items,
}: {
  company: any
  customer: any
  quotation: any
  items: any[]
}) {
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB')

  const fmtMoney = (n: number) =>
    `SGD ${Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {company.logo && (
              <Image src={company.logo} style={{ width: 60, height: 60, marginBottom: 6 }} />
            )}
            <Text style={styles.companyName}>{company.name}</Text>
            <Text>UEN：{company.uen}</Text>
            <Text>{company.address}</Text>
            <Text>Tel: {company.phone}</Text>
            <Text>Email: {company.email}</Text>
            <Text>Contact Person: {company.contactPerson || ''}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>Proforma Invoice</Text>
            <Text style={{ textAlign: 'right', marginTop: 8 }}>
              Invoice No: {quotation.quotationNo}
            </Text>
            <Text style={{ textAlign: 'right' }}>
              Issue Date: {fmtDate(quotation.issueDate)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>TO THE BUYER:</Text>
          <Text>{customer.name}</Text>
          {customer.uen && <Text>UEN/NIPC: {customer.uen}</Text>}
          <Text>Contact: {customer.phone}</Text>
          <Text>EMAIL: {customer.email}</Text>
          <Text>Address: {customer.address}</Text>
        </View>

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

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmtMoney(Number(quotation.subtotal))}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST {Number(quotation.gstRate)}%</Text>
            <Text style={styles.totalValue}>{fmtMoney(Number(quotation.gstAmount))}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{fmtMoney(Number(quotation.total))}</Text>
          </View>
        </View>

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

          <View style={styles.termRow}>
            <Text style={styles.bold}>Bank Details for Payments:</Text>
            <Text>Beneficiary: {company.bankName || company.name}</Text>
            {company.bankAddress && <Text>Bank Address: {company.bankAddress}</Text>}
            <Text>Account No: {company.bankAccount}</Text>
            {company.swiftCode && <Text>SWIFT CODE: {company.swiftCode}</Text>}
          </View>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <Text style={styles.bold}>Party A: {company.name}</Text>
            <Text>Signatory: {company.contactPerson || ''}</Text>
            <Text>Position: CEO</Text>
            <View style={styles.signatureLine}>
              <Text>Signature: {company.contactPerson || ''}</Text>
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
      </Page>
    </Document>
  )
}
