import { describe, expect, it } from 'vitest';
import { calculatePriority } from '../src/services/priority.service.js';
describe('incident priority',()=>{
  it('ranks a critical, high-impact fire above a low-impact incident',()=>{
    const critical=calculatePriority({severity:'Critical',peopleAffected:20,category:'Fire Emergency',createdAt:new Date(Date.now()-3600000)});
    const low=calculatePriority({severity:'Low',peopleAffected:0,category:'Other Emergencies',createdAt:new Date()});
    expect(critical.score).toBeGreaterThan(low.score); expect(critical.label).toBe('Critical');
  });
  it('increases urgency as an unassigned incident waits',()=>{
    const old=calculatePriority({severity:'Medium',peopleAffected:1,category:'Road Accident',createdAt:new Date(Date.now()-24*3600000)});
    const fresh=calculatePriority({severity:'Medium',peopleAffected:1,category:'Road Accident',createdAt:new Date()});
    expect(old.score).toBeGreaterThan(fresh.score);
  });
});
