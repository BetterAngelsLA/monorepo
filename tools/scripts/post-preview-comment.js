import fs from 'fs';
import fetch from 'node-fetch';

// Helper: Fetch all comments with pagination
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
      // Parse "next" link from Link header, if present
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

function getEventPayload(path) {
  if (!fs.existsSync(path)) {
    throw new Error(`Event file not found at ${path}`);
  }
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

async function main() {
  // Validate required environment variables
  const requiredVars = [
    'GITHUB_TOKEN',
    'GITHUB_REPOSITORY',
    'GITHUB_EVENT_PATH',
  ];
  const missingVars = requiredVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required env vars: ${missingVars.join(', ')}`);
  }
  const {
    GITHUB_TOKEN,
    GITHUB_REPOSITORY,
    GITHUB_EVENT_PATH,
    NX_TASK_TARGET_PROJECT,
  } = process.env;

  // Get the event payload safely
  const event = getEventPayload(GITHUB_EVENT_PATH);
  const prNumber = event.pull_request?.number;
  if (!prNumber) {
    throw new Error('Not a pull_request event.');
  }
  const [owner, repo] = GITHUB_REPOSITORY.split('/');

  // Process the CLI argument for --url
  const urlArg = process.argv.find((arg) => arg.startsWith('--url='));
  if (!urlArg) {
    throw new Error('Missing --url argument');
  }
  const previewUrl = urlArg.split('=')[1].trim();
  const project = NX_TASK_TARGET_PROJECT || 'default';

  // Construct the comment content (with timestamp)
  const commentPrefix = `🔍 [${project}] Preview available at:`;
  const timestamp = new Date().toISOString();
  const fullComment = `${commentPrefix} [${previewUrl}](${previewUrl})\n\n_Last updated: ${timestamp}_`;

  console.log(
    `For project "${project}", PR #${prNumber} preview URL is: ${previewUrl}`
  );

  // Fetch existing comments (handling pagination)
  const comments = await fetchAllComments(owner, repo, prNumber, GITHUB_TOKEN);
  const existing = comments.find((c) => c.body.startsWith(commentPrefix));

  if (existing) {
    // Update the existing comment
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
    // Post a new comment
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
  console.error('An error occurred:', error.message || error);
  process.exit(1);
});
