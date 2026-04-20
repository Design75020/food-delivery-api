export interface ParsedPagination {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function parsePagination(
  rawPage: unknown,
  rawLimit: unknown
): ParsedPagination {
  const page = Math.max(1, parseInt(String(rawPage ?? "1"), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(rawLimit ?? "20"), 10) || 20)
  );
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
}
