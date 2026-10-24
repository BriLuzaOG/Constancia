// placeholder: A2-S2 sets the real coordinates
// PDF points, A4 landscape (842 x 595), origin bottom-left.
export const CERT_LAYOUT: Record<
  'name' | 'program' | 'honors' | 'date' | 'qr',
  { x: number; y: number; w: number; h: number }
> = {
  name: { x: 80, y: 300, w: 560, h: 40 },
  program: { x: 80, y: 240, w: 560, h: 24 },
  honors: { x: 80, y: 205, w: 560, h: 20 },
  date: { x: 80, y: 150, w: 300, h: 20 },
  qr: { x: 690, y: 60, w: 100, h: 100 },
};
