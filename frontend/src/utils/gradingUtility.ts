export type Grade = "A" | "B" | "C" | "D" | "E";

export function calculateTotal(caScore: number, examScore: number) {
  return caScore + examScore;
}

export function getGrade(totalScore: number): Grade {
  if (totalScore >= 80) return "A";
  if (totalScore >= 70) return "B";
  if (totalScore >= 60) return "C";
  if (totalScore >= 50) return "D";
  return "E";
}

export function getRemarks(grade: Grade) {
  const remarks: Record<Grade, string> = {
    A: "Excellent",
    B: "Very good",
    C: "Good",
    D: "Fair",
    E: "Needs improvement",
  };

  return remarks[grade];
}

export function getGradeBadgeClass(grade: string) {
  const badgeClasses: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    B: "bg-blue-100 text-blue-700 ring-blue-200",
    C: "bg-amber-100 text-amber-700 ring-amber-200",
    D: "bg-orange-100 text-orange-700 ring-orange-200",
    E: "bg-red-100 text-red-700 ring-red-200",
  };

  return badgeClasses[grade] ?? "bg-slate-100 text-slate-700 ring-slate-200";
}

export function validateScoreRange(caScore: number, examScore: number) {
  return {
    caValid: caScore >= 0 && caScore <= 40,
    examValid: examScore >= 0 && examScore <= 60,
  };
}
