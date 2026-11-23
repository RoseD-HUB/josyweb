/**
 * Josy Textile — Phase 0 Payload-First Security Rules Test Matrix
 * Verifies all "Dirty Dozen" adversarial payloads are rejected (PERMISSION_DENIED)
 * by the hardened Firestore security rules in firestore.rules.
 */

export interface AdversarialTestCase {
  id: number;
  name: string;
  pillar: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  actor: {
    uid: string | null;
    email?: string;
    emailVerified?: boolean;
  };
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_PAYLOADS: AdversarialTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Order Create',
    pillar: 'Pillar 2: Identity Integrity',
    operation: 'create',
    path: '/orders/JT-SPOOF-001',
    actor: { uid: 'attacker_uid', email: 'attacker@example.com', emailVerified: true },
    payload: { customerUid: 'victim_uid', customerName: 'Spoofed Buyer' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Privilege Escalation via Shadow Role Field',
    pillar: 'Pillar 2: Strict Keys & Anti-Self-Assign',
    operation: 'create',
    path: '/users/attacker_uid',
    actor: { uid: 'attacker_uid', email: 'attacker@example.com', emailVerified: true },
    payload: {
      uid: 'attacker_uid',
      displayName: 'Attacker',
      email: 'attacker@example.com',
      wishlistIds: [],
      isAdmin: true,
      role: 'admin',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Direct Admin Collection Escalation',
    pillar: 'Pillar 4: Tiered Identity Logic',
    operation: 'create',
    path: '/admins/attacker_uid',
    actor: { uid: 'attacker_uid', email: 'attacker@example.com', emailVerified: true },
    payload: { grantedBy: 'self' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'PII Blanket Get on Foreign Order',
    pillar: 'Pillar 6: PII Isolation',
    operation: 'get',
    path: '/orders/JT-2026-8412',
    actor: { uid: 'other_customer_uid', email: 'other@example.com', emailVerified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unscoped Order Collection Scraping',
    pillar: 'Pillar 8: Secure List Queries',
    operation: 'list',
    path: '/orders',
    actor: { uid: 'other_customer_uid', email: 'other@example.com', emailVerified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Unverified Admin Email Spoof on Product Write',
    pillar: 'Red Team: Email Spoofing Test',
    operation: 'create',
    path: '/products/jt-spoof-sku',
    actor: { uid: 'spoof_uid', email: 'diamondroseline4@gmail.com', emailVerified: false },
    payload: { id: 'jt-spoof-sku', name: 'Injected Garment' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Shadow Ghost Field on Measurement Profile Update',
    pillar: 'Pillar 2: Anti-Update-Gap',
    operation: 'update',
    path: '/users/customer_a/measurementProfiles/prof-1',
    actor: { uid: 'customer_a', email: 'a@example.com', emailVerified: true },
    payload: { name: 'Updated Suit Fit', verifiedByTailor: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Customer State Shortcutting on Bespoke Order Stage',
    pillar: 'Pillar 4: Action-Based Update Pattern',
    operation: 'update',
    path: '/orders/JT-2026-8412',
    actor: { uid: 'customer_a', email: 'a@example.com', emailVerified: true },
    payload: { bespokeStage: 'Delivered', balanceDueNGN: 0 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Value Poisoning on Whitelisted Order Field',
    pillar: 'Red Team: Value Poisoning Test',
    operation: 'update',
    path: '/orders/JT-2026-8412',
    actor: { uid: 'customer_a', email: 'a@example.com', emailVerified: true },
    payload: { whatsappOptIn: 'X'.repeat(2048) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Path Variable ID Poisoning',
    pillar: 'Pillar 3: Path Variable Hardening',
    operation: 'create',
    path: `/orders/${'A'.repeat(150)}!invalid`,
    actor: { uid: 'customer_a', email: 'a@example.com', emailVerified: true },
    payload: { customerUid: 'customer_a' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Client-Forged Timestamp Injection',
    pillar: 'Temporal Integrity',
    operation: 'create',
    path: '/orders/JT-TIME-999',
    actor: { uid: 'customer_a', email: 'a@example.com', emailVerified: true },
    payload: { customerUid: 'customer_a', createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Orphaned Measurement Profile Without Parent User',
    pillar: 'Pillar 1: Master Gate',
    operation: 'create',
    path: '/users/nonexistent_uid/measurementProfiles/orphan-1',
    actor: { uid: 'nonexistent_uid', email: 'ghost@example.com', emailVerified: true },
    payload: { id: 'orphan-1', ownerId: 'nonexistent_uid', name: 'Orphan Fit' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
