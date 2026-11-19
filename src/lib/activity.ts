/**
 * Pencatatan log aktivitas admin.
 * Kegagalan pencatatan log tidak boleh menggagalkan operasi utama.
 */
import { prisma } from './prisma';

export type ActivityAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'UPLOAD'
  | 'SEED'
  | 'RESET_DEMO'
  | 'ORDER';

export type LogActivityInput = {
  actor: string;
  action: ActivityAction;
  entity: string;
  description: string;
  entityId?: string | null;
};

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actor: input.actor.slice(0, 80),
        action: input.action,
        entity: input.entity.slice(0, 40),
        entityId: input.entityId ?? null,
        description: input.description.slice(0, 300),
      },
    });
  } catch (error) {
    console.error('[activity] Gagal mencatat log:', error);
  }
}

export async function listRecentActivity(limit = 8) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
