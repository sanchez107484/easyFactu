import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecurringInvoiceService } from './recurring-invoice.service';
import { RecurringInvoiceSchedulerService } from './recurring-invoice-scheduler.service';
import { CreateRecurringInvoiceDto } from './dto/create-recurring-invoice.dto';
import { UpdateRecurringInvoiceDto } from './dto/update-recurring-invoice.dto';
import { QueryRecurringInvoiceDto } from './dto/query-recurring-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('Recurring Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recurring-invoices')
export class RecurringInvoiceController {
  constructor(
    private readonly recurringInvoiceService: RecurringInvoiceService,
    private readonly schedulerService: RecurringInvoiceSchedulerService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all recurring invoices for the current tenant' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryRecurringInvoiceDto) {
    return this.recurringInvoiceService.findAll(tenantId, query);
  }

  @Get(':id/generated-invoices')
  @ApiOperation({ summary: 'List invoices generated from a recurring invoice' })
  getGeneratedInvoices(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.findGeneratedInvoices(tenantId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single recurring invoice' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new recurring invoice' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateRecurringInvoiceDto) {
    return this.recurringInvoiceService.create(tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a recurring invoice' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringInvoiceDto
  ) {
    return this.recurringInvoiceService.update(tenantId, id, dto);
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause an active recurring invoice' })
  pause(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.pause(tenantId, id);
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Resume a paused recurring invoice' })
  resume(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.resume(tenantId, id);
  }

  @Post(':id/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Manually generate the next invoice for a recurring invoice' })
  generateNow(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.schedulerService.generateNow(tenantId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a recurring invoice' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.remove(tenantId, id);
  }

  /**
   * DEV-ONLY: manually trigger the recurring invoice scheduler.
   * Returns immediately with a 204 — generation runs synchronously.
   * Blocked in production.
   */
  @Post('trigger-scheduler')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[DEV] Trigger recurring invoice scheduler manually' })
  async triggerScheduler() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('This endpoint is only available in development.');
    }
    await this.schedulerService.generateDueInvoices();
  }
}
