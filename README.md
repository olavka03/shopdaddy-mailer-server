# Contact Form Server

A small Express 5 + TypeScript service behind the Shopdaddy Studio storefront contact form. It accepts one
submission (name, email, message, pre-selected products, extra links, an optional logo file) and stores it:

- **`POST /api/contact-form`** stores it in Shopify as a **metaobject entry**, with the logo uploaded to Shopify
  Files. A Shopify Flow workflow triggered by the new entry sends the notification email.
- ~~`POST /api/contact-form/email`~~ — the original SMTP email endpoint. **Disabled:** its nodemailer code is
  commented out (search the code for `nodemailer (disabled)` to restore it).

No database, no auth, no queue. One request in, one entry out.

The API is described in [`postman/contact-form-server.openapi.json`](postman/contact-form-server.openapi.json)
(OpenAPI 3.0.3) — import it into Postman to get ready-made requests.

- Accepts `multipart/form-data`, `application/json` and `application/x-www-form-urlencoded`
- One optional logo file, held in memory and validated by extension (EPS, AI, PSD, PDF, SVG, JPG/JPEG, PNG)
- Pre-selected products parsed from a JSON string, with relative product URLs resolved to absolute and stored as JSON
- Extra links from `linkList` stored as a list of absolute URLs
- Captures the page the visitor came from and records it in the entry and the email

---

## Requirements

| Tool          | Version                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| Node.js       | 20 or newer                                                                                                           |
| npm           | 9 or newer                                                                                                            |
| Shopify store | Admin API access token with `write_metaobjects` and `write_files` (see [Shopify access token](#shopify-access-token)) |
| Shopify Flow  | Installed on the store, for the notification email of `POST /api/contact-form`                                        |
| SMTP mailbox  | Not needed while email sending is disabled                                                                            |

---

## Quick start

```bash
git clone <repo-url> contact-form-server
cd contact-form-server
npm install
cp .env.example .env        # then fill in the Shopify and mail credentials
npm run dev
```

Verify it is up:

```bash
curl -s http://localhost:3000/health
# {"success":true,"data":{"status":"ok","uptime":2.13}}
```

On startup the server also runs an SMTP handshake and logs the result, so bad mail credentials show up in the
console immediately instead of on the first real submission.

Before pointing the storefront at the new endpoint, [create the metaobject definition](#create-the-metaobject-definition)
and follow the [rollout order](#rollout-order).

---

## Environment variables

Copy `.env.example` to `.env`. Every variable is validated with zod at startup — a missing or malformed value
crashes the process before it binds a port.

| Variable                  | Required | Default                       | Description                                                                                                            |
| ------------------------- | -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `PORT`                    | ✅       | —                             | HTTP port, 1–65535                                                                                                     |
| `NODE_ENV`                | ✅       | —                             | `development` or `production`                                                                                          |
| `AVAILABLE_ORIGINS`       | —        | `*`                           | Comma-separated allowed CORS origins, or `*`                                                                           |
| `SHOPIFY_STORE_URL`       | ✅       | —                             | Storefront base URL, e.g. `https://shopdaddy-studio.com`. Relative product links from the form are resolved against it |
| `SHOPIFY_STORE_DOMAIN`    | ✅       | —                             | The store's **`*.myshopify.com`** domain, e.g. `shopdaddy-studio.myshopify.com`. Used for Admin API calls              |
| `SHOPIFY_ACCESS_TOKEN`    | ✅       | —                             | Non-expiring Admin API offline token (`shpca_…`) — read [Shopify access token](#shopify-access-token)                 |
| `SHOPIFY_METAOBJECT_TYPE` | ✅       | —                             | Type of the merchant-owned metaobject definition, e.g. `contact_form`                                                  |
| `MAIL_HOST`               | —        | `smtp.gmail.com`              | SMTP host                                                                                                              |
| `MAIL_PORT`               | —        | `465`                         | SMTP port                                                                                                              |
| `MAIL_SECURE`             | —        | `true`                        | `true` for implicit TLS (465), `false` for STARTTLS (587)                                                              |
| `MAIL_USER`               | —        | —                             | **Sender mailbox** — the account we authenticate as and send from                                                      |
| `MAIL_APP_PASSWORD`       | —        | —                             | App password for `MAIL_USER` (not the account password)                                                                |
| `MAIL_TO`                 | —        | —                             | **The only recipient** — the admin who receives every submission                                                       |
| `MAIL_FROM_NAME`          | —        | `Contact Form`                | Display name on the From header                                                                                        |
| `MAIL_SUBJECT_PREFIX`     | —        | `New contact form submission` | Prefix for the email subject                                                                                           |

`SHOPIFY_STORE_URL` and `SHOPIFY_STORE_DOMAIN` are two different things. `SHOPIFY_STORE_URL` is the public
storefront (your custom domain) used to build product links. `SHOPIFY_STORE_DOMAIN` must be the permanent
`*.myshopify.com` domain, lowercase and without `https://` — a custom domain is rejected at startup. You can find it
in Shopify admin under **Settings > Domains**.

`SHOPIFY_METAOBJECT_TYPE` is 3–255 letters, digits, hyphens or underscores. It must not start with `$app:`
(that prefix marks app-owned types, which Shopify Flow cannot see). The Admin API version is fixed in code
(`2026-07`, `src/constants/shopify.constant.ts`), not in the environment.

The `MAIL_*` variables are **not read** while email sending is disabled; the server starts without them.

Example `.env`:

```dotenv
PORT=3000
NODE_ENV=development

AVAILABLE_ORIGINS=https://shopdaddy-studio.com
SHOPIFY_STORE_URL=https://shopdaddy-studio.com

SHOPIFY_STORE_DOMAIN=shopdaddy-studio.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpca_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_METAOBJECT_TYPE=contact_form

# MAIL_HOST=smtp.gmail.com
# MAIL_PORT=465
# MAIL_SECURE=true
# MAIL_USER=robot@shopdaddy.studio
# MAIL_APP_PASSWORD=abcd efgh ijkl mnop
# MAIL_TO=admin@shopdaddy.studio
# MAIL_FROM_NAME=Shopdaddy Contact Form
# MAIL_SUBJECT_PREFIX=New contact form submission
```

### Shopify access token

Shopify no longer lets you create a custom app with a copy-once token in the admin (since 2026-01-01). The server
instead uses a **non-expiring offline token** of a **Dev Dashboard** app, obtained once with the
[authorization code grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant).
Apps created by merchants are exempt from Shopify's expiring-token requirement, so this token has
[no expiry](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens): it stays valid until the app
is **uninstalled** or its **client secret is rotated**. The server sends it as-is and never renews it.

**1. Create the app** from this store's admin: **Settings → Apps → Develop apps → Build apps in Dev Dashboard →
Create app → Start from Dev Dashboard**.

**2. Release a version** on the **Versions** tab:

- **App URL** and **Redirect URLs**: the **same host**, e.g. `https://shopdaddy-studio.com/` for both. Shopify rejects
  the authorization with `The redirect_uri and application url must have matching hosts` otherwise.
- **Access scopes**: the scopes in the table below.
- **Use legacy install flow**: **off** — with it on, installation never completes and you are only redirected.
- **Release**, then **Release** again.

| Scope               | Needed by                                                                |
| ------------------- | ------------------------------------------------------------------------ |
| `write_metaobjects` | `POST /api/contact-form` — creates the entry                             |
| `write_files`       | `POST /api/contact-form` — uploads the logo, deletes it again on failure |

**3. Install it**: Dev Dashboard → the app → **Installs → Install app** → the store → **Install**. It then appears under
**Settings → Apps and sales channels**.

**4. Get the token** (once). Open in a browser while logged in to the store admin, with your client ID:

```
https://<store>.myshopify.com/admin/oauth/authorize?client_id=<CLIENT_ID>&scope=write_metaobjects,write_files&redirect_uri=https%3A%2F%2Fshopdaddy-studio.com%2F&state=<any-random-string>
```

Shopify redirects to `https://shopdaddy-studio.com/?code=…&state=…`. Check that `state` matches, then **immediately**
exchange the one-time `code` (it expires quickly):

```bash
curl -X POST "https://<store>.myshopify.com/admin/oauth/access_token" -H "Content-Type: application/x-www-form-urlencoded" -d "client_id=<CLIENT_ID>" -d "client_secret=<CLIENT_SECRET>" -d "code=<CODE>"
```

The response is `{"access_token":"shpca_…","scope":"write_files,write_metaobjects"}`.
No `expires_in` means the token does not expire. Put it in `SHOPIFY_ACCESS_TOKEN`.

> **⚠️ Never rotate the client secret or uninstall the app** without repeating step 4: both revoke the token, and
> every submission then fails with `502 Shopify Admin API rejected the access token`. If the token leaks, rotating
> the client secret is exactly how you revoke it.

The token is read only in `src/config/env.config.ts` and is never written to logs, errors or responses. Keep it in
the platform's secret store, never in git.

> **🔒 Privacy note.** Logo files are stored in Shopify **Files**, and Shopify Files URLs are **public** on
> `cdn.shopify.com` — anyone with the link can download the file. The server uploads every logo under a randomized
> name (`<uuid>-<slug>.<ext>`) so links cannot be guessed, but they are not access-controlled. Metaobject entries
> (names, emails) are readable by any installed app with `read_metaobjects`.

### Gmail app password walkthrough

> **Disabled.** Email sending through nodemailer is commented out in the code (search for `nodemailer (disabled)`). Only needed if you restore it.

Gmail rejects plain account passwords over SMTP. You need an **app password**, which requires 2-Step
Verification on the sending account.

1. Sign in to the Google account you want to send **from** (this becomes `MAIL_USER`).
2. Go to <https://myaccount.google.com/security> and enable **2-Step Verification**. App passwords do not exist
   as an option until this is on.
3. Open <https://myaccount.google.com/apppasswords>.
4. Name the app (for example `contact-form-server`) and create it.
5. Google shows a 16-character password in four groups. Copy it into `MAIL_APP_PASSWORD`. Spaces are accepted;
   the value is used verbatim. You cannot view it again — regenerate if lost.
6. Leave `MAIL_HOST=smtp.gmail.com`, `MAIL_PORT=465`, `MAIL_SECURE=true`.

Troubleshooting:

| Symptom                                        | Cause                                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `535-5.7.8 Username and Password not accepted` | Account password used instead of an app password, or `MAIL_USER` is not the account that owns the app password |
| Connection hangs, then times out               | Port/secure mismatch — use `465` + `MAIL_SECURE=true`, or `587` + `MAIL_SECURE=false`                          |
| App passwords option missing                   | 2-Step Verification is off, or a Workspace admin has disabled app passwords for the org                        |

Google Workspace accounts may need "Less secure app access"-equivalent policies reviewed by the admin.
For non-Gmail providers just point `MAIL_HOST` / `MAIL_PORT` / `MAIL_SECURE` at their SMTP settings.

---

## Create the metaobject definition

`POST /api/contact-form` writes into a **merchant-owned** metaobject definition whose type equals
`SHOPIFY_METAOBJECT_TYPE`. The merchant creates it once in the Shopify admin; the server never creates or changes it.
It must exist before the first submission. Shopify Flow reads the field keys below, so they are a **frozen contract**:
never rename or remove them once a workflow uses them.

1. Go to **Settings > Custom data > Metaobject definitions > Add definition**.
2. Name it **Contact form**. Click the type below the name and set it to the exact value of
   `SHOPIFY_METAOBJECT_TYPE` (`contact_form`).
3. Add the nine fields below. For each field, open it and set the **key** to the value in the "Key" column, and
   tick **Required** only for `name` and `email`.
4. Save.

| Field name     | Key              | Shopify admin type       | Required | Value written by the server                                                    |
| -------------- | ---------------- | ------------------------ | -------- | ------------------------------------------------------------------------------ |
| Name           | `name`           | Single line text         | ✅       | `name`, line breaks collapsed into spaces                                      |
| Email          | `email`          | Email (Single line text) | ✅       | `email`                                                                        |
| Message        | `message`        | Multi-line text          | —        | `message` (max 10 000 characters)                                              |
| Previous page  | `previous_page`  | URL                      | —        | `previousPage`, only when it is an absolute `http(s)` URL                      |
| Terms accepted | `terms_accepted` | True or false            | —        | Always written, `true` or `false`                                              |
| Products       | `products`       | JSON                     | —        | The selected products as a JSON array, see [Products format](#products-format) |
| Links          | `link_list`      | URL (list of values)     | —        | `linkList` as a list of absolute URLs, see [Links format](#links-format)       |
| Submitted at   | `submitted_at`   | Date and time            | —        | Server clock, UTC                                                              |
| Logo           | `logo`           | URL                      | —        | Public Shopify CDN URL of the uploaded logo                                    |

> **⚠️ Keys must match exactly.** The admin derives a key from the field name you type, which is not always the key
> the server expects, so always check the key itself. A wrong or missing key makes every submission fail with
> `502 Could not create the contact form entry`.

The logo file itself is uploaded to **Shopify Files**; the entry only stores its URL. Empty optional fields are left
out of the entry (`terms_accepted` is always written). Every entry gets the handle `contact-form-<uuid>`.

### Products format

`products` stores the products in the same format the storefront sends in `selectedProducts`: a compact JSON array
of `{ "name", "variant", "url" }` objects with the same values. The server only normalizes it:

- keys are always in the order `name`, `variant`, `url`; items without a `name` are dropped;
- `name` and `variant` have whitespace runs (including line breaks and tabs) collapsed into one space and are trimmed;
  an empty `variant` is left out;
- `url` is the storefront URL resolved against `SHOPIFY_STORE_URL`, so it is always absolute. It is kept only when it
  is `http(s)`, has the same scheme and host as `SHOPIFY_STORE_URL`, is already in canonical form (no credentials,
  default port, upper case or raw whitespace, which a relative storefront URL never has) and is at most 2 KB;
  otherwise the `url` key is left out. Every stored link therefore starts with the store origin followed by `/`, and a
  tampered request cannot put a link to another site into the admin email;
- no other character is changed. The field is left out when there are no products.

For the storefront payload

```json
{
  "selectedProducts": "[\n\t\t{\"name\":\"Red Set of Thick Leather Coasters (5 pcs)\",\"variant\":\"Red\",\"url\":\"/products/set-of-thick-leather-coasters-5-pcs?_pos=1&_psq=re&_psid=ebb3966bf&_ss=e&variant=39382829957207\"},\n\t\t{\"name\":\"Red Leather Menu Book with Woven Pattern\",\"variant\":\"Red / 8.5x5.5\",\"url\":\"/products/red-leather-menu-book-with-woven-pattern?_pos=2&_psq=re&_psid=ebb3966bf&_ss=e&variant=42707676987479\"}\n\t]"
}
```

the entry's `products` value is exactly (one line):

```json
[{"name":"Red Set of Thick Leather Coasters (5 pcs)","variant":"Red","url":"https://shopdaddy-studio.com/products/set-of-thick-leather-coasters-5-pcs?_pos=1&_psq=re&_psid=ebb3966bf&_ss=e&variant=39382829957207"},{"name":"Red Leather Menu Book with Woven Pattern","variant":"Red / 8.5x5.5","url":"https://shopdaddy-studio.com/products/red-leather-menu-book-with-woven-pattern?_pos=2&_psq=re&_psid=ebb3966bf&_ss=e&variant=42707676987479"}]
```

The same value, formatted for reading:

```json
[
  {
    "name": "Red Set of Thick Leather Coasters (5 pcs)",
    "variant": "Red",
    "url": "https://shopdaddy-studio.com/products/set-of-thick-leather-coasters-5-pcs?_pos=1&_psq=re&_psid=ebb3966bf&_ss=e&variant=39382829957207"
  },
  {
    "name": "Red Leather Menu Book with Woven Pattern",
    "variant": "Red / 8.5x5.5",
    "url": "https://shopdaddy-studio.com/products/red-leather-menu-book-with-woven-pattern?_pos=2&_psq=re&_psid=ebb3966bf&_ss=e&variant=42707676987479"
  }
]
```

---

### Links format

`link_list` is a **list of URLs** field, so Shopify stores it as a JSON array of strings. The storefront sends the
links in `linkList`, either as a JSON array (`["https://…","https://…"]`), as one bare URL, or as a real array in a
JSON body. They may point anywhere — a product, a page, a file, another site — so unlike products they are not
restricted to the store origin. The server keeps a link only when it is an absolute `http(s)` URL of at most 2 KB,
drops duplicates (after URL normalization) and keeps at most 128 links, which is Shopify's limit for a list field.
Anything else (`javascript:` URLs, relative paths, other schemes, empty values, non-string items) is dropped without
failing the submission. The field is left out of the entry when no link survives.

## Shopify Flow

The server never sends the email for `POST /api/contact-form`; Flow does, with **Liquid only** — no code step.

1. In the **Shopify Flow** app, create a workflow.
2. Trigger: **Metaobject entry created**, with the metaobject definition set to **Contact form**.
3. Action: **Send internal email** with the recipient addresses, a subject and the message below.
4. Turn the workflow **on**.

The template reads the entry's fields directly from the trigger variable (`metaobject.name`, `metaobject.email`, …,
without `.value`). Keys with two words are camelCase in Flow: `previous_page` → `previousPage`,
`terms_accepted` → `termsAccepted`, `submitted_at` → `submittedAt`, `link_list` → `linkList`. If the editor names a field differently, insert it
with **Add a variable**. Every value goes through `escape`. The layout uses tables and inline styles only, because
most mail clients strip `<style>` blocks.

**Subject:**

```liquid
New custom order request from {{ metaobject.name }}
```

**Message:**

```liquid
{% assign bs = "\\" | slice: 0 %}
{% assign esc_bs = bs | append: bs %}
{% assign esc_quote = bs | append: '"' %}
{% assign ph_bs = bs | append: "B" %}
{% assign ph_quote = bs | append: "Q" %}
{% assign esc_amp = bs | append: "u0026" %}
{% assign esc_lt = bs | append: "u003c" %}
{% assign esc_gt = bs | append: "u003e" %}
{% assign esc_apos = bs | append: "u0027" %}
{% assign esc_slash = bs | append: "/" %}
{% assign message_text = metaobject.message | strip %}
{% assign logo_url = metaobject.logo | strip %}
{% assign previous_page_url = metaobject.previousPage | strip %}
{% assign terms_text = metaobject.termsAccepted | strip %}
{% assign submitted_raw = metaobject.submittedAt | strip %}
{% assign submitted_month = submitted_raw | slice: 5, 2 %}
{% assign submitted_month_name = "" %}
{% case submitted_month %}
  {% when "01" %}{% assign submitted_month_name = "January" %}
  {% when "02" %}{% assign submitted_month_name = "February" %}
  {% when "03" %}{% assign submitted_month_name = "March" %}
  {% when "04" %}{% assign submitted_month_name = "April" %}
  {% when "05" %}{% assign submitted_month_name = "May" %}
  {% when "06" %}{% assign submitted_month_name = "June" %}
  {% when "07" %}{% assign submitted_month_name = "July" %}
  {% when "08" %}{% assign submitted_month_name = "August" %}
  {% when "09" %}{% assign submitted_month_name = "September" %}
  {% when "10" %}{% assign submitted_month_name = "October" %}
  {% when "11" %}{% assign submitted_month_name = "November" %}
  {% when "12" %}{% assign submitted_month_name = "December" %}
{% endcase %}
{% if submitted_month_name != "" %}
  {% assign submitted_year = submitted_raw | slice: 0, 4 %}
  {% assign submitted_day = submitted_raw | slice: 8, 2 | plus: 0 %}
  {% assign submitted_time = submitted_raw | slice: 11, 5 %}
  {% assign submitted_zone = submitted_raw | slice: 19, 6 %}
  {% if submitted_zone == "" or submitted_zone == "Z" or submitted_zone == "+00:00" %}
    {% assign submitted_zone = "UTC" %}
  {% else %}
    {% assign submitted_zone = "UTC" | append: submitted_zone %}
  {% endif %}
  {% assign submitted_at_text = submitted_month_name | append: " " | append: submitted_day | append: ", " | append: submitted_year | append: " at " | append: submitted_time | append: " " | append: submitted_zone %}
{% else %}
  {% assign submitted_at_text = submitted_raw %}
{% endif %}
{% assign link_list_text = metaobject.linkList | replace: esc_bs, ph_bs | replace: esc_quote, ph_quote | replace: esc_amp, "&" | replace: esc_lt, "<" | replace: esc_gt, ">" | replace: esc_apos, "'" | replace: esc_slash, "/" | strip %}
{% if link_list_text contains '"' %}
  {% assign link_tokens = link_list_text | split: '"' %}
{% else %}
  {% assign link_tokens = link_list_text | split: "," %}
{% endif %}
{% assign links_html = "" %}
{% for link_token in link_tokens %}
  {% assign link_value = link_token | replace: ph_quote, '"' | replace: ph_bs, bs | strip %}
  {% assign link_scheme = link_value | slice: 0, 4 %}
  {% if link_scheme == "http" and link_value contains "://" %}
    {% assign item_link = link_value | escape %}
    {% assign links_html = links_html | append: '<tr><td style="padding:10px 0;border-top:1px solid #e5e3dc;font-size:14px;line-height:20px;word-break:break-all;"><a href="' | append: item_link | append: '" style="color:#372727;text-decoration:underline;">' | append: item_link | append: "</a></td></tr>" %}
  {% endif %}
{% endfor %}
{% assign products_json = metaobject.products | replace: esc_bs, ph_bs | replace: esc_quote, ph_quote | replace: esc_amp, "&" | replace: esc_lt, "<" | replace: esc_gt, ">" | replace: esc_apos, "'" | replace: esc_slash, "/" %}
{% assign product_tokens = products_json | split: '"' %}
{% assign in_string = false %}
{% assign after_colon = false %}
{% assign pair_key = "" %}
{% assign product_name = "" %}
{% assign product_variant = "" %}
{% assign product_url = "" %}
{% assign products_html = "" %}
{% for product_token in product_tokens %}
  {% if in_string %}
    {% if after_colon %}
      {% assign pair_value = product_token | replace: ph_quote, '"' | replace: ph_bs, bs %}
      {% case pair_key %}
        {% when "name" %}{% assign product_name = pair_value %}
        {% when "variant" %}{% assign product_variant = pair_value %}
        {% when "url" %}{% assign product_url = pair_value %}
      {% endcase %}
    {% else %}
      {% assign pair_key = product_token %}
    {% endif %}
    {% assign in_string = false %}
  {% else %}
    {% assign structure = product_token | strip %}
    {% if structure contains "}" %}
      {% if product_name != "" %}
        {% assign item_name = product_name | escape %}
        {% assign products_html = products_html | append: '<tr><td style="padding:10px 12px 10px 0;border-top:1px solid #e5e3dc;vertical-align:middle;font-size:14px;line-height:20px;color:#372727;">' | append: item_name %}
        {% if product_variant != "" %}
          {% assign item_variant = product_variant | escape %}
          {% assign products_html = products_html | append: '<br><span style="color:#6f6362;">' | append: item_variant | append: "</span>" %}
        {% endif %}
        {% assign products_html = products_html | append: '</td><td align="right" style="padding:10px 0;border-top:1px solid #e5e3dc;vertical-align:middle;white-space:nowrap;">' %}
        {% if product_url != "" %}
          {% assign item_url = product_url | escape %}
          {% assign products_html = products_html | append: '<a href="' | append: item_url | append: '" style="display:inline-block;padding:6px 12px;border:1px solid #372727;border-radius:6px;font-size:13px;line-height:18px;color:#372727;text-decoration:none;">View product</a>' %}
        {% endif %}
        {% assign products_html = products_html | append: "</td></tr>" %}
      {% endif %}
      {% assign product_name = "" %}
      {% assign product_variant = "" %}
      {% assign product_url = "" %}
    {% endif %}
    {% if structure == ":" or structure == "=>" %}
      {% assign after_colon = true %}
    {% else %}
      {% assign after_colon = false %}
    {% endif %}
    {% assign in_string = true %}
  {% endif %}
{% endfor %}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&amp;family=Shippori+Mincho&amp;display=swap">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:#e5e3dc;">
  <tr>
    <td align="center" style="padding:32px 16px;background-color:#e5e3dc;">
      <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;margin:0 auto;border-collapse:separate;border-spacing:0;">
        <tr>
          <td align="center" style="padding:0 0 24px;background-color:#e5e3dc;">
            <a href="https://shopdaddy-studio.com" style="text-decoration:none;"><img src="https://shopdaddy-studio.com/cdn/shop/files/Logo_Shopdaddy.svg?v=1777367869&amp;width=600&amp;format=png" width="200" alt="Shopdaddy-Studio" style="display:block;width:200px;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;font-size:20px;color:#372727;"></a>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 32px;background-color:#f6f5f1;border-radius:8px;text-align:left;font-family:Figtree,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#372727;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding-bottom:20px;border-bottom:1px solid #e5e3dc;">
            <div style="font-family:'Shippori Mincho',Georgia,'Times New Roman',serif;font-size:28px;line-height:34px;font-weight:400;">New custom order request<span style="color:#e2591c;">.</span></div>
            {% if submitted_at_text != "" and submitted_at_text != "null" %}
            <div style="padding-top:6px;font-size:13px;line-height:20px;color:#6f6362;"><span style="font-weight:600;">Submitted:</span> {{ submitted_at_text | escape }}</div>
            {% endif %}
          </td>
        </tr>
        <tr>
          <td style="padding-top:16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              <tr>
                <td width="110" style="width:110px;padding:6px 16px 6px 0;vertical-align:top;font-size:14px;line-height:20px;color:#6f6362;">Name</td>
                <td style="padding:6px 0;vertical-align:top;font-size:14px;line-height:20px;word-break:break-word;">{{ metaobject.name | escape }}</td>
              </tr>
              <tr>
                <td width="110" style="width:110px;padding:6px 16px 6px 0;vertical-align:top;font-size:14px;line-height:20px;color:#6f6362;">Email</td>
                <td style="padding:6px 0;vertical-align:top;font-size:14px;line-height:20px;word-break:break-word;"><a href="mailto:{{ metaobject.email | escape }}" style="color:#372727;text-decoration:underline;">{{ metaobject.email | escape }}</a></td>
              </tr>
              {% if previous_page_url != "" and previous_page_url != "null" %}
              <tr>
                <td width="110" style="width:110px;padding:6px 16px 6px 0;vertical-align:top;font-size:14px;line-height:20px;color:#6f6362;">Came from</td>
                <td style="padding:6px 0;vertical-align:top;font-size:14px;line-height:20px;word-break:break-all;"><a href="{{ previous_page_url | escape }}" style="color:#372727;text-decoration:underline;">{{ previous_page_url | escape }}</a></td>
              </tr>
              {% endif %}
              <tr>
                <td width="110" style="width:110px;padding:6px 16px 6px 0;vertical-align:top;font-size:14px;line-height:20px;color:#6f6362;">Terms</td>
                <td style="padding:6px 0;vertical-align:top;font-size:14px;line-height:20px;">{% if terms_text == "true" %}Accepted{% elsif terms_text == "false" %}Not accepted{% else %}{{ terms_text | escape }}{% endif %}</td>
              </tr>
            </table>
          </td>
        </tr>
        {% if message_text != "" and message_text != "null" %}
        <tr>
          <td style="padding-top:24px;">
            <div style="padding-bottom:8px;font-family:'Shippori Mincho',Georgia,'Times New Roman',serif;font-size:18px;line-height:24px;font-weight:400;">Message</div>
            <div style="font-size:14px;line-height:22px;word-break:break-word;">{{ message_text | escape | newline_to_br }}</div>
          </td>
        </tr>
        {% endif %}
        {% if products_html != "" %}
        <tr>
          <td style="padding-top:24px;">
            <div style="padding-bottom:8px;font-family:'Shippori Mincho',Georgia,'Times New Roman',serif;font-size:18px;line-height:24px;font-weight:400;">Products</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-bottom:1px solid #e5e3dc;">{{ products_html }}</table>
          </td>
        </tr>
        {% endif %}
        {% if links_html != "" %}
        <tr>
          <td style="padding-top:24px;">
            <div style="padding-bottom:8px;font-family:'Shippori Mincho',Georgia,'Times New Roman',serif;font-size:18px;line-height:24px;font-weight:400;">Links</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-bottom:1px solid #e5e3dc;">{{ links_html }}</table>
          </td>
        </tr>
        {% endif %}
        <tr>
          <td style="padding-top:24px;">
            <div style="padding-bottom:8px;font-family:'Shippori Mincho',Georgia,'Times New Roman',serif;font-size:18px;line-height:24px;font-weight:400;">Logo</div>
            {% if logo_url != "" and logo_url != "null" %}
            <a href="{{ logo_url | escape }}" style="display:inline-block;padding:6px 12px;border:1px solid #372727;border-radius:6px;font-size:13px;line-height:18px;color:#372727;text-decoration:none;">Open logo</a>
            {% else %}
            <div style="font-size:14px;line-height:20px;color:#6f6362;">none</div>
            {% endif %}
          </td>
        </tr>
      </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

How `products` is read. In Flow `metaobject.products` is a JSON scalar with no child fields (the editor rejects
`metaobject.products.name`), and Flow Liquid has no JSON parse filter, so the value is read as text with standard string
filters only (`replace`, `split`, `slice`, `append`, `strip`) and the `contains` operator. If Flow hands over a parsed
structure instead of the JSON string, Liquid turns it into Ruby's text form (`{"name"=>"…"}`), which the same parser
reads, because `=>` is accepted as a key/value separator next to `:`:


1. A backslash is built as `"\\" | slice: 0`, which gives one backslash whether the Liquid engine treats `\\` in a
   string literal as one or two characters.
2. The JSON escapes `\\` and `\"` are replaced with the placeholders `\B` and `\Q` (in that order). After that step
   every remaining backslash starts a JSON escape, and JSON has no `\B` or `\Q` escape, so the placeholders cannot
   collide with real data, and no `"` from a value is left.
3. The HTML-safe escapes `\u0026`, `\u003c`, `\u003e`, `\u0027` and `\/` are turned back into `&`, `<`, `>`, `'` and `/`.
   They only ever encode those characters, so this is lossless even if Shopify serializes the JSON that way.
4. The value is split on `"`. Every `"` left is JSON structure, so the pieces alternate: structure (`[{`, `:`, `,`,
   `},{`, `}]`, with any spaces, tabs or line breaks around them), then a key or value string, then structure again.
   Whitespace only ever sits in the structure pieces, which are `strip`ped, so compact, spaced and pretty-printed
   JSON read the same. Keys may arrive in any order.
5. A string that follows a `:` piece is the value of the key before it. A structure piece that contains `}` closes
   the product, which is printed if it has a name and then reset.
6. In the printed values `\Q` and then `\B` are restored to `"` and `\`.

Each product is a table row: the name, the variant in grey on the line below, and a **View product** button on the
right. The variant is left out when there is none and the button when there is no URL. The button links to the stored
absolute URL as is; the template adds no domain. The logo is an **Open logo** button that links to the file, and terms
print `Accepted` or `Not accepted` (any other value is printed as is).

The email uses the store's colours: a `#f6f5f1` card up to 640px wide, centred on the `#e5e3dc` header colour, with
`#372727` text, links and button borders, and the `#e2591c` dot after the title. The store logo sits above the card
and links to the store; it is loaded as PNG (`&format=png` on the Shopify CDN URL) because Gmail and Outlook do not
show SVG images. Headings use the store's Shippori Mincho and text uses Figtree, loaded from Google Fonts; clients that
block web fonts (Gmail, Outlook) fall back to Georgia and the system sans-serif font. Flow prints `submitted_at` with an
offset (`2026-09-17T12:36:48+00:00`). The template cuts the date and time out of that text and prints
`September 17, 2026 at 12:36 UTC`; it does not use the `date` filter, so no engine can shift the time zone. The server
always writes the value in UTC; if Flow ever prints another offset, it is shown as `UTC-05:00`, and a value in an
unexpected format is printed as is.

The template was rendered with Ruby Liquid 5.2 and LiquidJS 10 against the exact values the server writes for the
storefront payload above and for hostile product data (quotes, backslashes, `\"`, `","`, `":"`, `"},{"`, `[{"`,
`"}]`, `&`, `<`, `'`, literal `\u0026`, `\B` and `\Q`, emoji, Cyrillic, line breaks, other-host, `http:`, credential
and `javascript:` URLs), each in eight serializations: compact, with spaces, with spaces and reversed keys,
pretty-printed with two spaces, tabs or CRLF line breaks, and with HTML-safe escapes both compact and pretty-printed. Every product line
matched the stored data exactly and all visitor HTML was escaped.

How `link_list` is read. The value is read as text too, because Flow may hand a list field over as the JSON array
Shopify stores (`["https://a","https://b"]`) or as an already parsed list, which Liquid turns into Ruby's text form
(`["https://a", "https://b"]`). Both contain `"`, so the value is split on it; when the text has no `"` at all (a
single URL, or a list joined with commas) it is split on `,` instead. A piece becomes a link only when it starts with
`http` and contains `://`, which drops the `[`, `,` and `]` pieces along with anything that is not an http(s) URL.
The same unescaping as for products runs first, so `\/` and `\u0026` in the stored JSON read back as `/` and `&`.

Optional values are turned into text with `strip` before they are compared, so an empty field is detected whatever
form Flow hands it over in (missing, `null`, an empty string or an empty field object). Products are collected into
`products_html` first and the section is decided by whether any product was actually found; the same is done for the
links. When there is no logo the email says `none`; an empty message, previous page, products list or link list leaves
its section out of the email entirely. `blank` is not used: outside Rails,
Ruby Liquid evaluates `!= blank` as true for missing values.

The template was also rendered in Ruby Liquid 5.2 (UTF-8) with `products` as a compact JSON string, pretty-printed
JSON, a parsed Ruby structure and Ruby 3.4's `inspect` format, and in LiquidJS 10 with the JSON string and pretty JSON,
for the storefront payload, hostile product data and a minimal submission: all six variants produce identical HTML.

Check two things once on a development store, because the Flow documentation does not confirm them:

- that the trigger exposes the fields directly as `metaobject.<field>` — insert them with **Add a variable** if the
  editor names them differently;
- that **Send internal email** renders HTML. If it does not, the message arrives with visible tags.

The internal email cannot set reply-to or carry attachments: reply through the visitor's email address and open the
logo through its link. Also confirm that an entry created by this server fires the workflow before going live.

### Rollout order

Flow only reacts to entries created **while the workflow is on**. It never backfills: a submission that arrives
before the workflow is on is stored in Shopify but no email is ever sent for it. Roll out in this order:

1. **Definition** — create it in the Shopify admin, see [Create the metaobject definition](#create-the-metaobject-definition).
2. **Flow workflow on** — trigger "Metaobject entry created" + "Send internal email".
3. **Deploy** the server and point the storefront form at `POST /api/contact-form`.

---

## Scripts

| Script           | Command                                     | Purpose                                                       |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `npm run dev`    | `nodemon` + `ts-node` with `tsconfig-paths` | Development server with reload on `src/` changes              |
| `npm run build`  | `tsc && tsc-alias`                          | Compile to `dist/` and rewrite path aliases to relative paths |
| `npm start`      | `node index.js`                             | Run the compiled build (production, forwards to `dist/`)      |
| `npm run format` | `prettier src/ --write`                     | Format sources                                                |
| `npm run lint`   | `eslint src/ --fix`                         | Lint and autofix                                              |
| `npm run fix`    | format + lint                               | Both of the above                                             |

`tsc-alias` is required: TypeScript resolves `@config` at compile time but does not rewrite it in the emitted
JavaScript, so `npm start` would fail without it.

---

## Project structure

```
src/
├── server.ts          # composition root: middlewares → routers → error handler → listen
├── api/               # Shopify Admin GraphQL client (nodemailer transporter commented out)
├── config/            # the only place dotenv and process.env are touched
├── constants/         # logo upload rules, metaobject field keys, Shopify API version
├── controllers/       # health check, create contact form entry (email controller commented out)
├── enums/             # Environment
├── exceptions/        # ApiError + status factories
├── graphql/           # Admin API queries and mutations (validated against 2026-07)
├── middlewares/       # cors, json, urlencoded, logo upload, success wrapper, error handler
├── routes/            # GET /health, POST /api/contact-form
├── services/          # upload the logo, create the entry, delete files (email services commented out)
├── templates/         # HTML email templates, commented out
├── types/             # ContactFormPayload, SelectedProduct, MailAttachment, Shopify response types, …
├── utils/             # pure helpers (parsing, escaping, formatting, URL resolution, metaobject fields)
└── validators/        # zod schemas for env and for the contact form payload
```

Every directory exposes an `index.ts` barrel and is imported through a path alias
(`@config`, `@utils`, `@services`, …) — never through a relative path across directories.

---

## API

| Method | Path                      | Logo max | Result                                                                  |
| ------ | ------------------------- | -------- | ----------------------------------------------------------------------- |
| `GET`  | `/health`                 | —        | Liveness check, no external calls                                       |
| `POST` | `/api/contact-form`       | 20 MB    | Uploads the logo to Shopify Files, creates one metaobject entry → `201` |
| `POST` | `/api/contact-form/email` | —        | **Disabled** (nodemailer commented out) → `404`                         |

### `GET /health`

```bash
curl -s http://localhost:3000/health
```

```json
{ "success": true, "data": { "status": "ok", "uptime": 1284.517 } }
```

### Form fields

Both `POST` endpoints accept the same fields — exactly what the storefront form sends. Any other field is ignored.

| Field              | Required | Notes                                                                                                                                                                                                                                                                                              |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | ✅       | trimmed, non-empty                                                                                                                                                                                                                                                                                 |
| `email`            | ✅       | visitor address; becomes the email `replyTo`                                                                                                                                                                                                                                                       |
| `message`          | —        | newlines preserved, max 10 000 characters                                                                                                                                                                                                                                                             |
| `selectedProducts` | —        | JSON string of `[{ "name", "variant", "url" }]`. `url` is usually relative (`/products/<handle>?variant=<id>`) and is resolved against `SHOPIFY_STORE_URL`. Items without a `name` are skipped; see [Products format](#products-format)                                                               |
| `linkList`         | —        | JSON array of absolute `http(s)` URLs (a single bare URL is also accepted); see [Links format](#links-format)                                                                                                                                                                                       |
| `logo`             | —        | **one** file, see [Logo rules](#logo-rules)                                                                                                                                                                                                                                                        |
| `terms`            | —        | checkbox; `on` (also `true` / `1` / `yes`) → accepted, anything else or missing → not accepted                                                                                                                                                                                                     |
| `previousPage`     | —        | Hidden input with `document.referrer` — the page the visitor came from **before** the form page. Only an absolute `http(s)` URL is kept; an empty or any other value is silently ignored and never fails the submission |

### Logo rules

- Field name **`logo`**, at most **one** file. A second file or a file under any other field name returns `400`.
- Allowed extensions (case-insensitive): **EPS, AI, PSD, PDF, SVG, JPG, JPEG, PNG**. The type is decided by the
  **extension**, not by the browser's MIME type, because browsers send `application/octet-stream` for EPS/AI/PSD.
- Maximum size: **20 MB**.
- In Shopify every logo is stored as a generic file, untouched, under a randomized name.

### `POST /api/contact-form`

```bash
curl -X POST http://localhost:3000/api/contact-form \
  -F 'name=Jane Doe' \
  -F 'email=jane.doe@example.com' \
  -F 'message=Hi, I would like a quote for 200 units before the end of the month.' \
  -F 'terms=on' \
  -F 'previousPage=https://shopdaddy-studio.com/collections/coasters' \
  -F 'selectedProducts=[{"name":"Red Set of Thick Leather Coasters (5 pcs)","variant":"Red","url":"/products/set-of-thick-leather-coasters-5-pcs?variant=39382829957207"}]' \
  -F 'linkList=["https://shopdaddy-studio.com/pages/lookbook","https://example.com/brief.pdf"]' \
  -F 'logo=@./brand-logo.ai'
```

```json
{
  "success": true,
  "data": {
    "id": "gid://shopify/Metaobject/123456789",
    "handle": "contact-form-5b2f6a0e-3c1d-4f7a-9e54-6b3a1f0d77c2",
    "type": "contact_form",
    "logoUrl": "https://cdn.shopify.com/s/files/1/0000/0000/files/0f7c…-brand-logo.ai?v=1757514727"
  }
}
```

`logoUrl` is `null` when no logo was sent. The request waits until Shopify has finished processing the logo (up to
about 20 seconds) before creating the entry, so the entry never points to an unfinished file. If anything fails
after the upload, the uploaded file is deleted again.

### `POST /api/contact-form/email`

> **Disabled.** Email sending through nodemailer is commented out in the code (search for `nodemailer (disabled)`). While disabled the route returns `404`. Reference for when it is restored:

```bash
curl -X POST http://localhost:3000/api/contact-form/email \
  -F 'name=Jane Doe' \
  -F 'email=jane.doe@example.com' \
  -F 'message=Hi, I would like a quote for 200 units before the end of the month.' \
  -F 'terms=on' \
  -F 'previousPage=https://shopdaddy-studio.com/collections/coasters' \
  -F 'selectedProducts=[{"name":"Red Set of Thick Leather Coasters (5 pcs)","variant":"Red","url":"/products/set-of-thick-leather-coasters-5-pcs?variant=39382829957207"}]' \
  -F 'linkList=["https://shopdaddy-studio.com/pages/lookbook","https://example.com/brief.pdf"]' \
  -F 'logo=@./brand-logo.png'
```

```json
{
  "success": true,
  "data": {
    "messageId": "<f1b0c9e2-6c1d-4a3f-9a54-6b3a1f0d77c2@shopdaddy.studio>",
    "accepted": ["admin@shopdaddy.studio"],
    "sentAt": "2026-09-10T14:32:07.412Z",
    "productsCount": 1,
    "attachmentsCount": 1
  }
}
```

`attachmentsCount` is `1` when a logo was attached, otherwise `0`.

### Errors

| Status | When                                                              | Body                                                                                                                |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `400`  | Payload failed validation                                         | `{ "success": false, "message": "Validation failed", "errors": { "formErrors": [], "fieldErrors": { … } } }`        |
| `400`  | Logo has a disallowed extension                                   | `{ "success": false, "message": "The logo must be one of these file types: EPS, AI, PSD, PDF, SVG, JPG, JPEG, PNG", … }` |
| `400`  | Logo too large                                                    | `{ "success": false, "message": "The logo file is too large", "errors": { "code": "LIMIT_FILE_SIZE", … } }`         |
| `400`  | More than one file, or a file outside the `logo` field            | `{ "success": false, "message": "Only one file can be uploaded, in the \"logo\" field", "errors": { … } }`          |
| `422`  | Shopify could not process the logo                                | `{ "success": false, "message": "The logo file could not be processed, please upload a different file", … }`        |
| `502`  | Shopify Admin API unreachable, token rejected, throttled or erred | `{ "success": false, "message": "Shopify Admin API rejected the access token", "errors": { "status": 401 } }`       |
| `502`  | Logo upload or entry creation failed in Shopify                   | `{ "success": false, "message": "Could not create the contact form entry", "errors": { "userErrors": [ … ] } }`     |
| `502`  | SMTP refused or failed (email endpoint)                           | `{ "success": false, "message": "Failed to send the contact form email", "errors": { "reason": "…" } }`             |
| `500`  | Anything unexpected                                               | `{ "success": false, "message": "<error message, else Internal error>", "errors": {} }`                             |

---

## Deployment

```bash
npm ci
npm run build
npm start          # serves dist/src/server.js
```

Checklist:

- Follow the [rollout order](#rollout-order): definition → Flow workflow on → deploy.
- Set `NODE_ENV=production` and pin `AVAILABLE_ORIGINS` to your storefront origins — do not ship `*`.
- Provide the environment variables through the platform's secret store (Railway, Render, Fly, Heroku, Docker
  secrets). `.env` is git-ignored and is a local-development convenience only.
- Set `SHOPIFY_ACCESS_TOKEN` to the non-expiring offline token (see [Shopify access token](#shopify-access-token)).
- Allow requests of 20 MB and about 30 seconds on the proxy in front of the server: a large logo is uploaded and
  processed by Shopify within the request.
- Point the platform health check at `GET /health`. It performs no SMTP or Shopify call, so it stays green during
  an outage while submissions correctly return 502.
- Outbound HTTPS to `*.myshopify.com` and Shopify's upload storage, and outbound TCP to the SMTP port (465 or 587),
  must be open; some hosts block 25 and 587 by default.
- Only `dependencies` are needed at runtime; `devDependencies` can be pruned after `npm run build`.
- Logs: startup line with the port, the SMTP verification result, one line per created entry, and `[ERROR] …` for
  every failed request.
