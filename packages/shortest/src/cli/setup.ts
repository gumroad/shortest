import { execSync } from 'child_process';
import pc from 'picocolors';
import { platform } from 'os';
import type { ExecSyncOptions } from 'child_process';

type PackageManager = 'npm' | 'pnpm' | 'yarn';

const execOptions: ExecSyncOptions = {
  stdio: 'inherit',
  shell: '/bin/bash'
};

const windowsExecOptions: ExecSyncOptions = {
  stdio: 'inherit',
  shell: 'cmd.exe'
};

async function setup() {
  const isWindows = platform() === 'win32';
  const options = isWindows ? windowsExecOptions : execOptions;
  
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

    // Detect package manager
    const userAgent = process.env.npm_config_user_agent || '';
    let pkgManager: PackageManager = 'npm';
    
    if (userAgent.startsWith('pnpm')) {
      pkgManager = 'pnpm';
    } else if (userAgent.startsWith('yarn')) {
      pkgManager = 'yarn';
    }

    // Install command varies by package manager and platform
    const installCommands: Record<PackageManager, string> = {
      npm: 'install',
      pnpm: 'add',
      yarn: 'add'
    };

    // Playwright install commands with Windows support
    const pwInstallCommands: Record<PackageManager, string> = {
      npm: isWindows ? 'npx.cmd playwright install chromium' : 'npx playwright install chromium',
      pnpm: isWindows ? 'pnpm.cmd exec playwright install chromium' : 'pnpm exec playwright install chromium',
      yarn: isWindows ? 'yarn.cmd playwright install chromium' : 'yarn playwright install chromium'
    };

    const installCmd = installCommands[pkgManager];
    const pwInstallCmd = pwInstallCommands[pkgManager];

    if (missingPeers.length > 0) {
      for (const pkg of missingPeers) {
        console.log(pc.yellow(`Installing ${pkg}...`));
        try {
          execSync(`${pkgManager}${isWindows ? '.cmd' : ''} ${installCmd} ${pkg}`, options);
        } catch (err) {
          console.warn(pc.yellow(`Warning: Failed to install ${pkg}: ${err}`));
          // Continue with other installations
        }
      }
    } else {
      console.log(pc.green('✓ All dependencies already installed'));
    }

    // Install Playwright browsers with verification
    console.log(pc.yellow('Installing Playwright browsers...'));
    try {
      // First try to verify if browser is already installed
      try {
        const { chromium } = require('playwright');
        const browser = await chromium.launch();
        await browser.close();
        console.log(pc.green('✓ Playwright browsers already installed'));
      } catch {
        // Browser not installed or failed to launch, install it
        execSync(pwInstallCmd, options);
        
        // Verify installation
        const { chromium } = require('playwright');
        const browser = await chromium.launch();
        await browser.close();
      }
    } catch (err) {
      console.warn(pc.yellow('\nWarning: Playwright browser installation failed'));
      console.log(pc.cyan(`Please run manually: ${pwInstallCmd}\n`));
    }
    
    console.log(pc.green('✓ Setup complete!'));
    console.log(pc.cyan('\nMake sure to set your ANTHROPIC_API_KEY in .env'));

  } catch (error) {
    // Log error but don't exit with error code
    console.error(pc.red('\nSetup Warning:'), error instanceof Error ? error.message : String(error));
    // Exit with 0 to not break npm install
    process.exit(0);
  }
}

// Only run setup if this is npm/pnpm install
if (process.env.npm_lifecycle_event === 'postinstall') {
  setup();
}

// Export for direct execution
export { setup }; 