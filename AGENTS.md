<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Catalog (products/categories) lives in the database and is read through the `getCatalog` server function + `catalogQuery`; never reintroduce hardcoded product arrays. Why: admins edit products in the DB.
- Demo products set `is_demo = true` and use `asset:<key>` image URLs resolved by `resolveImage`. Why: bundled photos for dev data.
- Orders are created and marked paid only by server code (service role) after verified payment confirmation; customers have read-only access to orders. Why: prevent fake "paid" orders.
- Admin access is checked with `has_role(uid,'admin')` in RLS/server code; the client `isAdmin` flag is only for showing UI.
