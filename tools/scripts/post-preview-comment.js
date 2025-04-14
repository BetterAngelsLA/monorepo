import fs from 'fs';
import fetch from 'node-fetch';

// Fetch all comments with pagination
async function fetchAllComments(owner, repo, issueNumber, token) {
  let comments = [];
  let url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=100`;
  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to fetch comments: ${err}`);
    }
    comments = comments.concat(await res.json());
    const linkHeader = res.headers.get('link');
    if (linkHeader) {
      // Parse next link from Link header
      const links = linkHeader.split(',').reduce((acc, part) => {
        const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
        if (match) acc[match[2]] = match[1];
        return acc;
      }, {});
      url = links.next || null;
    } else {
      url = null;
    }
  }
  return comments;
}

async function main() {
  // Validate required environment variables
  const requiredVars = [
    'GITHUB_TOKEN',
    'GITHUB_REPOSITORY',
    'GITHUB_EVENT_PATH',
  ];
  const missingVars = requiredVars.filter((v) => !process.env[v]);
  if (missingVars.length) {
    throw new Error(`Missing required env vars: ${missingVars.join(', ')}`);
  }

  const {
    GITHUB_TOKEN,
    GITHUB_REPOSITORY,
    GITHUB_EVENT_PATH,
    NX_TASK_TARGET_PROJECT,
  } = process.env;
  const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));
  const prNumber = event.pull_request?.number;
  if (!prNumber) {
    throw new Error('Not a pull_request event.');
  }
  const [owner, repo] = GITHUB_REPOSITORY.split('/');

  // Retrieve and process the preview URL from CLI args
  const urlArg = process.argv.find((arg) => arg.startsWith('--url='));
  if (!urlArg) {
    throw new Error('Missing --url argument');
  }
  const previewUrl = urlArg.split('=')[1].trim();
  const project = NX_TASK_TARGET_PROJECT || 'default';

  const commentPrefix = `🔍 [${project}] Preview available at:`;
  const timestamp = new Date().toISOString();
  const fullComment = `${commentPrefix} [${previewUrl}](${previewUrl})\n\n_Last updated: ${timestamp}_`;

  console.log(
    `For project "${project}", PR #${prNumber} preview URL is: ${previewUrl}`
  );

  // Fetch existing comments and look for one with our prefix
  const comments = await fetchAllComments(owner, repo, prNumber, GITHUB_TOKEN);
  const existing = comments.find((c) => c.body.startsWith(commentPrefix));

  if (existing) {
    const updateRes = await fetch(existing.url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({ body: fullComment }),
    });
    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Failed to update comment: ${errText}`);
    }
    console.log('Updated existing preview comment');
  } else {
    const createRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({ body: fullComment }),
      }
    );
    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to post comment: ${errText}`);
    }
    console.log('Created new preview comment');
  }
}

main().catch((error) => {
  console.error('❌ An error occurred:', error.message || error);
  process.exit(1);
});
