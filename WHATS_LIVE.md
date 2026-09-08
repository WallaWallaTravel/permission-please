# What's live

Production: **https://permissionplease.app**

Local: **http://localhost:6001** (`npm run dev`)

## Sign-in

Invite-only. There is no public signup and no password.

| Who                                 | How                                          |
| ----------------------------------- | -------------------------------------------- |
| Staff (teacher, admin, super-admin) | Google, after an invite                      |
| Parents                             | Email sign link (`/s/[token]`) or magic link |

## Working now

- Set up a school (license date + first admin invite)
- Teacher form builder, distribute, reminders, trip roster
- Parent sign from the email link without creating an account
- Printable DPA template, privacy policy, deletion request form
- Audit logs (not a FERPA certification)

## Seed data

`npm run db:seed` creates sample users, students, and forms. Those users have **no passwords**. Do not run seed against production.
