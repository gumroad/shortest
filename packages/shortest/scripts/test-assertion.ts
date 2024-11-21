import { UITestBuilder, expect } from '../src/index';
import pc from 'picocolors';

async function testAssertions() {
  console.log(pc.cyan('\n🧪 Testing Assertion Implementation'));
  console.log(pc.cyan('================================'));

  let failedTests = 0;
  let passedTests = 0;

  try {
    // Test 1: Verify failing assertions are caught
    console.log(pc.cyan('\nTest 1: Verify failing assertions'));
    try {
      const builder = new UITestBuilder('/')
        .test('Test failing assertion')
        .given('test data', undefined, async () => {
          expect(true).toBe(false);
        });
      
      console.log(pc.red('❌ Failed: Assertion should have thrown error'));
      failedTests++;
    } catch (error) {
      console.log(pc.green('✅ Passed: Caught failing assertion'));
      passedTests++;
    }

    // Test 2: Verify async assertions
    console.log(pc.cyan('\nTest 2: Verify async assertions'));
    try {
      const builder = new UITestBuilder('/')
        .test('Test async assertion')
        .given('test data', undefined, async () => {
          const result = await Promise.resolve(false);
          expect(result).toBe(true);
        });
      
      console.log(pc.red('❌ Failed: Async assertion should have thrown'));
      failedTests++;
    } catch (error) {
      console.log(pc.green('✅ Passed: Caught async failing assertion'));
      passedTests++;
    }

    // Test 3: Verify assertion steps are recorded
    console.log(pc.cyan('\nTest 3: Verify assertion recording'));
    const builder = new UITestBuilder('/')
      .test('Test step recording')
      .given('test data', undefined, async () => {
        expect(true).toBe(true);
      });
    
    if (builder.steps.length === 1 && builder.steps[0].assert) {
      console.log(pc.green('✅ Passed: Assertion step recorded'));
      passedTests++;
    } else {
      console.log(pc.red('❌ Failed: Assertion step not recorded'));
      failedTests++;
    }

    // Summary
    console.log(pc.cyan('\n📊 Test Summary'));
    console.log(pc.cyan('============='));
    console.log(pc.green(`Passed: ${passedTests}`));
    console.log(pc.red(`Failed: ${failedTests}`));

  } catch (error) {
    console.error(pc.red('\n❌ Test script failed:'), error);
  }
}

testAssertions().catch(console.error);
