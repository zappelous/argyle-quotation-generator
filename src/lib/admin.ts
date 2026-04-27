import { auth } from '@/lib/auth'

export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return (session?.user as any)?.role === 'admin'
}

export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Forbidden: Admin access required')
  }
}

export function softDeleteWhere(includeArchived?: boolean) {
  if (includeArchived) return {}
  return { deletedAt: null }
}
