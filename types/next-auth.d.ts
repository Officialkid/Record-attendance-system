import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: 'admin' | 'leader' | 'member';
      systemRole: 'main_admin' | 'chief_admin' | 'none';
      status: 'pending' | 'approved' | 'rejected' | 'active';
      departmentIds: number[];
      departmentRoles: Record<number, 'department_admin' | 'member'>;
      avatarUrl: string | null;
      mustChangePassword: boolean;
    };
  }

  interface User {
    id: string;
    role: 'admin' | 'leader' | 'member';
    systemRole: 'main_admin' | 'chief_admin' | 'none';
    status: 'pending' | 'approved' | 'rejected' | 'active';
    departmentIds: number[];
    departmentRoles: Record<number, 'department_admin' | 'member'>;
    avatarUrl: string | null;
    mustChangePassword: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'admin' | 'leader' | 'member';
    systemRole?: 'main_admin' | 'chief_admin' | 'none';
    status?: 'pending' | 'approved' | 'rejected' | 'active';
    departmentIds?: number[];
    departmentRoles?: Record<number, 'department_admin' | 'member'>;
    avatarUrl?: string | null;
    mustChangePassword?: boolean;
  }
}
