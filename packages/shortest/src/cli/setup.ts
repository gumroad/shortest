import { execSync } from 'child_process';
import pc from 'picocolors';

async function setup() {
  console.log(pc.cyan('Setting up shortest...'));
  
  try {
    // Check if peer dependencies are installed
    const peers = [
      'playwright',
      '@anthropic-ai/sdk',
      'dotenv',
      'expect',
      'esbuild'
    ];

    // Check if all peers are already installed
    const missingPeers = peers.filter(pkg => {
      try {
        require.resolve(pkg);
        return false;
      } catch {
        return true;
      }
    });

    if (missingPeers.length === 0) {
      console.log(pc.green('✓ All dependencies already installed'));
      return;
    }

    // Detect package manager
    const pkgManager = process.env.npm_config_user_agent?.startsWith('pnpm') ? 'pnpm' : 'npm';

    for (const pkg of missingPeers) {
      console.log(pc.yellow(`Installing ${pkg}...`));
      execSync(`${pkgManager} add ${pkg}`, { stdio: 'inherit' });
    }

    // Install playwright browsers
    console.log(pc.yellow('Installing Playwright browsers...'));
    execSync(`${pkgManager} exec playwright install`, { stdio: 'inherit' });

    console.log(pc.green('✓ Setup complete!'));
    console.log(pc.cyan('\nMake sure to set your ANTHROPIC_API_KEY in .env'));
    
  } catch (error) {
    console.error(pc.red('Setup failed:'), error);
    process.exit(1);
  }
}

setup(); 