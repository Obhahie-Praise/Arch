import { authClient } from './apps/web/lib/auth-client'; authClient.changePassword({ newPassword: '1', currentPassword: '2', revokeOtherSessions: true });
