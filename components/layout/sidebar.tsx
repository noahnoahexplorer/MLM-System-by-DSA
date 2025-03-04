"use client";

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  BarChart3,
  Wallet,
  FileText,
  Settings,
  Network,
  FileSpreadsheet,
  ClipboardCheck,
  CheckSquare,
  XCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { UserRole } from '@/types/auth';

export default function Sidebar() {
  const { user, hasPermission } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Define menu items with their required roles
  const menuItems = [
    {
      title: 'Weekly Commission',
      href: '/weekly-commission',
      icon: FileSpreadsheet,
      roles: ['ADMIN'] as UserRole[]
    },
    {
      title: 'Compliance Checklist',
      href: '/compliance-checklist',
      icon: ClipboardCheck,
      roles: ['COMPLIANCE', 'ADMIN'] as UserRole[]
    },
    {
      title: 'Exclusion List',
      href: '/exclusion-list',
      icon: XCircle,
      roles: ['COMPLIANCE', 'ADMIN'] as UserRole[]
    },
    {
      title: 'Marketing Ops Finalized Commission',
      href: '/marketing-ops-finalized-commission',
      icon: CheckSquare,
      roles: ['MARKETING', 'MARKETING OPS', 'ADMIN'] as UserRole[]
    },
    {
      title: 'Members',
      href: '/members',
      icon: Users,
      roles: ['MARKETING', 'MARKETING OPS', 'COMPLIANCE', 'ADMIN'] as UserRole[]
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['MARKETING', 'MARKETING OPS', 'COMPLIANCE', 'ADMIN'] as UserRole[]
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['ADMIN'] as UserRole[]
    },
    // Add other menu items with their required roles
  ];

  return (
    <aside 
      className={cn(
        "flex h-[calc(100vh-4rem)] flex-col border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item, index) => {
          // Only show menu items the user has permission to access
          if (!hasPermission(item.roles)) {
            return null;
          }
          
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className={cn(
                collapsed ? "h-5 w-5" : "h-6 w-6"
              )} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full flex justify-center"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}