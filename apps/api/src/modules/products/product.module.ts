import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductImportService } from './product-import.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductImportService],
  exports: [ProductService],
})
export class ProductModule {}
