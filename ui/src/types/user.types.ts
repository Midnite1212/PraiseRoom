export enum UserAccessType {
  MEMBER = 'member',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

export type User = {
  id: string;
  email: string;
  fullName: string;
  accessType: UserAccessType;
};

export const isUserAccessType = (value: string): value is UserAccessType =>
  value === UserAccessType.MEMBER ||
  value === UserAccessType.EDITOR ||
  value === UserAccessType.ADMIN;

export const toUserAccessType = (value?: string): UserAccessType =>
  value !== undefined && isUserAccessType(value) ? value : UserAccessType.MEMBER;

export const canWriteSongs = (accessType?: string): boolean =>
  accessType === UserAccessType.EDITOR || accessType === UserAccessType.ADMIN;
