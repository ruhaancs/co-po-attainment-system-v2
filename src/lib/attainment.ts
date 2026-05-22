import type {
  Assessment,
  CoAttainment,
  CoPoMapping,
  CourseOutcome,
  Mark,
  PoAttainment,
  ProgramOutcome,
} from "./types";

export function calculateCoAttainment(
  outcomes: CourseOutcome[],
  assessments: Assessment[],
  marks: Mark[]
): CoAttainment[] {
  return outcomes.map((co) => {
    const coAssessments = assessments.filter((a) => a.co_id === co.id);
    if (coAssessments.length === 0) {
      return {
        co_id: co.id,
        co_number: co.co_number,
        attainment: 0,
        target: co.target_attainment,
        met: false,
      };
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const assessment of coAssessments) {
      const assessmentMarks = marks.filter(
        (m) => m.assessment_id === assessment.id
      );
      if (assessmentMarks.length === 0) continue;

      const avgScore =
        assessmentMarks.reduce((sum, m) => sum + m.marks_obtained, 0) /
        assessmentMarks.length;
      const normalized = avgScore / assessment.max_marks;
      weightedSum += normalized * assessment.weight;
      totalWeight += assessment.weight;
    }

    const attainment = totalWeight > 0 ? weightedSum / totalWeight : 0;
    return {
      co_id: co.id,
      co_number: co.co_number,
      attainment,
      target: co.target_attainment,
      met: attainment >= co.target_attainment,
    };
  });
}

export function calculatePoAttainment(
  coAttainments: CoAttainment[],
  mappings: CoPoMapping[],
  programOutcomes: ProgramOutcome[]
): PoAttainment[] {
  return programOutcomes.map((po) => {
    const poMappings = mappings.filter((m) => m.po_id === po.id);
    if (poMappings.length === 0) {
      return { po_id: po.id, po_number: po.po_number, attainment: 0 };
    }

    let weightedSum = 0;
    let totalCorrelation = 0;

    for (const mapping of poMappings) {
      const coResult = coAttainments.find((c) => c.co_id === mapping.co_id);
      if (!coResult) continue;
      weightedSum += coResult.attainment * mapping.correlation_level;
      totalCorrelation += mapping.correlation_level;
    }

    const attainment =
      totalCorrelation > 0 ? weightedSum / totalCorrelation : 0;
    return { po_id: po.id, po_number: po.po_number, attainment };
  });
}

export function getAttainmentColor(value: number): string {
  if (value >= 0.7) return "#22c55e";
  if (value >= 0.5) return "#eab308";
  return "#ef4444";
}
