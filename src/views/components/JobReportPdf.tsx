import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PdfData } from '@/models/job-report.model'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 16 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  label: { fontFamily: 'Helvetica-Bold', minWidth: 100 },
  value: { color: '#4b5563' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#374151' },
  body: { lineHeight: 1.6, color: '#374151' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 9, color: '#9ca3af', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  evidenceItem: { marginBottom: 4, color: '#4b5563' },
  checklistItem: { marginBottom: 4 },
  checklistChecked: { color: '#374151' },
  checklistUnchecked: { color: '#9ca3af', fontStyle: 'italic' },
})

/** Strip HTML tags from TipTap content for plain text PDF rendering */
function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/h[1-3]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

interface JobReportPdfProps {
  data: PdfData
}

export function JobReportPdf({ data }: JobReportPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de OS</Text>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Data:</Text>
            <Text style={styles.value}>{formatDate(data.scheduledDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Funcionário:</Text>
            <Text style={styles.value}>{data.employeeName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Máquina:</Text>
            <Text style={styles.value}>{data.machineName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Local:</Text>
            <Text style={styles.value}>{data.city} / {data.state}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Tipo:</Text>
            <Text style={styles.value}>{data.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</Text>
          </View>
        </View>

        {/* Report body */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relatório</Text>
          <Text style={styles.body}>{stripHtml(data.reportContent)}</Text>
        </View>

        {/* Evidences list */}
        {data.evidences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidências</Text>
            {data.evidences.map((ev, i) => (
              <Text key={i} style={styles.evidenceItem}>• {ev.fileName} ({ev.type})</Text>
            ))}
          </View>
        )}

        {/* Checklist */}
        {(data.checklist ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checklist de Ferramentas</Text>
            {(data.checklist ?? []).map((item, i) => (
              <Text
                key={i}
                style={[styles.checklistItem, item.checked ? styles.checklistChecked : styles.checklistUnchecked]}
              >
                {item.checked ? '✓' : '✗'} {item.toolName}
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>SR Energy — Relatório #{data.jobId.slice(0, 8)}</Text>
          <Text>{data.employeeName} — {formatDate(data.submittedAt)}</Text>
        </View>
      </Page>
    </Document>
  )
}
