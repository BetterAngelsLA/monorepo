import { useUser } from '../../../providers/user/UserProvider';
import { useResumeDocsUploads } from './useResumeDocsUploads';

/**
 * Root-mounted, renders nothing: finishes document uploads that a previous
 * app session started but never got to save.
 *
 * Mounted inside the Apollo and user providers because recovery means making
 * authenticated GraphQL calls, and gated on a signed-in user so it cannot
 * fire against an anonymous session on a cold start.
 */
export function UploadResume() {
  const { user } = useUser();

  useResumeDocsUploads(!!user?.id);

  return null;
}
