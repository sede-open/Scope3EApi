/**
 * Accepts a page size and page number and returns TypeORM find options
 * to paginate a result.
 *
 * Example usage:
 *
 * repository.find({
 *   where: {
 *     name: 'jerry'
 *   },
 *   ...getPageOffset(pageSize, pageNumber),
 * });
 *
 * @param pageNumber min value: 1
 * @param pageSize any positive integer
 */
export function getPageOffset(
  pageSize?: number,
  pageNumber?: number
): Partial<{ skip: number; take: number }> {
  if (!pageNumber || !pageSize) {
    return {};
  }

  const skip = pageNumber * pageSize - pageSize;

  return { skip, take: pageSize };
}
