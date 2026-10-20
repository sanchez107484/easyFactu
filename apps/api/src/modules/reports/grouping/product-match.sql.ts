import { Prisma } from '@prisma/client';

/** Similarity (pg_trgm, 0..1) from which a free-text line is attributed to a product. */
export const PRODUCT_MATCH_THRESHOLD = 0.8;

/** Similarity from which the closest product is offered as a suggestion only. */
export const PRODUCT_SUGGESTION_THRESHOLD = 0.4;

const ACCENTED = 'áàäâãéèëêíìïîóòöôõúùüûñç';
const PLAIN = 'aaaaaeeeeiiiiooooouuuunc';

/**
 * Lower-case, accent-free, single-spaced text. Implemented with translate() so it
 * does not depend on the `unaccent` extension being installed.
 */
export function normalizedTextSql(expression: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`btrim(regexp_replace(translate(lower(${expression}), ${ACCENTED}, ${PLAIN}), '[[:space:]]+', ' ', 'g'))`;
}

const LINE_TEXT = normalizedTextSql(Prisma.sql`l.description`);
const CANDIDATE_TEXT = normalizedTextSql(Prisma.sql`candidate.name`);

/**
 * Best catalog product for a line without one (alias `matched`), by priority:
 * 1. an equivalence the user saved for this exact (normalized) description,
 * 2. a product with the identical normalized name,
 * 3. the most similar product name above the threshold.
 * Requires the invoice line alias `l`. Invoices are never modified — the match
 * only exists inside reports.
 */
export const MATCHED_PRODUCT_LATERAL_SQL = Prisma.sql`
  LEFT JOIN LATERAL (
    SELECT ranked.id
    FROM (
      SELECT alias.product_id AS id, 0 AS priority, 1::float AS score
      FROM product_aliases alias
      WHERE l.product_id IS NULL
        AND alias.tenant_id = l.tenant_id
        AND alias.normalized_description = ${LINE_TEXT}
      UNION ALL
      SELECT candidate.id,
             CASE WHEN ${CANDIDATE_TEXT} = ${LINE_TEXT} THEN 1 ELSE 2 END,
             similarity(${CANDIDATE_TEXT}, ${LINE_TEXT})::float
      FROM products candidate
      WHERE l.product_id IS NULL
        AND candidate.tenant_id = l.tenant_id
        AND (
          ${CANDIDATE_TEXT} = ${LINE_TEXT}
          OR similarity(${CANDIDATE_TEXT}, ${LINE_TEXT}) >= ${PRODUCT_MATCH_THRESHOLD}
        )
    ) ranked
    ORDER BY ranked.priority, ranked.score DESC, ranked.id
    LIMIT 1
  ) matched ON true
`;

/** The product a line counts for in reports: the selected one, else the matched one. */
export const EFFECTIVE_PRODUCT_ID_SQL = Prisma.sql`COALESCE(l.product_id, matched.id)`;

/** True when the line's product comes from the description match. */
export const IS_MATCHED_LINE_SQL = Prisma.sql`(l.product_id IS NULL AND matched.id IS NOT NULL)`;

/** Closest product below the auto-assign threshold (alias `suggested`), for review. */
export const SUGGESTED_PRODUCT_LATERAL_SQL = Prisma.sql`
  LEFT JOIN LATERAL (
    SELECT candidate.id, candidate.name, similarity(${CANDIDATE_TEXT}, ${LINE_TEXT})::float AS score
    FROM products candidate
    WHERE candidate.tenant_id = l.tenant_id
      AND similarity(${CANDIDATE_TEXT}, ${LINE_TEXT}) >= ${PRODUCT_SUGGESTION_THRESHOLD}
    ORDER BY score DESC, candidate.id
    LIMIT 1
  ) suggested ON true
`;
