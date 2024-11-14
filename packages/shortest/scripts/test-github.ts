import { BrowserManager } from '../src/core/browser-manager';
import { BrowserTool } from '../src/browser-use/browser';
import { GitHubTool } from '../src/tools/github';
import { initialize } from '../src/index';
import pc from 'picocolors';

async function testGithubLogin() {
  const browserManager = new BrowserManager();

  try {
    await initialize();
    console.log(pc.cyan('\n🚀 Launching browser...'));
    const context = await browserManager.launch();
    const page = context.pages()[0];

    const browserTool = new BrowserTool(page, {
      width: 1920,
      height: 1080
    });

    const githubTool = new GitHubTool();

    // Navigate to app
    console.log(pc.cyan('\n🌐 Navigating to app...'));
    await page.goto('http://localhost:3000');

    // Click Sign in button
    console.log(pc.cyan('\n🔑 Clicking Sign in...'));
    await page.click('button:has-text("Sign in")');
    
    // Click GitHub button
    console.log(pc.cyan('\n🔑 Clicking GitHub login...'));
    await page.click('.cl-socialButtonsBlockButton__github');

    // Now handle GitHub login
    console.log(pc.cyan('\n🔐 Starting GitHub login flow...'));
    await githubTool.GithubLogin(browserTool, {
      username: process.env.GITHUB_USERNAME || '',
      password: process.env.GITHUB_PASSWORD || ''
    });

    console.log(pc.green('\n✅ Login Test Complete'));

  } catch (error) {
    console.error(pc.red('\n❌ Test failed:'), error);
  } finally {
    console.log(pc.cyan('\n🧹 Cleaning up...'));
    await browserManager.close();
  }
}

console.log(pc.cyan('🧪 Login Integration Test'));
console.log(pc.cyan('======================='));
testGithubLogin().catch(console.error); 