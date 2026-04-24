const fs = require('fs');
const path = require('path');
const https = require('https');

const configPath = path.join(__dirname, 'config.json');

function fetchRepoData(username, repo) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${username}/${repo}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js/fetch-projects-script'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          resolve(null); // Return null on error (e.g. 404 or rate limit)
        }
      });
    });

    req.on('error', (e) => resolve(null));
    req.end();
  });
}

async function main() {
  console.log('Fetching project data from GitHub...');

  try {
    const configRaw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configRaw);

    const githubHandleUrl = config.GITHUB_HANDLE;
    const usernameMatch = githubHandleUrl.match(/github\.com\/([^/]+)/);

    if (!usernameMatch) {
      console.log('Could not extract GitHub username from config.GITHUB_HANDLE. Skipping fetch.');
      return;
    }

    const username = usernameMatch[1];
    const projects = config.PROJECTS || [];

    if (projects.length === 0) {
      console.log('No PROJECTS defined in config. Skipping fetch.');
      return;
    }

    let updated = false;

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      if (!project.github_repo) continue;

      const repo = project.github_repo;
      const data = await fetchRepoData(username, repo);

      if (data) {
        // Update description and link while keeping other fields intact
        if (data.description) {
          project.description = data.description;
        }
        project.link = data.html_url;

        // Auto-generate a readable title from the repo name if available
        if (data.name) {
          // Replace hyphens and underscores with spaces, and capitalize words
          project.title = data.name
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }

        // Fetch topics to use as tags if available, otherwise use primary language
        if (data.topics && data.topics.length > 0) {
          project.tags = data.topics;
        } else if (data.language) {
          project.tags = [data.language];
        } else {
          // Only clear tags if we successfully fetched data but found no metadata
          project.tags = [];
        }

        console.log(`✔ Fetched data for ${repo}`);
        updated = true;
      } else {
        console.log(`✖ Failed to fetch data for ${repo} (Rate limited or not found)`);
      }
    }

    if (updated) {
      // Formatting JSON with 2 spaces to preserve readability
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      console.log('config.json updated successfully with latest GitHub data.');
    }

  } catch (error) {
    console.error('Error fetching projects:', error);
  }
}

main();
