/** Note frequencies (Hz) and the looping chiptune pattern for PixRecall. */

// prettier-ignore
const N = {
  C3: 130.81, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

export const STEP_SECONDS = 0.16; // ~ snappy 16th-ish arcade pulse

// 16-step loop (≈2.56s). 0 = rest.
// Chord bars: C  -  G  -  Am -  F
export const LEAD: number[] = [
  N.E5, N.G5, N.E5, N.C5,
  N.D5, N.G4, N.B4, N.D5,
  N.C5, N.E5, N.A4, N.C5,
  N.A4, N.C5, N.F4, N.A4,
];

export const BASS: number[] = [
  N.C3, 0, N.G3, 0,
  N.G3, 0, N.D4, 0,
  N.A3, 0, N.E4, 0,
  N.F3, 0, N.C4, 0,
];

export const STEPS = LEAD.length;
