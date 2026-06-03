import type { CodeReviewExerciseFile, CodeReviewFile, CodeReviewFinding, CodeReviewRange } from "@/lib/content/schema";

export type CodeReviewPosition = {
  filePath: string;
  line: number;
  column: number;
};

export type CodeReviewLineSegment = {
  text: string;
  startColumn: number;
  endColumn: number;
  findingId?: string;
  healthyNoteId?: string;
};

export function isCodeReviewPositionInRange(position: Pick<CodeReviewPosition, "line" | "column">, range: CodeReviewRange) {
  if (position.line < range.startLine || position.line > range.endLine) {
    return false;
  }

  if (range.startLine === range.endLine) {
    return position.column >= range.startColumn && position.column < range.endColumn;
  }

  if (position.line === range.startLine) {
    return position.column >= range.startColumn;
  }

  if (position.line === range.endLine) {
    return position.column < range.endColumn;
  }

  return true;
}

export function findCodeReviewFindingAtPosition(
  exercise: CodeReviewExerciseFile,
  position: CodeReviewPosition,
  fixedFindingIds: ReadonlySet<string> = new Set(),
) {
  return exercise.findings.find(
    (finding) =>
      !fixedFindingIds.has(finding.id) &&
      finding.range.filePath === position.filePath &&
      isCodeReviewPositionInRange({ line: position.line, column: position.column }, finding.range),
  );
}

export function findCodeReviewHealthyNoteAtPosition(exercise: CodeReviewExerciseFile, position: CodeReviewPosition) {
  return exercise.healthyNotes.find(
    (note) => note.range.filePath === position.filePath && isCodeReviewPositionInRange({ line: position.line, column: position.column }, note.range),
  );
}

export function applyCodeReviewReplacement(files: readonly CodeReviewFile[], finding: CodeReviewFinding): CodeReviewFile[] {
  return files.map((file) => {
    if (file.path !== finding.range.filePath) {
      return file;
    }

    return {
      ...file,
      lines: [
        ...file.lines.slice(0, finding.range.startLine - 1),
        ...finding.replacementLines,
        ...file.lines.slice(finding.range.endLine),
      ],
    };
  });
}

export function segmentCodeReviewLine(
  exercise: CodeReviewExerciseFile,
  file: CodeReviewFile,
  lineNumber: number,
  fixedFindingIds: ReadonlySet<string> = new Set(),
): CodeReviewLineSegment[] {
  const lineText = file.lines[lineNumber - 1] ?? "";
  const lineEndColumn = Math.max(lineText.length + 1, 1);
  const boundaries = new Set([1, lineEndColumn]);
  const activeFindings = exercise.findings.filter(
    (finding) => !fixedFindingIds.has(finding.id) && finding.range.filePath === file.path && rangeTouchesLine(finding.range, lineNumber),
  );
  const activeHealthyNotes = exercise.healthyNotes.filter((note) => note.range.filePath === file.path && rangeTouchesLine(note.range, lineNumber));

  for (const range of [...activeFindings.map((finding) => finding.range), ...activeHealthyNotes.map((note) => note.range)]) {
    const startColumn = range.startLine === lineNumber ? range.startColumn : 1;
    const endColumn = range.endLine === lineNumber ? range.endColumn : lineEndColumn;
    boundaries.add(clampColumn(startColumn, lineEndColumn));
    boundaries.add(clampColumn(endColumn, lineEndColumn));
  }

  const sortedBoundaries = [...boundaries].sort((left, right) => left - right);
  const segments: CodeReviewLineSegment[] = [];

  for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
    const startColumn = sortedBoundaries[index];
    const endColumn = sortedBoundaries[index + 1];

    if (endColumn < startColumn) {
      continue;
    }

    const position = { filePath: file.path, line: lineNumber, column: startColumn };
    const finding = activeFindings.find((item) => isCodeReviewPositionInRange(position, item.range));
    const healthyNote = activeHealthyNotes.find((item) => isCodeReviewPositionInRange(position, item.range));

    segments.push({
      text: lineText.slice(startColumn - 1, endColumn - 1),
      startColumn,
      endColumn,
      findingId: finding?.id,
      healthyNoteId: healthyNote?.id,
    });
  }

  if (segments.length === 0) {
    return [
      {
        text: "",
        startColumn: 1,
        endColumn: 1,
      },
    ];
  }

  return segments;
}

function rangeTouchesLine(range: CodeReviewRange, lineNumber: number) {
  return lineNumber >= range.startLine && lineNumber <= range.endLine;
}

function clampColumn(column: number, lineEndColumn: number) {
  return Math.min(Math.max(column, 1), lineEndColumn);
}
