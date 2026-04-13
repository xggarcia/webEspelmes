import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { PageQuerySchema } from '@espelmes/shared';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ProductsService } from './products.service';

const ProductListQuerySchema = PageQuerySchema.extend({
  categorySlug: z.string().min(1).optional(),
  search: z.string().min(1).max(80).optional(),
  customizableOnly: z.coerce.boolean().optional(),
});

@ApiTags('catalog')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get()
  list(@Query(new ZodValidationPipe(ProductListQuerySchema)) q: z.infer<typeof ProductListQuerySchema>) {
    return this.products.list(q);
  }

  @Public()
  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.products.bySlug(slug);
  }
}
