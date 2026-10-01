import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

const INVOICE_STATUSES = ["'CONFIRMED'", "'SENT'", "'PAID'"];

interface IncomeRow {
  month: number;
  total: string | null;
}

interface ExpenseRow {
  month: number;
  total: string | null;
}

interface CategoryRow {
  categoryId: string;
  name: string;
  amount: string | null;
}

interface MonthlyCategoryRow {
  month: number;
  categoryId: string;
  name: string;
  amount: string | null;
}

interface ExpenseDetailRow {
  id: string;
  date: Date;
  description: string;
  categoryId: string;
  categoryName: string;
  amount: string | null;
}

interface KpiRow {
  this_month: string | null;
  last_month: string | null;
  this_year: string | null;
}

@Injectable()
export class ActivitySummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 1);
    const lastMonthEnd = thisMonthStart;
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);

    const statusFilter = `status IN (${INVOICE_STATUSES.join(', ')})`;

    const [
      incomeKpiRows,
      incomeMonthlyRows,
      expenseKpiRows,
      expenseMonthlyRows,
      categoryRows,
      monthlyCategoryRows,
      expenseDetailRows,
    ] = await Promise.all([
      this.prisma.$queryRaw<KpiRow[]>`
        SELECT
          SUM(total) FILTER (WHERE issue_date >= ${thisMonthStart} AND issue_date < ${thisMonthEnd})::text AS this_month,
          SUM(total) FILTER (WHERE issue_date >= ${lastMonthStart} AND issue_date < ${lastMonthEnd})::text AS last_month,
          SUM(total) FILTER (WHERE issue_date >= ${yearStart} AND issue_date < ${yearEnd})::text AS this_year
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND ${Prisma.raw(statusFilter)}
      `,
      this.prisma.$queryRaw<IncomeRow[]>`
        SELECT
          EXTRACT(MONTH FROM issue_date)::int AS month,
          SUM(total)::text AS total
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND ${Prisma.raw(statusFilter)}
          AND issue_date >= ${yearStart}
          AND issue_date < ${yearEnd}
        GROUP BY month
      `,
      this.prisma.$queryRaw<KpiRow[]>`
        SELECT
          SUM(total_amount) FILTER (WHERE date >= ${thisMonthStart} AND date < ${thisMonthEnd})::text AS this_month,
          SUM(total_amount) FILTER (WHERE date >= ${lastMonthStart} AND date < ${lastMonthEnd})::text AS last_month,
          SUM(total_amount) FILTER (WHERE date >= ${yearStart} AND date < ${yearEnd})::text AS this_year
        FROM expenses
        WHERE tenant_id = ${tenantId}
      `,
      this.prisma.$queryRaw<ExpenseRow[]>`
        SELECT
          EXTRACT(MONTH FROM date)::int AS month,
          SUM(total_amount)::text AS total
        FROM expenses
        WHERE tenant_id = ${tenantId}
          AND date >= ${yearStart}
          AND date < ${yearEnd}
        GROUP BY month
      `,
      this.prisma.$queryRaw<CategoryRow[]>`
        SELECT
          e.category_id AS "categoryId",
          COALESCE(ec.name, 'Sin categoría') AS name,
          SUM(e.total_amount)::text AS amount
        FROM expenses e
        LEFT JOIN expense_categories ec ON ec.id = e.category_id
        WHERE e.tenant_id = ${tenantId}
          AND e.date >= ${yearStart}
          AND e.date < ${yearEnd}
        GROUP BY e.category_id, ec.name
        ORDER BY SUM(e.total_amount) DESC NULLS LAST
        LIMIT 5
      `,
      this.prisma.$queryRaw<MonthlyCategoryRow[]>`
        SELECT
          EXTRACT(MONTH FROM e.date)::int AS month,
          e.category_id AS "categoryId",
          COALESCE(ec.name, 'Sin categoría') AS name,
          SUM(e.total_amount)::text AS amount
        FROM expenses e
        LEFT JOIN expense_categories ec ON ec.id = e.category_id
        WHERE e.tenant_id = ${tenantId}
          AND e.date >= ${yearStart}
          AND e.date < ${yearEnd}
        GROUP BY EXTRACT(MONTH FROM e.date), e.category_id, ec.name
        ORDER BY month, SUM(e.total_amount) DESC NULLS LAST
      `,
      this.prisma.$queryRaw<ExpenseDetailRow[]>`
        SELECT
          e.id,
          e.date,
          e.description,
          e.category_id AS "categoryId",
          COALESCE(ec.name, 'Sin categoría') AS "categoryName",
          e.total_amount::text AS amount
        FROM expenses e
        LEFT JOIN expense_categories ec ON ec.id = e.category_id
        WHERE e.tenant_id = ${tenantId}
          AND e.date >= ${yearStart}
          AND e.date < ${yearEnd}
        ORDER BY e.date DESC
      `,
    ]);

    const incomeKpi = incomeKpiRows[0];
    const expenseKpi = expenseKpiRows[0];

    const incomeByMonth = new Map<number, number>();
    for (const row of incomeMonthlyRows) {
      incomeByMonth.set(row.month - 1, Number(row.total ?? 0));
    }

    const expenseByMonth = new Map<number, number>();
    for (const row of expenseMonthlyRows) {
      expenseByMonth.set(row.month - 1, Number(row.total ?? 0));
    }

    const monthlyChart = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_NAMES[i]!,
      ingresos: Math.round((incomeByMonth.get(i) ?? 0) * 100) / 100,
      gastos: Math.round((expenseByMonth.get(i) ?? 0) * 100) / 100,
    }));

    const topExpenseCategories = categoryRows.map((row) => ({
      categoryId: row.categoryId,
      name: row.name,
      amount: Math.round(Number(row.amount ?? 0) * 100) / 100,
    }));

    const monthlyExpenseCategoriesMap = new Map<number, Map<string, { categoryId: string; name: string; amount: number }>>();
    for (const row of monthlyCategoryRows) {
      const monthIndex = row.month - 1;
      if (!monthlyExpenseCategoriesMap.has(monthIndex)) {
        monthlyExpenseCategoriesMap.set(monthIndex, new Map());
      }
      const categoryMap = monthlyExpenseCategoriesMap.get(monthIndex)!;
      const existing = categoryMap.get(row.categoryId);
      const amount = Math.round(Number(row.amount ?? 0) * 100) / 100;
      if (existing) {
        existing.amount += amount;
      } else {
        categoryMap.set(row.categoryId, {
          categoryId: row.categoryId,
          name: row.name,
          amount,
        });
      }
    }

    const monthlyExpenseCategories = Array.from({ length: 12 }, (_, i) => {
      const categoryMap = monthlyExpenseCategoriesMap.get(i);
      const categories = categoryMap
        ? Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 6)
        : [];
      return {
        month: MONTH_NAMES[i]!,
        categories,
      };
    });

    const monthlyExpensesMap = new Map<number, Array<{ id: string; date: string; description: string; categoryId: string; categoryName: string; amount: number }>>();
    for (const row of expenseDetailRows) {
      const monthIndex = row.date.getMonth();
      if (!monthlyExpensesMap.has(monthIndex)) {
        monthlyExpensesMap.set(monthIndex, []);
      }
      monthlyExpensesMap.get(monthIndex)!.push({
        id: row.id,
        date: row.date.toISOString().split('T')[0]!,
        description: row.description,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        amount: Math.round(Number(row.amount ?? 0) * 100) / 100,
      });
    }

    const monthlyExpenses = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_NAMES[i]!,
      expenses: monthlyExpensesMap.get(i) ?? [],
    }));

    return {
      incomeThisMonth: Math.round(Number(incomeKpi?.this_month ?? 0) * 100) / 100,
      incomeLastMonth: Math.round(Number(incomeKpi?.last_month ?? 0) * 100) / 100,
      incomeThisYear: Math.round(Number(incomeKpi?.this_year ?? 0) * 100) / 100,
      expenseThisMonth: Math.round(Number(expenseKpi?.this_month ?? 0) * 100) / 100,
      expenseLastMonth: Math.round(Number(expenseKpi?.last_month ?? 0) * 100) / 100,
      expenseThisYear: Math.round(Number(expenseKpi?.this_year ?? 0) * 100) / 100,
      monthlyChart,
      topExpenseCategories,
      monthlyExpenseCategories,
      monthlyExpenses,
    };
  }
}
