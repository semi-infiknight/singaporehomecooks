import { describe, expect, it } from 'vitest';
import {
  computeMorphingLabelSegments,
  morphingLabelFinalText,
  morphingLabelInitialText,
  morphingLabelTarget,
  wizardCtaMorphOnStepEnter,
} from './family-values-core';

/** Visible label text contract (mirrors SHCMorphingLabel / SHCMorphingLabelWeb render). */
describe('morph label visible text render contract', () => {
  it('step1 shows Start then morphs to Continue', () => {
    const { from, to } = wizardCtaMorphOnStepEnter(1, 4, false);
    expect(morphingLabelInitialText(from, to)).toBe('Start');
    expect(morphingLabelFinalText(from, to)).toBe('Continue');
    const segs = computeMorphingLabelSegments(from, to);
    expect(morphingLabelTarget(segs)).toBe('Continue');
    expect(segs.find((s) => s.kind === 'out')?.text).toBe('Start');
    expect(segs.find((s) => s.kind === 'in')?.text).toBe('Continue');
  });

  it('publish step shows Review morphing to Publish', () => {
    const { from, to } = wizardCtaMorphOnStepEnter(4, 4, false);
    expect(morphingLabelInitialText(from, to)).toBe('Review');
    expect(morphingLabelFinalText(from, to)).toBe('Publish');
  });

  it('editing final step morphs to Save changes', () => {
    const { from, to } = wizardCtaMorphOnStepEnter(4, 4, true);
    expect(morphingLabelFinalText(from, to)).toBe('Save changes');
  });
});