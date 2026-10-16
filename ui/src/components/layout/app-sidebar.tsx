import { Link } from '@tanstack/react-router';
import { Folder, Home, ListMusic, Music } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
  { to: '/', labelKey: 'nav.home', icon: Home },
  { to: '/setlists', labelKey: 'nav.setlists', icon: ListMusic },
  { to: '/folders', labelKey: 'nav.folders', icon: Folder },
  { to: '/songs', labelKey: 'nav.songs', icon: Music },
] as const;

export function AppSidebar() {
  const { t } = useTranslation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <span className="font-heading truncate px-2 py-1.5 text-base font-semibold">
          {t('app.name')}
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild tooltip={t(labelKey)}>
                    <Link
                      to={to}
                      activeOptions={{ exact: to === '/' }}
                      activeProps={{ 'data-active': true }}
                    >
                      <Icon />
                      <span>{t(labelKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
