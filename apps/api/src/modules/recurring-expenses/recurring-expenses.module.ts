import { Module } from '@nestjs/common';
import { RecurringExpensesController } from './recurring-expenses.controller';
import { RecurringExpensesService } from './recurring-expenses.service';
import { RecurringExpenseSchedulerService } from './recurring-expense-scheduler.service';
import { ExpensesCalculationService } from '../expenses/expenses-calculation.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecurringExpensesController],
  providers: [RecurringExpensesService, RecurringExpenseSchedulerService, ExpensesCalculationService, SuppliersService],
  exports: [RecurringExpensesService],
})
export class RecurringExpensesModule {}
