# Feature Expansion: Shop Owner Management & Premium Listings

## Goal

Implement functionality that allows boba shop owners to:

1. Create accounts and log in
2. Claim or manage their shop listing
3. Edit shop details
4. Purchase a featured (premium) listing

Backend: Supabase (PostgreSQL + Auth)
Frontend: Next.js on Vercel
Payment: Stripe

---

## 1. Supabase Schema Changes

### Modify `shops` table:

```sql
ALTER TABLE shops ADD COLUMN owner_id uuid REFERENCES auth.users(id);
ALTER TABLE shops ADD COLUMN featuredUntil date;
```

---

## 2. Pages and Components Needed

### `/login` and `/signup`

* Auth pages using Supabase Auth UI or custom form
* Redirect to `/dashboard` on success

### `/dashboard`

* Shows listings owned by the user
* "Edit" button for each listing
* "Upgrade to Featured" button

### `/dashboard/edit/[shopId]`

* Shop edit form (name, address, phone, website, etc.)
* Requires auth and ownership check
* Submit updates via Supabase client

### `/dashboard/claim`

* Form to let logged-in users search for and request ownership of a shop
* Optional: request creates a row in `shop_claim_requests` table

### `/api/stripe/create-checkout-session`

* Backend route to create a Stripe Checkout session
* Requires `shopId` and user auth
* Pass `shopId` as metadata in Stripe session

### `/api/stripe/webhook`

* Stripe webhook endpoint to listen for `checkout.session.completed`
* Use metadata.shopId to update Supabase:

```ts
await supabase.from('shops').update({
  isPremium: true,
  featuredUntil: new Date(Date.now() + 30 * 86400000)
}).eq('id', shopId);
```

---

## 3. Stripe Setup

* Create one-time product in Stripe: "Featured Listing - 30 Days"
* Use `stripe.checkout.sessions.create` with product ID
* Enable webhook with `checkout.session.completed` event

---

## 4. City Page Updates (e.g. `/city/[city]`)

* Query Supabase: `select * from shops where city = $city`
* Order results by `isPremium desc, name asc`
* Add "Featured" badge if `isPremium` is true

---

## 5. Optional Admin Panel

* Allow admins to:

  * View and approve pending claim requests
  * View all listings and owners

---

## Summary of Routes to Implement

| Route                                 | Purpose                            |
| ------------------------------------- | ---------------------------------- |
| `/signup`, `/login`                   | Auth pages                         |
| `/dashboard`                          | Owner's shop list + premium status |
| `/dashboard/edit/[shopId]`            | Edit listing                       |
| `/dashboard/claim`                    | Claim shop form                    |
| `/api/stripe/create-checkout-session` | Start payment flow                 |
| `/api/stripe/webhook`                 | Handle successful payments         |
| `/city/[city]`                        | List shops, prioritize featured    |

---

This document should be passed to Claude Sonnet 3.7 in Cline to guide the integration of shop management, editing, and premium upgrade features into the Next.js + Supabase stack.
