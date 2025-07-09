import { NextResponse } from "next/server";
import { OnboardingGuardrails } from "@/src/lib/agents/guardrails/onboarding-guardrails";

export async function GET() {
  try {
    // Create guardrails instance
    const guardrails = OnboardingGuardrails.createGuardrails();
    const professionalismGuardrail = guardrails.find(g => g.name === 'Professionalism');
    
    if (!professionalismGuardrail) {
      throw new Error('Professionalism guardrail not found');
    }
    
    // Test cases
    const testCases = [
      "I HATE THIS STUPID SYSTEM",
      "THIS IS ALL CAPS",
      "i hate this stupid system",
      "This is normal text",
      "HELLO WORLD THIS SHOULD FAIL THE CAPS CHECK"
    ];
    
    const results = await Promise.all(testCases.map(async (input) => {
      const result = await professionalismGuardrail.validate(input, {} as any);
      const capsCount = (input.match(/[A-Z]/g) || []).length;
      const capsRatio = capsCount / input.length;
      
      return {
        input,
        passed: result.passed,
        reason: result.reason,
        metadata: result.metadata,
        analysis: {
          totalChars: input.length,
          capsCount,
          capsRatio,
          capsPercentage: (capsRatio * 100).toFixed(1) + '%',
          shouldFail: capsRatio > 0.5 && input.length > 10
        }
      };
    }));
    
    return NextResponse.json({
      success: true,
      testResults: results,
      summary: {
        total: results.length,
        failed: results.filter(r => !r.passed).length,
        passed: results.filter(r => r.passed).length
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}