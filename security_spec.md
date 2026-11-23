# Josy Textile — Security Specification & Payload-First TDD (Phase 0)

## 1. Data Invariants
1. **Catalog Integrity**: Only verified Josy Textile admins (`diamondroseline4@gmail.com` or records in `/admins/{uid}`) may create, update, or delete `/products/{productId}` or `/settings/{settingId}`. Public storefront browsing is strictly read-only.
2. **PII Isolation**: `/users/{userId}`, `/users/{userId}/measurementProfiles/{profileId}`, `/orders/{orderId}`, `/newsletterSubscribers/{subscriberId}`, and `/contactInquiries/{inquiryId}` contain PII and body metrics. No non-owner authenticated user may `get` or `list` another user's records.
3. **Master Gate on Measurement Profiles**: A measurement profile at `/users/{userId}/measurementProfiles/{profileId}` cannot be created or modified unless the parent `/users/{userId}` document exists, `ownerId == userId`, and the caller is `userId` (verified) or an admin.
4. **No Self-Assigned Roles**: `/users/{userId}` forbids any `role` or `isAdmin` shadow fields. `/admins/{adminUid}` denies all client writes unconditionally.
5. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must strictly equal `request.time`; `createdAt` and ownership fields (`uid`, `ownerId`, `customerUid`) are immutable after creation.
6. **Action-Based Order Updates & Terminal Locking**: Regular customers can only update their own order for (a) settling the 40% balance when `bespokeStage == 'Finishing & Quality Check'` and `balanceSettled == false`, or (b) toggling `whatsappOptIn` prior to delivery. Once an order is fully `Delivered` and `balanceSettled == true`, non-admin updates are locked.
7. **Cost-Safe List Queries**: Zero `get()` or `exists()` lookups appear inside any `allow list` block.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing (Order)**: Customer A creates `/orders/JT-SPOOF-1` with `customerUid: "victim_uid"`. -> Expected: `PERMISSION_DENIED`.
2. **Privilege Escalation (User Profile)**: Customer A writes `/users/custA` including ghost field `isAdmin: true` or `role: "admin"`. -> Expected: `PERMISSION_DENIED`.
3. **Admin Collection Tampering**: Customer A writes `/admins/custA`. -> Expected: `PERMISSION_DENIED`.
4. **PII Blanket Read (Order)**: Customer B attempts `get` on `/orders/JT-2026-8412` belonging to Customer A. -> Expected: `PERMISSION_DENIED`.
5. **Unscoped List Scraping (Orders)**: Customer B attempts `list` on `/orders` without `where('customerUid', '==', auth.uid)`. -> Expected: `PERMISSION_DENIED`.
6. **Email Spoofing Attack**: Attacker with `email: "diamondroseline4@gmail.com"` and `email_verified: false` attempts to write `/products/fake-sku`. -> Expected: `PERMISSION_DENIED`.
7. **Shadow Field Injection (Measurement Profile)**: Customer A updates measurement profile injecting ghost field `verifiedByTailor: true`. -> Expected: `PERMISSION_DENIED`.
8. **State Shortcutting (Order Pipeline)**: Customer A updates their own order to set `bespokeStage: "Delivered"` or `amountPaidNGN: 999999`. -> Expected: `PERMISSION_DENIED`.
9. **Value Poisoning (Order Update)**: Customer A updates whitelisted field `whatsappOptIn` with a 500KB string instead of a boolean. -> Expected: `PERMISSION_DENIED`.
10. **ID Poisoning (Resource Exhaustion)**: Attacker creates `/orders/<200-char-invalid-id!@#$>`. -> Expected: `PERMISSION_DENIED`.
11. **Backdated Timestamp Tampering**: Customer A creates `/orders/JT-TIME-1` with a client-forged `createdAt` timestamp != `request.time`. -> Expected: `PERMISSION_DENIED`.
12. **Orphaned Subcollection Write**: Attacker creates `/users/ghostUser/measurementProfiles/p1` without an existing parent `/users/ghostUser` document. -> Expected: `PERMISSION_DENIED`.
