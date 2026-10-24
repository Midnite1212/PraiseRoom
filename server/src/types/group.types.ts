import { RecordFields } from './record.types';

type GroupRecord = RecordFields & {
  urlKey: string;
  groupName: string;
  setlistIds: string[];
  createdBy?: string;
  lastUpdatedBy?: string;
  isDeleted: boolean;
};

type GroupAccess = Pick<GroupRecord, '_id' | 'urlKey' | 'createdBy' | 'groupName' | 'createdAt'>;

export { GroupAccess, GroupRecord };
