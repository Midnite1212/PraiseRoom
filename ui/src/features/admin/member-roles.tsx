import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { EmptyState } from '@/components/page/empty-state';
import { Finder } from '@/components/page/finder';
import { GroupTitle } from '@/components/page/group-title';
import { LIST_CLASSES, listRowClasses, RowText } from '@/components/page/list-row';
import { LoadingStatus } from '@/components/page/loading-status';
import { InitialAvatar } from '@/components/primitives/avatar';
import { Tag } from '@/components/primitives/tag';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Session } from '@/features/auth/session';

import {
  ASSIGNABLE_ACCESS_TYPES,
  type AssignableAccessType,
  MAX_SUPERS,
  type Member,
  membersQueryOptions,
  setMemberAccessType,
} from './api';
import { countSupers, filterMembers, isAssignableAccessType, roleChangeErrorKey } from './members';

// Every member with a role picker; supers are read-only since their role is managed outside the app.
export function MemberRoles({ session }: { session: Session }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const { data: members, isPending, isError } = useQuery(membersQueryOptions());
  const change = useMutation({
    mutationFn: setMemberAccessType,
    onSuccess: (member) => {
      toast.success(
        t('admin.members.changed', {
          name: member.fullName,
          role: isAssignableAccessType(member.accessType)
            ? t(`user.accessType.${member.accessType}`)
            : member.accessType,
        })
      );
      return queryClient.invalidateQueries({ queryKey: ['ownerships'] });
    },
    onError: (error) => toast.error(t(roleChangeErrorKey(error))),
  });

  const shown = filterMembers(members ?? [], query);

  return (
    <section>
      <Finder
        value={query}
        onChange={setQuery}
        placeholder={t('admin.members.search')}
        label={t('admin.members.search')}
        sticky={false}
      />
      {members ? (
        <GroupTitle
          first
          title={t('admin.members.tab')}
          count={members.length}
          hint={t('admin.members.supers', { count: countSupers(members), max: MAX_SUPERS })}
        />
      ) : null}
      {isPending ? (
        <LoadingStatus>{t('admin.members.search')}</LoadingStatus>
      ) : isError ? (
        <EmptyState title={t('admin.members.loadFailed')} />
      ) : shown.length === 0 ? (
        <EmptyState
          title={t('admin.members.empty')}
          onClearSearch={query ? () => setQuery('') : undefined}
        />
      ) : (
        <ul className={LIST_CLASSES}>
          {shown.map((member) => (
            <MemberRow
              key={member.userId}
              member={member}
              isYou={member.userId === session.id}
              isSaving={change.isPending && change.variables.userId === member.userId}
              onChange={(accessType) => change.mutate({ userId: member.userId, accessType })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function MemberRow({
  member,
  isYou,
  isSaving,
  onChange,
}: {
  member: Member;
  isYou: boolean;
  isSaving: boolean;
  onChange: (accessType: AssignableAccessType) => void;
}) {
  const { t } = useTranslation();
  const label = t('admin.members.role', { name: member.fullName });
  const current = isAssignableAccessType(member.accessType) ? member.accessType : undefined;
  return (
    <li className={listRowClasses('min-h-[52px] grid-cols-[32px_minmax(0,1fr)_auto] px-2 py-1.5')}>
      <InitialAvatar name={member.fullName} isYou={isYou} />
      <RowText title={isYou ? `${member.fullName} · ${t('admin.members.you')}` : member.fullName} />
      {member.accessType === 'super' ? (
        <Tag className="text-ink">{t('user.accessType.super')}</Tag>
      ) : (
        <Select
          value={current}
          disabled={isSaving || isYou}
          onValueChange={(value) => {
            if (isAssignableAccessType(value) && value !== current) onChange(value);
          }}
        >
          <SelectTrigger size="sm" aria-label={label} className="w-32">
            <SelectValue placeholder={member.accessType} />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE_ACCESS_TYPES.map((accessType) => (
              <SelectItem key={accessType} value={accessType}>
                {t(`user.accessType.${accessType}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </li>
  );
}
