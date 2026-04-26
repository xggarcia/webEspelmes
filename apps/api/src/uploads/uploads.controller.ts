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
const UPLOAD_ROOT = join(process.cwd(), 'uploads', 'models');

@ApiTags('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly audit: AuditService) {}

  @Post('model')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async uploadModel(
    @UploadedFile() file: Express.Multer.File | undefined,
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
}
