# Sawdagar domain migration

Primary website/API: https://sawdagar.com
Admin: https://sawdagar.com/sawdagar-admin
Mail host: mail.sawdagar.com

Website, native app, admin settings, stored site content and application email identities use the new domain. Existing mailbox passwords and messages are retained. Old API/upload addresses remain available for installed app compatibility. TLS renewal also refreshes mail certificates. Shared server hostnames for other businesses are unchanged.

## Remaining Namecheap DNS records

Add these TXT records in Advanced DNS. Use Automatic TTL. Existing MX and SPF already point to this VPS; do not create duplicate SPF records.

Host: `mail._domainkey`

Value:
```text
v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA11Y2CXgCRVwIgthwKaXy0xhnSzEVM6EVN45YW8r9QsEgeMp8ghWl+/wrgF4Z1KugdtHDTfqLggappco5FNQTn33H1Y/VIqBLzEhd/EA0h0DRxlJrb3ZBXWE4i0JhthP/Sh4B7HX7ONeQkvc/QEVaGIUZ8djzURobKN4afOMLrOng17eWtkVpAuUR4GG/ao3baB6TJegY+OKTVhX3KZSb+oFs5+isrjs49PE1p5WaSb9bAecdaW6YRhshfJNyh8UGSt4QqN3jcNGMTShU32+zVXtyz7poUsf1mKrtTz2js2eB1U3gfT2oW8gLLNflZ3fBhHv+JS0L4zesf4ahP0ctHwIDAQAB
```

Host: `_dmarc`

Value:
```text
v=DMARC1; p=none; rua=mailto:info@sawdagar.com; adkim=s; aspf=s
```

These records must be published before the new domain's DKIM signature can be verified publicly. Delivery to an external mailbox has not been tested by sending unsolicited messages.

## Operational backups

VPS backup directory: `/root/sawdagar-domain-backup-20260927`. Contains the previous release pointer, application database, mail tables, Roundcube database and relevant configuration backups. Deployment build logs are in `/root/sawdagar-domain-*-build.log`.
