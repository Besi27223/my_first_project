-- RLS policies restrict access that's already granted — they don't grant it
-- themselves. The earlier migrations enabled RLS and created policies for
-- every table, but never issued the underlying GRANTs, so every direct
-- table query from the app (using the anon key + a user's JWT, mapped to
-- the "authenticated" role) fails with 42501 "permission denied for table
-- ...", regardless of what the RLS policy would have allowed. (RPC calls
-- through the security definer functions in 20260101000005 were unaffected
-- since those run as the function owner, not as "authenticated".)

grant usage on schema public to authenticated;

grant select on households to authenticated;

grant select, insert, update on profiles to authenticated;

grant select, insert, update, delete on expense_categories to authenticated;

grant select, insert, update, delete on expenses to authenticated;

grant select, insert, update, delete on expense_archive to authenticated;

grant select, insert, update, delete on monthly_income to authenticated;
