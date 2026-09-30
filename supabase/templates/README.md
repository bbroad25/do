# Auth email templates

Paste into Supabase: Authentication -> Emails -> Templates.

| Template       | File                 | Subject                              |
|----------------|----------------------|--------------------------------------|
| Confirm signup | confirm-signup.html  | Welcome to DO — confirm your email   |
| Magic link     | magic-link.html      | Your DO sign-in link                 |

Sender (Authentication -> Emails -> SMTP settings, via Resend):
host `smtp.resend.com`, port `465`, username `resend`, password = Resend API key,
sender name `DO`, sender email `onboarding@resend.dev` until DO has its own domain
(then `hello@<domain>` after verifying the domain in Resend).
