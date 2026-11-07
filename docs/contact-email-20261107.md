# Public contact email — 7 November 2026

Changed the public Sawdagar contact address from `onlinesawdagar@gmail.com` to
`info@sawdagar.com`.

- Updated the saved CMS header email and Contact-page email line. The footer
  already contained the requested address. Other saved content is unchanged.
- Updated shared, website, admin and backend defaults so resetting content also
  uses the requested address.
- Corrected the optional legacy-content localization helper, which previously
  replaced the domain email with Gmail. It now replaces only known legacy
  addresses and preserves custom admin emails and additional contact lines.
- Public rendering continues to use the admin-managed content, including the
  header/footer `mailto:` links. No mail credentials or customer accounts changed.

Verified matching addresses in all four default sources, backend syntax and
preservation of custom emails and unrelated contact-card lines during localization.

## Restore points

- Source branch: `backup/before-contact-email-20261107`.
- Private VPS backup of the original saved CMS record:
  `/var/www/backups/sawdagar-contact-email-20261107/`.

The CMS update used a comparison against the original stored value, so concurrent
admin edits would prevent the write instead of being overwritten. For a later
rollback, restore only the affected email fields to preserve newer CMS changes.
