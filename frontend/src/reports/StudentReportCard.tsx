import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { StudentResults } from "../services/types";

type StudentReportCardProps = {
  data: StudentResults;
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
    width: 58,
    height: 58,
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
    color: "#0f172a",
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
  infoCard: {
    border: "1 solid #cbd5e1",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#f8fafc",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 8,
  },
  label: {
    fontSize: 7,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
  },
  warning: {
    marginTop: 6,
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
    minHeight: 26,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    fontWeight: "bold",
  },
  cellSubject: {
    width: "24%",
    padding: 6,
  },
  cellSmall: {
    width: "10%",
    padding: 6,
    textAlign: "center",
  },
  cellPosition: {
    width: "12%",
    padding: 6,
    textAlign: "center",
  },
  cellRemarks: {
    width: "24%",
    padding: 6,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    border: "1 solid #cbd5e1",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  remarksBox: {
    border: "1 solid #cbd5e1",
    borderRadius: 5,
    padding: 12,
    minHeight: 54,
    marginBottom: 20,
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1 solid #cbd5e1",
    paddingTop: 16,
  },
  signatureLine: {
    width: 150,
    borderTop: "1 solid #0f172a",
    paddingTop: 4,
    textAlign: "center",
    color: "#475569",
  },
});

function principalRemarks(average: number) {
  if (average >= 80) return "Outstanding achievement. Maintain the excellent standard.";
  if (average >= 70) return "Strong performance with clear commitment to academic growth.";
  if (average >= 60) return "Satisfactory progress. Keep strengthening weaker areas.";
  if (average >= 50) return "Fair progress. More consistent revision is recommended.";
  return "Focused support and close follow-up are required next term.";
}

export function canGenerateStudentReport(data: StudentResults) {
  return data.report_ready && data.subjects.length >= data.expected_subjects;
}

export function StudentReportCard({
  data,
  academicYear,
  dateOfIssue = new Date().toLocaleDateString(),
}: StudentReportCardProps) {
  const studentName = `${data.student.first_name} ${data.student.last_name}`;
  const streamName = data.student.stream?.name ?? "Not assigned";
  const reportReady = canGenerateStudentReport(data);

  return (
    <Document title={`${studentName} Report Card`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>School Logo</Text>
          </View>
          <View>
            <Text style={styles.academyName}>Ikonex Academy</Text>
            <Text style={styles.subtitle}>Student Management System</Text>
            <Text style={styles.subtitle}>
              {data.term} | Academic Year {academicYear}
            </Text>
            <Text style={styles.reportTitle}>Individual Student Report Card</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Student Name</Text>
              <Text style={styles.value}>{studentName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Admission Number</Text>
              <Text style={styles.value}>{data.student.admission_number}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Class Stream</Text>
              <Text style={styles.value}>{streamName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Overall Position</Text>
              <Text style={styles.value}>
                {data.overall_position_label ?? "Pending"}
              </Text>
            </View>
          </View>

          {!reportReady ? (
            <Text style={styles.warning}>
              Report incomplete. Missing marks for:{" "}
              {data.missing_subjects.map((subject) => subject.name).join(", ") ||
                "one or more assigned subjects"}
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Academic Performance</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.cellSubject}>Subject</Text>
            <Text style={styles.cellSmall}>CA /40</Text>
            <Text style={styles.cellSmall}>Exam /60</Text>
            <Text style={styles.cellSmall}>Total</Text>
            <Text style={styles.cellSmall}>Grade</Text>
            <Text style={styles.cellPosition}>Position</Text>
            <Text style={styles.cellRemarks}>Teacher Remarks</Text>
          </View>

          {data.subjects.map((subject) => (
            <View key={subject.subject_id} style={styles.tableRow}>
              <Text style={styles.cellSubject}>{subject.subject_name}</Text>
              <Text style={styles.cellSmall}>{subject.ca_score}</Text>
              <Text style={styles.cellSmall}>{subject.exam_score}</Text>
              <Text style={styles.cellSmall}>{subject.total_score}</Text>
              <Text style={styles.cellSmall}>{subject.grade}</Text>
              <Text style={styles.cellPosition}>
                {subject.subject_position_label ?? "Pending"}
              </Text>
              <Text style={styles.cellRemarks}>{subject.remarks}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.label}>Total Marks Obtained</Text>
            <Text style={styles.value}>{data.total_marks}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.label}>Mean Score</Text>
            <Text style={styles.value}>{data.average.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.label}>Subjects Recorded</Text>
            <Text style={styles.value}>
              {data.subjects.length} / {data.expected_subjects}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Principal's Remarks</Text>
        <View style={styles.remarksBox}>
          <Text>{principalRemarks(data.average)}</Text>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.label}>Date of Issue</Text>
            <Text style={styles.value}>{dateOfIssue}</Text>
          </View>
          <Text style={styles.signatureLine}>Class Teacher Signature</Text>
          <Text style={styles.signatureLine}>Principal Signature</Text>
        </View>
      </Page>
    </Document>
  );
}
