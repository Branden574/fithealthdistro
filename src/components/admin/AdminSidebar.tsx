'use client';

import { Sidebar, type SidebarSection } from '@ds';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition, type MouseEvent } from 'react';
import { CATEGORIES_PATH, CLIENTS_PATH, INQUIRIES_PATH, PRODUCTS_PATH } from '@/lib/admin/paths';
import { signOut } from '@/lib/admin/session-actions';

interface AdminSidebarProps {
  name: string;
  /** How many products exist, shown beside Products. */
  productCount?: number;
  /** How many inquiries nobody has opened yet, shown beside Inquiries while there are any. */
  newInquiries?: number;
}

/** The admin's rail. Items are real links; with the script they move between pages without a full reload. */
export function AdminSidebar({ name, productCount, newInquiries }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const sections: SidebarSection[] = [
    {
      title: 'Catalog',
      items: [
        { id: PRODUCTS_PATH, label: 'Products', icon: 'package', href: PRODUCTS_PATH, count: productCount },
        { id: CATEGORIES_PATH, label: 'Categories', icon: 'tag', href: CATEGORIES_PATH },
      ],
    },
    {
      title: 'Clients',
      items: [
        { id: INQUIRIES_PATH, label: 'Inquiries', icon: 'tray', href: INQUIRIES_PATH, count: newInquiries ? newInquiries : undefined },
        { id: CLIENTS_PATH, label: 'Clients', icon: 'users-three', href: CLIENTS_PATH },
      ],
    },
  ];
  const current = sections
    .flatMap((section) => section.items)
    .find((item) => item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`)))?.id;

  function select(id: string, event: MouseEvent<HTMLElement>) {
    const mouse = event as MouseEvent<HTMLAnchorElement>;
    if (mouse.button !== 0 || mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey) return;
    event.preventDefault();
    router.push(id);
  }

  return (
    <Sidebar
      sections={sections}
      current={current}
      onSelect={select}
      label="Admin"
      user={{ name, role: 'Admin', onSignOut: () => startTransition(() => signOut()) }}
    />
  );
}
