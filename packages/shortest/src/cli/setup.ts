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
      npm: isWindows ? 'npx.cmd playwright install' : 'npx playwright install',
      pnpm: isWindows ? 'pnpm.cmd exec playwright install' : 'pnpm exec playwright install',
      yarn: isWindows ? 'yarn.cmd playwright install' : 'yarn playwright install'
    };

    const installCmd = installCommands[pkgManager];
    const pwInstallCmd = pwInstallCommands[pkgManager];

    if (missingPeers.length > 0) {
      for (const pkg of missingPeers) {
        console.log(pc.yellow(`Installing ${pkg}...`));
        try {
          execSync(`${pkgManager}${isWindows ? '.cmd' : ''} ${installCmd} ${pkg}`, options);
        } catch (err) {
          throw new Error(`Failed to install ${pkg}: ${err}`);
        }
      }
    } else {
      console.log(pc.green('✓ All dependencies already installed'));
    }

    // Install Playwright browsers
    console.log(pc.yellow('Installing Playwright browsers...'));
    try {
      execSync(pwInstallCmd, options);
    } catch (err) {
      throw new Error(`Failed to install Playwright browsers: ${err}`);
    }
    
    console.log(pc.green('✓ Setup complete!'));
    console.log(pc.cyan('\nMake sure to set your ANTHROPIC_API_KEY in .env'));

  } catch (error) {
    console.error(pc.red('Setup failed:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

setup(); 