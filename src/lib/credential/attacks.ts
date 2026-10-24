export interface Attack {
  id: 'edit-visual' | 'edit-token' | 'forge-signature';
  title: string;
  changed: string;
}

export async function runAttack(
  _id: Attack['id'],
  _pdf: Uint8Array,
): Promise<{ pdf: Uint8Array; attack: Attack }> {
  throw new Error('not implemented: A2-S5');
}
