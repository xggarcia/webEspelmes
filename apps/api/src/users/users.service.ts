import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  async listCustomers(page = 1, pageSize = 20) {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { total, page, pageSize, items };
  }

  async updateProfile(id: string, data: { name?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();
    return this.prisma.user.update({
      where: { id },
      data: { name: data.name ?? user.name },
      select: { id: true, email: true, name: true, role: true },
    });
  }
}
