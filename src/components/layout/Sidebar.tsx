'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Role } from '@/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles';

interface NavItem {
  href: string;
  label: string;
  roles: Role[] | 'all';
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',        label: 'Dashboard',    roles: 'all' },
  { href: '/targets',          label: 'My Targets',   roles: 'all' },
  { href: '/targets/assign',   label: 'Assign Targets', roles: ['Admin', 'SalesHead', 'VH', 'Manager'] },
  { href: '/team',             label: 'My Team',      roles: ['Admin', 'SalesHead', 'VH', 'Manager'] },
  { href: '/incentives',       label: 'Incentives',   roles: ['Admin', 'SalesHead', 'Manager'] },
  { href: '/reports',          label: 'Reports',      roles: ['Admin', 'SalesHead', 'VH'] },
  { href: '/users',            label: 'Users',        roles: ['Admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;

  const visible = NAV_ITEMS.filter(item =>
    item.roles === 'all' || (role && item.roles.includes(role))
  );

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white">Target Manager</h1>
        {session?.user && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-200">{session.user.name}</p>
            <p className="text-xs text-gray-400">{session.user.email}</p>
            {role && (
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS[role]}
              </span>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visible.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-sm text-gray-400 hover:text-white transition-colors text-left px-3 py-2 rounded-lg hover:bg-gray-800"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
