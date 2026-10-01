# Contact Form Server

A small Express 5 + TypeScript service behind the Shopdaddy Studio storefront contact form. It accepts one
submission (name, email, message, pre-selected products, extra links, an optional logo file), builds an HTML email
and sends it through [Resend](https://resend.com):

- **`POST /api/contact-form`** sends one email to `MAIL_TO`, with the logo as an **attachment** and the visitor's
  email as **Reply-To**, so answering the email answers the visitor directly.

No database, no auth, no queue, no storage. One request in, one email out. Nothing is written to Shopify; the logo
only lives in memory for the duration of the request.

The API is described in [`postman/contact-form-server.openapi.json`](postman/contact-form-server.openapi.json)
(OpenAPI 3.0.3) — import it into Postman to get ready-made requests.

> The previous implementation (a Shopify metaobject entry + a Shopify Flow email, logo stored in Shopify Files) lives
> on the `metaobjects-flow` branch.

---

## Requirements

| Tool    | Version                                                                      |
| ------- | ---------------------------------------------------------------------------- |
| Node.js | 20 or newer                                                                  |
| npm     | 9 or newer                                                                   |
| Resend  | A verified sending domain and an API key (see [Resend setup](#resend-setup)) |

---

## Quick start

```bash
git clone <repo-url> contact-form-server
cd contact-form-server
npm install
cp .env.example .env        # then fill in the Resend key and the addresses
npm run dev
```

Verify it is up:

```bash
curl -s http://localhost:3000/health
# {"success":true,"data":{"status":"ok","uptime":2.13}}
```

---

## Environment variables

Copy `.env.example` to `.env`. Every variable is validated with zod at startup — a missing or malformed value
crashes the process with a list of the problems before it binds a port.

| Variable            | Required | Default            | Description                                                                                                                                      |
| ------------------- | -------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PORT`              | ✅       | —                  | HTTP port, 1–65535                                                                                                                               |
| `NODE_ENV`          | ✅       | —                  | `development` or `production`                                                                                                                    |
| `AVAILABLE_ORIGINS` | —        | `*`                | Comma-separated allowed CORS origins, or `*`                                                                                                     |
| `SHOPIFY_STORE_URL` | ✅       | —                  | Storefront base URL, e.g. `https://shopdaddy-studio.com`. Relative product links are resolved against it, and only links to this origin are kept |
| `RESEND_API_KEY`    | ✅       | —                  | Resend API key (`re_…`). A key with **Sending access** is enough                                                                                 |
| `MAIL_FROM_EMAIL`   | ✅       | —                  | Sender address. Must be on a domain **verified in Resend**, e.g. `no-reply@shopdaddy-studio.com`                                                 |
| `MAIL_FROM_NAME`    | —        | `Shopdaddy Studio` | Display name of the sender. No quotes, angle brackets, commas or semicolons                                                                      |
| `MAIL_TO`           | ✅       | —                  | Recipients of every submission, comma-separated (at most 50)                                                                                     |

Example `.env`:

```dotenv
PORT=3000
NODE_ENV=development
AVAILABLE_ORIGINS=https://shopdaddy-studio.com

SHOPIFY_STORE_URL=https://shopdaddy-studio.com

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM_EMAIL=no-reply@shopdaddy-studio.com
MAIL_FROM_NAME=Shopdaddy Studio
MAIL_TO=orders@shopdaddy-studio.com, owner@shopdaddy-studio.com
```

### Resend setup

1. **Verify the domain** at <https://resend.com/domains>: add the domain (or a subdomain such as
   `mail.shopdaddy-studio.com`) and create the DNS records Resend shows (SPF, DKIM). Until the domain is verified,
   Resend rejects every email and the endpoint returns `502`.
2. **Create an API key** at <https://resend.com/api-keys> with permission **Sending access**, optionally restricted to
   that domain. Put it in `RESEND_API_KEY`. The key is shown only once.
3. Set `MAIL_FROM_EMAIL` to any address on the verified domain — it does not need a real mailbox, because replies go
   to the visitor (Reply-To), not to the sender.

The key is read only in `src/config/env.config.ts` and is never written to logs, errors or responses. Keep it in the
platform's secret store, never in git.

---

## The email

| Part     | Value                                                                             |
| -------- | --------------------------------------------------------------------------------- |
| From     | `MAIL_FROM_NAME <MAIL_FROM_EMAIL>`                                                |
| To       | `MAIL_TO`                                                                         |
| Reply-To | the `email` from the form                                                         |
| Subject  | `New custom order request from <name>`                                            |
| Body     | HTML (Shopdaddy Studio branding) + a plain-text alternative with the same content |
| Files    | the logo as a regular attachment, under its original file name                    |

The HTML body has, in this order: the title with the submission time (UTC), **Name**, **Email**, **Came from**
(only when `previousPage` is a valid URL), **Terms** (`Accepted` / `Not accepted`), then the **Message**,
**Products** and **Links** sections (each only when not empty) and a **Logo** section with the file name, type and
size, or `none`.

The markup is plain table-based HTML with inline styles, built by small helpers in `src/templates/`:

- `email-blocks.template.ts` — reusable blocks (title, detail rows, sections, lists, links, buttons, text);
- `email-layout.template.ts` — the HTML document, the brand logo and the content card;
- `contact-form-email.template.ts` — the contact form email: subject, HTML and plain text.

Colors, fonts and the brand logo URL are in `src/constants/email.constant.ts`. Every value from the form is
HTML-escaped; only the blocks insert markup.

---

## API

| Method | Path                | Result                                               |
| ------ | ------------------- | ---------------------------------------------------- |
| `GET`  | `/health`           | Liveness check, no external calls                    |
| `POST` | `/api/contact-form` | Sends the submission by email through Resend → `201` |

### `GET /health`

```bash
curl -s http://localhost:3000/health
```

```json
{ "success": true, "data": { "status": "ok", "uptime": 1284.517 } }
```

### Form fields

The endpoint accepts `multipart/form-data`, `application/json` and `application/x-www-form-urlencoded` with exactly
the fields the storefront form sends. Any other field is ignored.

| Field              | Required | Notes                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | ✅       | Whitespace runs and line breaks collapsed into one space, non-empty. Used in the subject                                                                                                                                                                                                                                                                 |
| `email`            | ✅       | Visitor address; becomes the email **Reply-To**                                                                                                                                                                                                                                                                                                          |
| `message`          | —        | Line breaks preserved, max 10 000 characters                                                                                                                                                                                                                                                                                                             |
| `selectedProducts` | —        | JSON string of `[{ "name", "variant", "url" }]`. `url` is usually relative (`/products/<handle>?variant=<id>`) and is resolved against `SHOPIFY_STORE_URL`; a URL pointing to another site is dropped. Items without a `name` are skipped                                                                                                                |
| `linkList`         | —        | JSON array of links, as typed in the "Add a product link" field (a single bare link, a repeated field or a real array in JSON are also accepted). A link without a scheme (`example.com/item`) gets `https://`. Only `http(s)` links with a domain and without credentials are kept; duplicates removed, at most 128 links, each at most 2048 characters |
| `logo`             | —        | **One** file, see [Logo rules](#logo-rules)                                                                                                                                                                                                                                                                                                              |
| `terms`            | —        | Checkbox; `on` (also `true` / `1` / `yes`) → accepted, anything else or missing → not accepted                                                                                                                                                                                                                                                           |
| `previousPage`     | —        | Hidden input with `document.referrer`. Only an absolute `http(s)` URL is kept; any other value is silently ignored                                                                                                                                                                                                                                       |

### Logo rules

- Field name **`logo`**, at most **one** file. A second file or a file under any other field name returns `400`.
- Allowed extensions (case-insensitive): **EPS, AI, PSD, PDF, SVG, JPG, JPEG, PNG**. The type is decided by the
  **extension**, not by the browser's MIME type, because browsers send `application/octet-stream` for EPS/AI/PSD.
- Maximum size: **20 MB**. Resend caps a whole email at 40 MB after base64 encoding, which adds about a third.
- The file is attached to the email untouched and is never stored anywhere.

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
    "id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
    "sentAt": "2026-10-01T10:42:11.387Z",
    "productsCount": 1,
    "linksCount": 2,
    "attachmentsCount": 1
  }
}
```

`id` is the Resend email id — search for it in the Resend dashboard under **Emails** to see the delivery status.
`productsCount` and `linksCount` count what was actually put into the email, after invalid values were dropped.

### Errors

| Status | When                                                   | Body                                                                                                                              |
| ------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Payload failed validation                              | `{ "success": false, "message": "Validation failed", "errors": { "formErrors": [], "fieldErrors": { … } } }`                      |
| `400`  | Logo has a disallowed extension                        | `{ "success": false, "message": "The logo must be one of these file types: EPS, AI, PSD, PDF, SVG, JPG, JPEG, PNG", … }`          |
| `400`  | Logo too large                                         | `{ "success": false, "message": "The logo file is too large, the maximum is 20 MB", "errors": { "code": "LIMIT_FILE_SIZE", … } }` |
| `400`  | More than one file, or a file outside the `logo` field | `{ "success": false, "message": "Only one file can be uploaded, in the \"logo\" field", "errors": { … } }`                        |
| `502`  | Resend rejected the email or is unreachable            | `{ "success": false, "message": "Failed to send the contact form email", "errors": { "code": "validation_error" } }`              |
| `500`  | Anything unexpected                                    | `{ "success": false, "message": "<error message, else Internal error>", "errors": {} }`                                           |

For `502`, `errors.code` is the Resend error name (`validation_error`, `invalid_api_key`, `rate_limit_exceeded`,
`daily_quota_exceeded`, `application_error` for network failures, …). Resend's full error message is written to the
server log as `[MAIL] Resend rejected the contact form email — …` and is not sent to the browser.

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
├── api/               # Resend client
├── config/            # the only place dotenv and process.env are touched
├── constants/         # logo upload rules, form limits, email colors / fonts / brand
├── controllers/       # health check, send contact form
├── enums/             # Environment
├── exceptions/        # ApiError + status factories
├── middlewares/       # cors, json, urlencoded, logo upload, success wrapper, error handler
├── routes/            # GET /health, POST /api/contact-form
├── services/          # send the contact form email through Resend
├── templates/         # HTML email helpers: blocks, layout, the contact form email
├── types/             # ContactFormPayload, SelectedProduct, MailAttachment, ContactFormEmail
├── utils/             # pure helpers (parsing, escaping, formatting, URL normalization, payload builder)
└── validators/        # zod schemas for env and for the contact form payload
```

Every directory exposes an `index.ts` barrel and is imported through a path alias
(`@config`, `@utils`, `@services`, …) — never through a relative path across directories.

---

## Deployment

```bash
npm ci
npm run build
npm start          # serves dist/src/server.js
```

Checklist:

- Verify the sending domain in Resend before the first deploy (see [Resend setup](#resend-setup)).
- Set `NODE_ENV=production` and pin `AVAILABLE_ORIGINS` to your storefront origins — do not ship `*`.
  In `development` the Resend SDK also prints its own `[Resend API Error]` lines.
- Provide the environment variables through the platform's secret store. `.env` is git-ignored and is a
  local-development convenience only.
- Allow request bodies of 20 MB on the proxy in front of the server (the logo upload).
- Point the platform health check at `GET /health`. It performs no Resend call, so it stays green during a Resend
  outage while submissions correctly return `502`.
- Outbound HTTPS to `api.resend.com` must be open.
- Logs: the startup line with the port, one `[MAIL] Contact form email sent — id: …` line per submission, and
  `[ERROR] …` for every failed request.
- Once this version is live, the Shopify Flow workflow "Metaobject entry created → Send internal email" no longer
  fires (no entries are created) and can be turned off. The metaobject definition can stay in Shopify untouched.
