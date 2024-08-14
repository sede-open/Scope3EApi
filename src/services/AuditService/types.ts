import { AuditActionType } from '../../constants/audit';

export interface Audit {
  id: string;
  userId: string;
  action: AuditActionType;
  currentPayload?: string;
  previousPayload?: string;
}
