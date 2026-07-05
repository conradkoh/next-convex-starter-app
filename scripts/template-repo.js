/**
 * Canonical template repository identity for fork/upstream checks.
 */
const TEMPLATE_REPO_URL = 'https://github.com/conradkoh/next-convex-starter-app';
const TEMPLATE_OWNER_REPO = 'conradkoh/next-convex-starter-app';

/**
 * Parse owner/repo from a GitHub URL.
 * Supports:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   git@github.com:owner/repo.git
 *
 * @param {string} repoUrl
 * @returns {{ owner: string, repo: string } | null}
 */
function parseGitHubOwnerRepo(repoUrl) {
  const httpsMatch = repoUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }
  return null;
}

/**
 * @param {string | null | undefined} remoteUrl
 * @returns {string | null} Normalized "owner/repo" or null
 */
function normalizeOwnerRepo(remoteUrl) {
  if (!remoteUrl) {
    return null;
  }

  const parsed = parseGitHubOwnerRepo(remoteUrl.trim());
  if (!parsed) {
    return null;
  }

  return `${parsed.owner}/${parsed.repo}`;
}

/**
 * @param {string | null | undefined} remoteUrl
 * @returns {boolean}
 */
function isTemplateRemote(remoteUrl) {
  return normalizeOwnerRepo(remoteUrl) === TEMPLATE_OWNER_REPO;
}

module.exports = {
  TEMPLATE_REPO_URL,
  TEMPLATE_OWNER_REPO,
  parseGitHubOwnerRepo,
  isTemplateRemote,
};
