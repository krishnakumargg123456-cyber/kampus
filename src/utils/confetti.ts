import confetti from 'canvas-confetti';

/**
 * Triggers a milestone celebratory confetti burst.
 * Uses the KAMPUS primary palette: Blue, Amber/Flame Orange, Emerald, and Gold.
 */
export const triggerMilestoneConfetti = () => {
  // Center burst
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.65 },
    colors: ['#F97316', '#F59E0B', '#2563EB', '#10B981', '#FFD700', '#EC4899'],
    disableForReducedMotion: true,
  });

  // Left cannon shot
  setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.7 },
      colors: ['#F97316', '#F59E0B', '#2563EB', '#FFD700'],
      disableForReducedMotion: true,
    });
  }, 180);

  // Right cannon shot
  setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.7 },
      colors: ['#F97316', '#F59E0B', '#2563EB', '#FFD700'],
      disableForReducedMotion: true,
    });
  }, 350);
};

/**
 * Quick subtle burst for small micro-interactions (e.g. clicking the streak pill)
 */
export const triggerMicroStreakConfetti = (event?: React.MouseEvent) => {
  let origin = { y: 0.6, x: 0.5 };
  if (event) {
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;
    origin = { x, y };
  }

  confetti({
    particleCount: 35,
    spread: 45,
    origin,
    colors: ['#F97316', '#F59E0B', '#FFD700'],
    scalar: 0.8,
    disableForReducedMotion: true,
  });
};
