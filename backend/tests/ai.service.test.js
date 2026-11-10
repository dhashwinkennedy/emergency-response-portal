import { describe, expect, it } from 'vitest';
import { extractAssessmentJson } from '../src/services/ai.service.js';

describe('AI response parser', () => {
  it('extracts JSON from a fenced response with surrounding prose', () => {
    expect(extractAssessmentJson('Assessment follows:\n```json\n{"informationConsistencyScore":72,"findings":["Details align"]}\n```\nReview manually.')).toEqual({ informationConsistencyScore: 72, findings: ['Details align'] });
  });
  it('does not break when a JSON string contains braces', () => {
    expect(extractAssessmentJson('{"findings":["Use {care} when verifying"]}')).toEqual({ findings: ['Use {care} when verifying'] });
  });
});
