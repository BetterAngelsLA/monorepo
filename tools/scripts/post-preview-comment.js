import fs from 'fs';
import fetch from 'node-fetch';

// Collect required env vars
const REQUIRED_ENV_VARS = [
  'GITHUB_TOKEN',
  'GITHUB_REPOSITORY',
  'GITHUB_EVENT_PATH',
];
const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missing.join(', ')}`
  );
  process.exit(1);
}

// Destructure after validation
const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_EVENT_PATH } = process.env;

const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));
const prNumber = event.pull_request?.number;
if (!prNumber) {
  console.error('❌ Not a pull_request event.');
  process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split('/');
const urlArg = process.argv.find((arg) => arg.startsWith('--url='));
if (!urlArg) {
  console.error('❌ Missing --url argument');
  process.exit(1);
}
const previewUrl = urlArg.split('=')[1];
const commentPrefix = `🔍 Preview available at:`;
const fullComment = `${commentPrefix} [${previewUrl}](${previewUrl})`;

// Step 1: Get all comments with pagination
let comments = [];
let page = 1;
let hasMorePages = true;

while (hasMorePages) {
  const commentsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments?page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (!commentsRes.ok) {
    const err = await commentsRes.text();
    throw new Error(`Failed to fetch comments (page ${page}): ${err}`);
  }

  const pageComments = await commentsRes.json();
  comments = comments.concat(pageComments);

  if (pageComments.length < 30) {
    hasMorePages = false;
  } else {
    page += 1;
  }
}

const existing = comments.find((c) => c.body.startsWith(commentPrefix));

if (existing) {
  // Step 2: Update the existing comment
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
    const err = await updateRes.text();
    throw new Error(`Failed to update comment: ${err}`);
  }

  console.log('✅ Updated existing preview comment');
} else {
  // Step 3: Post a new comment
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
    const err = await createRes.text();
    throw new Error(`Failed to post comment: ${err}`);
  }

  console.log('✅ Created new preview comment');
}
