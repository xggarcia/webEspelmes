import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService.transition (state machine)', () => {
  let service: OrdersService;
  let txMock: any;
  const inventory = { adjust: jest.fn() };
  const mailer = { send: jest.fn() };

  function arrange(currentStatus: string) {
    const order = {
      id: 'o1',
      number: 'A-0001',
      status: currentStatus,
      items: [{ productId: 'p1', quantity: 2 }],
    };
    const updated = { ...order, status: 'UPDATED' };
    txMock = {
      order: {
        findUnique: jest.fn(async () => order),
        update: jest.fn(async ({ data }: any) => ({ ...order, ...data })),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (cb: any) => cb(txMock)),
    };
    inventory.adjust.mockReset();
    service = new OrdersService(prisma as any, inventory as any, mailer as any);
    return { order, updated };
  }

  it('allows PENDING → PAID and decrements stock per item', async () => {
    arrange('PENDING');
    const result = await service.transition('o1', 'PAID', { actorId: 'u1' });
    expect(result.status).toBe('PAID');
    expect(inventory.adjust).toHaveBeenCalledTimes(1);
    expect(inventory.adjust).toHaveBeenCalledWith(
      'p1',
      -2,
      'PURCHASE',
      'order:A-0001',
      'u1',
      expect.anything(),
    );
  });

  it('allows PAID → REFUNDED and releases stock back', async () => {
    arrange('PAID');
    await service.transition('o1', 'REFUNDED');
    expect(inventory.adjust).toHaveBeenCalledTimes(1);
    expect(inventory.adjust).toHaveBeenCalledWith(
      'p1',
      2,
      'REFUND',
      'order:A-0001:refunded',
      undefined,
      expect.anything(),
    );
  });

  it('does not release stock when PENDING → CANCELLED (no stock was taken yet)', async () => {
    arrange('PENDING');
    await service.transition('o1', 'CANCELLED');
    expect(inventory.adjust).not.toHaveBeenCalled();
  });

  it('rejects illegal transition PAID → PENDING', async () => {
    arrange('PAID');
    await expect(service.transition('o1', 'PENDING')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects transition from terminal CANCELLED', async () => {
    arrange('CANCELLED');
    await expect(service.transition('o1', 'PAID')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws NotFound when order does not exist', async () => {
    arrange('PENDING');
    txMock.order.findUnique = jest.fn(async () => null);
    await expect(service.transition('missing', 'PAID')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
