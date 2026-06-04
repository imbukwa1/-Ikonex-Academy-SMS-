import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ClassPerformanceResults, Stream } from "../services/types";

type ClassSummaryReportProps = {
  data: ClassPerformanceResults;
  stream?: Stream;
  academicYear: string;
  dateOfIssue?: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottom: "2 solid #1d4ed8",
    paddingBottom: 14,
    marginBottom: 16,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 6,
    border: "1 solid #94a3b8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  logoText: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
  },
  academyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 2,
  },
  reportTitle: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "bold",
    color: "#1d4ed8",
    textTransform: "uppercase",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    border: "1 solid #cbd5e1",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  label: {
    fontSize: 7,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
  },
  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 25,
    alignItems: "center",
    borderBottom: "1 solid #e2e8f0",
  },
  tableHeader: {
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    fontWeight: "bold",
  },
  cellPosition: {
    width: "12%",
    padding: 6,
    textAlign: "center",
  },
  cellName: {
    width: "32%",
    padding: 6,
  },
  cellAdmission: {
    width: "18%",
    padding: 6,
  },
  cellSmall: {
    width: "12%",
    padding: 6,
    textAlign: "center",
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1 solid #cbd5e1",
    paddingTop: 16,
  },
  signatureLine: {
    width: 170,
    borderTop: "1 solid #0f172a",
    paddingTop: 4,
    textAlign: "center",
    color: "#475569",
  },
});

export function ClassSummaryReport({
  data,
  stream,
  academicYear,
  dateOfIssue = new Date().toLocaleDateString(),
}: ClassSummaryReportProps) {
  return (
    <Document title={`${stream?.name ?? "Class"} Performance Summary`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>School Logo</Text>
          </View>
          <View>
            <Text style={styles.academyName}>Ikonex Academy</Text>
            <Text style={styles.subtitle}>Class Stream: {stream?.name ?? data.stream_id}</Text>
            <Text style={styles.subtitle}>
              {data.term} | Academic Year {academicYear}
            </Text>
            <Text style={styles.reportTitle}>Class Performance Summary</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.label}>Highest Score</Text>
            <Text style={styles.value}>{data.summary.highest_score}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.label}>Lowest Score</Text>
            <Text style={styles.value}>{data.summary.lowest_score}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.label}>Class Average</Text>
            <Text style={styles.value}>{data.summary.class_average.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.label}>Students</Text>
            <Text style={styles.value}>{data.summary.students_count}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.cellPosition}>Position</Text>
            <Text style={styles.cellName}>Student Name</Text>
            <Text style={styles.cellAdmission}>Admission No.</Text>
            <Text style={styles.cellSmall}>Total</Text>
            <Text style={styles.cellSmall}>Average</Text>
            <Text style={styles.cellSmall}>Subjects</Text>
          </View>

          {data.rankings.map((ranking) => (
            <View key={ranking.student_id} style={styles.tableRow}>
              <Text style={styles.cellPosition}>{ranking.position_label}</Text>
              <Text style={styles.cellName}>{ranking.student_name}</Text>
              <Text style={styles.cellAdmission}>{ranking.admission_number}</Text>
              <Text style={styles.cellSmall}>{ranking.total_marks}</Text>
              <Text style={styles.cellSmall}>{ranking.average.toFixed(2)}</Text>
              <Text style={styles.cellSmall}>
                {ranking.subjects_recorded} / {data.expected_subjects}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.label}>Date of Issue</Text>
            <Text style={styles.value}>{dateOfIssue}</Text>
          </View>
          <Text style={styles.signatureLine}>Academic Dean Signature</Text>
          <Text style={styles.signatureLine}>Principal Signature</Text>
        </View>
      </Page>
    </Document>
  );
}
