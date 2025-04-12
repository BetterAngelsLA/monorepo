import fs from 'fs';
import fetch from 'node-fetch';

// A simple argument parser to get the value for '--url'
const getArgValue = (argName) => {
  const index = process.argv.indexOf(argName);
  return index !== -1 ? process.argv[index + 1] : null;
};

const previewUrlFromArg = getArgValue('--url');

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_EVENT_PATH } = process.env;

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !GITHUB_EVENT_PATH) {
  console.error('❌ Missing required environment variables.');
  process.exit(1);
}

if (!previewUrlFromArg) {
  console.error('❌ Preview URL must be passed as an argument using --url.');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));
const prNumber = event.pull_request?.number;

if (!prNumber) {
  console.error('❌ Not a pull_request event or missing PR number.');
  process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split('/');

const commentBody = {
  body: `🔍 Preview available at: [${previewUrlFromArg}](${previewUrlFromArg})`,
};

const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;

fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(commentBody),
})
  .then((res) => {
    if (!res.ok) {
      return res.text().then((err) => {
        throw new Error(err);
      });
    }
    return res.json();
  })
  .then((json) => {
    console.log('✅ Comment posted:', json.html_url);
  })
  .catch((err) => {
    console.error('❌ Failed to post comment:', err.message);
    process.exit(1);
  });
