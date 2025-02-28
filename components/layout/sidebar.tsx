"use client";

import { cn } from "@/lib/utils";
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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/auth-context';

const sidebarItems = [
  {
    title: "Weekly Commission List",
    icon: FileSpreadsheet,
    href: "/weekly-commission",
    requiredRoles: ['user', 'admin', 'manager'],
  },
  {
    title: "Compliance Check List",
    icon: ClipboardCheck,
    href: "/compliance-checklist",
    requiredRoles: ['user', 'admin', 'manager'],
  },
  {
    title: "Exclusion List",
    icon: XCircle,
    href: "/exclusion-list",
    requiredRoles: ['user', 'admin', 'manager'],
  },
  {
    title: "Marketing Ops - Finalized MLM Comm List",
    icon: CheckSquare,
    href: "/marketing-ops-finalized-commission",
    requiredRoles: ['user', 'admin', 'manager'],
  },
  {
    title: "Members",
    icon: Users,
    href: "/members",
    requiredRoles: ['user', 'admin', 'manager'],
  },
  {
    title: "Reports",
    icon: FileText,
    href: "/reports",
    requiredRoles: ['user', 'admin', 'manager'],
  },
  {
    title: "Admin Dashboard",
    icon: Users,
    href: "/admin",
    requiredRoles: ['admin'],
  },
  {
    title: "User Management",
    icon: Users,
    href: "/admin/users",
    requiredRoles: ['admin'],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { hasAnyPermission } = useAuth();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Filter sidebar items based on user's role with safety check
  const filteredSidebarItems = sidebarItems.filter(item => {
    try {
      if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
      return hasAnyPermission(item.requiredRoles);
    } catch (error) {
      console.error("Error filtering sidebar items:", error);
      return false;
    }
  });

  return (
    <aside 
      className={cn(
        "flex h-[calc(100vh-4rem)] flex-col border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <nav className="flex-1 space-y-1 p-4">
        {filteredSidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
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
      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="w-full flex justify-center"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-8 w-8" /> : <ChevronLeft className="h-8 w-8" />}
        </Button>
      </div>
    </aside>
  );
}