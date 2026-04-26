import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Request } from 'express';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

const MAX_BYTES = 60 * 1024 * 1024; // 60MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const UPLOAD_ROOT = join(process.cwd(), 'uploads', 'models');
const UPLOAD_IMAGES_ROOT = join(process.cwd(), 'uploads', 'images');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

type UploadedFileInput = {
  originalname: string;
  size: number;
  buffer: Buffer;
  mimetype: string;
};

@ApiTags('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly audit: AuditService) {}

  private toPublicAssetUrl(req: Request, pathname: string) {
    const host = req.get('host');
    if (!host) return pathname;
    const protoHeader = req.get('x-forwarded-proto');
    const protocol = protoHeader?.split(',')[0]?.trim() || req.protocol || 'http';
    return `${protocol}://${host}${pathname}`;
  }

  @Post('model')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async uploadModel(
    @UploadedFile() file: UploadedFileInput | undefined,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const name = file.originalname.toLowerCase();
    if (!name.endsWith('.glb')) {
      throw new BadRequestException('Only .glb files are accepted');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('File exceeds 60MB limit');
    }

    await mkdir(UPLOAD_ROOT, { recursive: true });
    const filename = `${randomUUID()}.glb`;
    await writeFile(join(UPLOAD_ROOT, filename), file.buffer);
    const url = `/uploads/models/${filename}`;

    await this.audit.record({
      action: 'product.model.upload',
      actorId: user.id,
      ip: req.ip,
      metadata: {
        originalName: file.originalname,
        size: file.size,
        storedUrl: url,
      },
    });

    return { url };
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  async uploadImage(
    @UploadedFile() file: UploadedFileInput | undefined,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const lowerName = file.originalname.toLowerCase();
    const ext = lowerName.slice(lowerName.lastIndexOf('.'));
    if (!IMAGE_EXTENSIONS.has(ext)) {
      throw new BadRequestException('Only jpg, jpeg, png, webp, avif files are accepted');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are accepted');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image exceeds 10MB limit');
    }

    await mkdir(UPLOAD_IMAGES_ROOT, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    await writeFile(join(UPLOAD_IMAGES_ROOT, filename), file.buffer);
    const publicPath = `/uploads/images/${filename}`;
    const url = this.toPublicAssetUrl(req, publicPath);

    await this.audit.record({
      action: 'product.image.upload',
      actorId: user.id,
      ip: req.ip,
      metadata: {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        storedUrl: url,
      },
    });

    return { url };
  }
}
