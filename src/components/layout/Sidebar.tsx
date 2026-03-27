'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard, BarChart2, Target, Users, Briefcase,
  GitFork, Settings, LogOut,
} from 'lucide-react';
import { Role } from '@/types';
import { ROLE_LABELS } from '@/lib/roles';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[] | 'all';
}

const NAV: NavItem[] = [
  { href: '/dashboard',       label: 'Dashboard',        icon: LayoutDashboard, roles: 'all' },
  { href: '/metrics',         label: 'Metrics',          icon: BarChart2,       roles: ['Admin', 'SalesHead', 'VH', 'Manager'] },
  { href: '/targets/assign',  label: 'Assign Targets',   icon: Target,          roles: ['Admin', 'SalesHead', 'VH', 'Manager'] },
  { href: '/team',            label: 'My Team',          icon: Users,           roles: ['Admin', 'SalesHead', 'VH', 'Manager'] },
  { href: '/deals',           label: 'Deals',            icon: Briefcase,       roles: 'all' },
  { href: '/org',             label: 'Org Chart',        icon: GitFork,         roles: ['Admin', 'SalesHead', 'VH'] },
  { href: '/incentives',      label: 'Commission Config',icon: Settings,        roles: ['Admin', 'SalesHead', 'Manager'] },
];

const ROLE_BADGE_COLORS: Record<Role, string> = {
  Admin:      'bg-rose-100 text-rose-600',
  SalesHead:  'bg-blue-100 text-blue-600',
  VH:         'bg-indigo-100 text-indigo-600',
  Manager:    'bg-green-100 text-green-600',
  Associate:  'bg-gray-100 text-gray-600',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;

  const visible = NAV.filter(item =>
    item.roles === 'all' || (role && (item.roles as Role[]).includes(role))
  );

  return (
    <aside className="w-[260px] min-h-screen bg-white border-r border-[#E2E8F0] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 h-16 flex items-center border-b border-[#E2E8F0]">
        <span className="text-xl font-bold text-[#2563EB]">Dollar.v2</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visible.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#EFF6FF] text-[#2563EB]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div className="border-t border-[#E2E8F0] px-4 py-4">
        {session?.user && (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0F172A] truncate">{session.user.name}</p>
              <p className="text-xs text-[#94A3B8] truncate">{session.user.email}</p>
              {role && (
                <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_COLORS[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="mt-0.5 text-[#94A3B8] hover:text-[#64748B] transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
