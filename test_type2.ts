import { authClient } from './apps/web/lib/auth-client'; authClient.wrongPassword({ newPassword: '1', currentPassword: '2', revokeOtherSessions: true });
