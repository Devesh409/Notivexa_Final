const { execSync } = require('child_process');
try {
  execSync('kill $(lsof -t -i:3000)', { stdio: 'ignore' });
} catch (e) {}
