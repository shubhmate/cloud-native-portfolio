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
    const repos = config.GITHUB_REPOS || [];
    
    if (repos.length === 0) {
      console.log('No GITHUB_REPOS defined in config. Skipping fetch.');
      return;
    }

    let updated = false;

    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];
      const data = await fetchRepoData(username, repo);
      
      if (data) {
        // We only update TITLE, DESC, and LINK
        // keeping the custom problem/fix text untouched in the template
        
        // We use index + 1 for PROJECT_1, PROJECT_2...
        const prefix = `PROJECT_${i + 1}`;
        
        // Use repo name as title if no better title exists, but usually we just want to update desc and link.
        // Wait, the user might have custom titles like "3-Tier App with Docker Compose" instead of "3-tier-app-docker-compose".
        // Let's only update the link and description to keep the custom beautiful titles.
        // Or we can update the title if it's missing. Let's just update description and link.
        
        if (data.description) {
          config[`${prefix}_DESC`] = data.description;
        }
        config[`${prefix}_LINK`] = data.html_url;
        
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
