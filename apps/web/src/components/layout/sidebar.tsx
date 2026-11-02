'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Workflow,
  ListTodo,
  Image,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/motion';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Workspace', href: '/workspace', icon: Workflow },
  { label: 'Queue', href: '/queue', icon: ListTodo },
  { label: 'Library', href: '/library', icon: Image },
  { label: 'Insights', href: '/insights', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={spring}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-surface-300 bg-surface-50"
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-surface-300 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-500">
          <InstagramIcon className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={spring}
              className="overflow-hidden whitespace-nowrap font-display text-sm font-bold text-surface-950"
            >
              PostPilot
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'text-surface-950'
                  : 'text-surface-700 hover:text-surface-900 hover:bg-surface-200',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-surface-200 border border-surface-300"
                  transition={spring}
                />
              )}
              <item.icon className="relative z-10 h-4 w-4 shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={spring}
                    className="relative z-10 overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* AI Agent quick launch */}
      <div className="border-t border-surface-300 p-2">
        <Link
          href="/workspace"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'bg-accent-500/10 text-accent-400 hover:bg-accent-500/20',
          )}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={spring}
                className="overflow-hidden whitespace-nowrap"
              >
                New Post
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-10 items-center justify-center border-t border-surface-300 text-surface-600 hover:text-surface-900 transition-colors"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={spring}>
          <ChevronLeft className="h-4 w-4" />
        </motion.div>
      </button>
    </motion.aside>
  );
}
