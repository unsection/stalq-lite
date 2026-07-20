export type DatabaseErrorKind = "connection" | "schema" | "unknown";

const collectErrorDetails = (error: unknown) => {
  const details: string[] = [];
  const seen = new Set<unknown>();
  let current = error;

  while (current && !seen.has(current)) {
    seen.add(current);

    if (current instanceof Error) {
      details.push(current.message);
      current = current.cause;
      continue;
    }

    if (typeof current === "object") {
      const record = current as { message?: unknown; code?: unknown; cause?: unknown };
      if (record.message) details.push(String(record.message));
      if (record.code) details.push(String(record.code));
      current = record.cause;
      continue;
    }

    details.push(String(current));
    break;
  }

  return details.join(" ");
};

export const classifyDatabaseError = (error: unknown): DatabaseErrorKind => {
  const details = collectErrorDetails(error);

  if (/42P01|42703|relation .+ does not exist|column .+ does not exist/i.test(details)) {
    return "schema";
  }

  if (
    /fetch failed|error connecting|ETIMEDOUT|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|connection terminated/i.test(
      details,
    )
  ) {
    return "connection";
  }

  return "unknown";
};
