import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { ExpensesCalculationService } from './expenses-calculation.service';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [SuppliersModule, GuardsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesCalculationService],
  exports: [ExpensesService, ExpensesCalculationService],
})
export class ExpensesModule {}
