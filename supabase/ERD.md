# Database Entity Relationships

```mermaid
erDiagram
    auth_users ||--|| users : "1:1"
    users ||--o| teachers : "profile_id"
    users ||--o| students : "profile_id"
    departments ||--o{ programs : has
    departments ||--o{ teachers : employs
    programs ||--o{ students : enrolls_in
    programs ||--o{ courses : offers
    programs ||--o{ program_outcomes : defines
    teachers ||--o{ courses : teaches
    courses ||--o{ course_outcomes : has
    courses ||--o{ assessments : contains
    courses ||--o{ enrollments : has
    courses ||--o{ attainment_reports : generates
    course_outcomes ||--o{ co_po_mapping : maps
    program_outcomes ||--o{ co_po_mapping : maps
    students ||--o{ enrollments : registered
    students ||--o{ marks : receives
    assessments ||--o{ marks : scored_in
    users ||--o{ marks : entered_by
    users ||--o{ attainment_reports : generated_by
```

## Table summary

| Table | Purpose |
|-------|---------|
| `users` | Auth-linked accounts (admin / teacher / student) |
| `teachers` | Faculty metadata (employee ID, department) |
| `students` | Student metadata (roll number, program, batch) |
| `courses` | Course catalog per semester |
| `course_outcomes` | CO definitions per course |
| `program_outcomes` | PO definitions per program |
| `co_po_mapping` | CO ↔ PO correlation (1–3) |
| `marks` | Scores per student per assessment |
| `attainment_reports` | Saved CO/PO attainment snapshots (JSONB) |
