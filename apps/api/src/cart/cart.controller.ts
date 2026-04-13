import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CartService, type CartContext } from './cart.service';
import {
  AddCartItemSchema,
  type AddCartItemDto,
  UpdateCartItemSchema,
  type UpdateCartItemDto,
} from './cart.dto';

const CART_COOKIE = 'cart_token';
const CART_HEADER = 'x-cart-token';

function resolveContext(req: Request, header: string | undefined, user?: RequestUser): CartContext {
  if (user) return { userId: user.id };
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[CART_COOKIE];
  return { anonToken: header?.trim() || cookieToken };
}

function setAnonCookie(res: Response, token?: string) {
  if (!token) return;
  res.cookie(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 60,
  });
  res.setHeader(CART_HEADER, token);
}

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Public()
  @Get()
  async get(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers(CART_HEADER) header: string | undefined,
    @CurrentUser() user: RequestUser | undefined,
  ) {
    const ctx = resolveContext(req, header, user);
    const snap = await this.cart.snapshot(ctx);
    if ('anonToken' in snap && snap.anonToken) setAnonCookie(res, snap.anonToken);
    return snap;
  }

  @Public()
  @Post('items')
  async addItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers(CART_HEADER) header: string | undefined,
    @CurrentUser() user: RequestUser | undefined,
    @Body(new ZodValidationPipe(AddCartItemSchema)) dto: AddCartItemDto,
  ) {
    const ctx = resolveContext(req, header, user);
    const snap = await this.cart.addItem(ctx, dto);
    if (snap.anonToken) setAnonCookie(res, snap.anonToken);
    return snap;
  }

  @Public()
  @Patch('items/:id')
  async updateItem(
    @Req() req: Request,
    @Headers(CART_HEADER) header: string | undefined,
    @CurrentUser() user: RequestUser | undefined,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCartItemSchema)) dto: UpdateCartItemDto,
  ) {
    const ctx = resolveContext(req, header, user);
    return this.cart.updateItem(ctx, id, dto);
  }

  @Public()
  @Delete('items/:id')
  async removeItem(
    @Req() req: Request,
    @Headers(CART_HEADER) header: string | undefined,
    @CurrentUser() user: RequestUser | undefined,
    @Param('id') id: string,
  ) {
    const ctx = resolveContext(req, header, user);
    return this.cart.removeItem(ctx, id);
  }

  @Public()
  @Delete()
  async clear(
    @Req() req: Request,
    @Headers(CART_HEADER) header: string | undefined,
    @CurrentUser() user: RequestUser | undefined,
  ) {
    const ctx = resolveContext(req, header, user);
    return this.cart.clear(ctx);
  }
}
