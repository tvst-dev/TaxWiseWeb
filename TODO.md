# TaxWise Subscription Management Implementation

## Database Updates
- [x] Create new migration for api_subscriptions table updates
- [x] Create payment_transactions table
- [x] Update Supabase types

## Paystack Integration Updates
- [x] Update handlePaymentSuccess in paystack.ts for new subscription fields
- [x] Add payment_transactions table insert
- [x] Update tier mapping and amounts

## Authentication & Sign-up Flow
- [x] Remove free tier option from AuthPage.tsx
- [x] Force payment during sign-up
- [x] Set initial subscription status as 'pending'

## Access Control
- [ ] Add subscription checks to App.tsx (protected routes)
- [ ] Add subscription checks to Dashboard.tsx
- [ ] Implement legacy user bypass logic

## Pricing Page Updates
- [x] Update pricing amounts (Individual: ₦1,499.90, Small Business: ₦24,999.90, Large Corp: ₦49,999.90)
- [x] Remove free tier options
- [x] Update tier values to match new schema

## Subscription Management Page
- [ ] Create new SubscriptionPage.tsx
- [ ] Display current plan, status, billing period
- [ ] Show payment history
- [ ] Add upgrade/downgrade options

## Paystack Webhook Handler
- [ ] Create supabase function for webhook handling
- [ ] Handle successful payments, cancellations, failures
- [ ] Update subscription status accordingly

## API Rate Limiting
- [ ] Update rate limits based on new tiers
- [ ] Implement legacy user logic

## Testing
- [ ] Test legacy user access (no payment required)
- [ ] Test new user payment flow
- [ ] Test subscription status blocking
- [ ] Test webhook updates
- [ ] Test API rate limiting
