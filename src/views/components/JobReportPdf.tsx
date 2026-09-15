import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PdfData } from '@/models/job-report.model'
import { parseReportHtml, type TextRun } from '@/utils/richTextPdf'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 16,
  },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  label: { fontFamily: 'Helvetica-Bold', minWidth: 100 },
  value: { color: '#4b5563' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#374151' },
  body: { lineHeight: 1.6, color: '#374151' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  evidenceItem: { marginBottom: 4, color: '#4b5563' },
  checklistItem: { marginBottom: 4 },
  checklistChecked: { color: '#374151' },
  checklistUnchecked: { color: '#9ca3af', fontStyle: 'italic' },
})

function runStyle(r: TextRun) {
  const bold = r.bold
  const italic = r.italic
  return {
    fontFamily:
      bold && italic
        ? 'Helvetica-BoldOblique'
        : bold
          ? 'Helvetica-Bold'
          : italic
            ? 'Helvetica-Oblique'
            : 'Helvetica',
    textDecoration: r.underline ? ('underline' as const) : undefined,
  }
}

function RichRuns({ runs }: { runs: TextRun[] }) {
  return (
    <>
      {runs.map((r, i) => (
        <Text key={i} style={runStyle(r)}>
          {r.text}
        </Text>
      ))}
    </>
  )
}

const HEADING_SIZES: Record<1 | 2 | 3, number> = { 1: 15, 2: 13, 3: 12 }

/** Renderiza o HTML do TipTap preservando negrito/itálico/sublinhado/headings/listas. */
function ReportBody({ html }: { html: string }) {
  const blocks = parseReportHtml(html)
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          return (
            <Text
              key={i}
              style={[
                styles.body,
                {
                  fontFamily: 'Helvetica-Bold',
                  fontSize: HEADING_SIZES[b.level],
                  marginBottom: 4,
                  marginTop: i > 0 ? 8 : 0,
                },
              ]}
            >
              <RichRuns runs={b.runs} />
            </Text>
          )
        }
        if (b.type === 'list') {
          return (
            <View key={i} style={{ marginBottom: 6 }}>
              {b.items.map((runs, j) => (
                <Text key={j} style={[styles.body, { marginLeft: 12 }]}>
                  {b.ordered ? `${j + 1}. ` : '•  '}
                  <RichRuns runs={runs} />
                </Text>
              ))}
            </View>
          )
        }
        return (
          <Text key={i} style={[styles.body, { marginBottom: 6 }]}>
            <RichRuns runs={b.runs} />
          </Text>
        )
      })}
    </>
  )
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
            <Text style={styles.value}>
              {data.city} / {data.state}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Tipo:</Text>
            <Text style={styles.value}>
              {data.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}
            </Text>
          </View>
        </View>

        {/* Report body */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relatório</Text>
          <ReportBody html={data.reportContent} />
        </View>

        {/* Evidences list */}
        {data.evidences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidências</Text>
            {data.evidences.map((ev, i) => (
              <Text key={i} style={styles.evidenceItem}>
                • {ev.fileName} ({ev.type})
              </Text>
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
                style={[
                  styles.checklistItem,
                  item.checked ? styles.checklistChecked : styles.checklistUnchecked,
                ]}
              >
                {item.checked ? '✓' : '✗'} {item.toolName}
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>SR Energy — Relatório #{data.jobId.slice(0, 8)}</Text>
          <Text>
            {data.employeeName} — {formatDate(data.submittedAt)}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
