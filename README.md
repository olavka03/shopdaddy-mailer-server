# Contact Form Mailer Server

A small Express 5 + TypeScript service with one job: take a website contact form submission — including file
uploads and pre-selected products — render it into a polished HTML email, and deliver it to a single admin
mailbox over SMTP.

No database, no auth, no queue. One request in, one email out.

- Accepts `multipart/form-data`, `application/json` and `application/x-www-form-urlencoded`
- Uploads held in memory and attached directly to the email (images previewed inline via `cid:`)
- Pre-selected products parsed from a JSON string, with relative product URLs resolved to absolute
- Captures the page the visitor submitted from and links to it prominently in the email
- Any unknown form field is picked up automatically and rendered in an "Additional fields" table

---

## Requirements

| Tool         | Version                                                            |
| ------------ | ------------------------------------------------------------------ |
| Node.js      | 20 or newer                                                        |
| npm          | 9 or newer                                                         |
| SMTP mailbox | Gmail with 2-Step Verification + an app password, or any SMTP host |

---

## Quick start

```bash
git clone <repo-url> contact-form-server
cd contact-form-server
npm install
cp .env.example .env   # then fill in the mail credentials
npm run dev
```

Verify it is up:

```bash
curl -s http://localhost:3000/health
# {"success":true,"data":{"status":"ok","uptime":2.13}}
```

On startup the server also runs an SMTP handshake and logs the result, so bad credentials show up in the
console immediately instead of on the first real submission.

---

## Environment variables

Copy `.env.example` to `.env`. Every variable is validated with zod at startup — a missing or malformed value
crashes the process before it binds a port.

| Variable              | Required | Default                       | Description                                                                                                            |
| --------------------- | -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `PORT`                | ✅       | —                             | HTTP port, 1–65535                                                                                                     |
| `NODE_ENV`            | ✅       | —                             | `development` or `production`                                                                                          |
| `AVAILABLE_ORIGINS`   | —        | `*`                           | Comma-separated allowed CORS origins, or `*`                                                                           |
| `SHOPIFY_STORE_URL`   | ✅       | —                             | Storefront base URL, e.g. `https://shopdaddy-studio.com`. Relative product links from the form are resolved against it |
| `MAIL_HOST`           | —        | `smtp.gmail.com`              | SMTP host                                                                                                              |
| `MAIL_PORT`           | —        | `465`                         | SMTP port                                                                                                              |
| `MAIL_SECURE`         | —        | `true`                        | `true` for implicit TLS (465), `false` for STARTTLS (587)                                                              |
| `MAIL_USER`           | ✅       | —                             | **Sender mailbox** — the account we authenticate as and send from                                                      |
| `MAIL_APP_PASSWORD`   | ✅       | —                             | App password for `MAIL_USER` (not the account password)                                                                |
| `MAIL_TO`             | ✅       | —                             | **The only recipient** — the admin who receives every submission                                                       |
| `MAIL_FROM_NAME`      | —        | `Contact Form`                | Display name on the From header                                                                                        |
| `MAIL_SUBJECT_PREFIX` | —        | `New contact form submission` | Prefix for the email subject                                                                                           |

`MAIL_USER` and `MAIL_TO` are two different roles and are often two different addresses: `MAIL_USER` is the
robot mailbox that sends, `MAIL_TO` is the human who reads. Setting them to the same address is fine.

Example `.env`:

```dotenv
PORT=3000
NODE_ENV=development

AVAILABLE_ORIGINS=https://shopdaddy-studio.com
SHOPIFY_STORE_URL=https://shopdaddy-studio.com

MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=robot@shopdaddy.studio
MAIL_APP_PASSWORD=abcd efgh ijkl mnop
MAIL_TO=admin@shopdaddy.studio
MAIL_FROM_NAME=Shopdaddy Contact Form
MAIL_SUBJECT_PREFIX=New contact form submission
```

### Gmail app password walkthrough

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

## Scripts

| Script           | Command                                     | Purpose                                                       |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `npm run dev`    | `nodemon` + `ts-node` with `tsconfig-paths` | Development server with reload on `src/` changes              |
| `npm run build`  | `tsc && tsc-alias`                          | Compile to `dist/` and rewrite path aliases to relative paths |
| `npm start`      | `node dist/src/server.js`                   | Run the compiled build (production)                           |
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
├── api/               # nodemailer SMTP transporter
├── config/            # the only place dotenv and process.env are touched
├── constants/         # upload limits, allowed MIME types, known field names, email palette
├── controllers/       # health check, send contact form
├── enums/             # Environment
├── exceptions/        # ApiError + status factories
├── middlewares/       # cors, json, urlencoded, file upload, success wrapper, error handler
├── routes/            # GET /health, POST /api/contact-form
├── services/          # send the email, verify the transporter at startup
├── templates/         # HTML email layout + contact form email body
├── types/             # ContactFormPayload, SelectedProduct, MailAttachment, RequestSource
├── utils/             # pure helpers (parsing, escaping, formatting, URL resolution)
└── validators/        # zod schemas for env and for the contact form payload
```

Every directory exposes an `index.ts` barrel and is imported through a path alias (`@config`, `@utils`,
`@services`, …) — never through a relative path across directories.

---

## API

### `GET /health`

```bash
curl -s http://localhost:3000/health
```

```json
{ "success": true, "data": { "status": "ok", "uptime": 1284.517 } }
```

### `POST /api/contact-form`

| Field              | Required | Notes                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | ✅       | trimmed, non-empty                                                                                                                                                                                                                                                                                                                                                                                      |
| `email`            | ✅       | visitor address, becomes the email `replyTo`                                                                                                                                                                                                                                                                                                                                                            |
| `phone`            | —        | rendered as a `tel:` link                                                                                                                                                                                                                                                                                                                                                                               |
| `subject`          | —        | shown in the body                                                                                                                                                                                                                                                                                                                                                                                       |
| `message`          | —        | newlines preserved                                                                                                                                                                                                                                                                                                                                                                                      |
| `terms`            | —        | `on` / `true` / `1` → accepted                                                                                                                                                                                                                                                                                                                                                                          |
| `selectedProducts` | —        | JSON string or array of `{ name, variant?, url?, image?, price?, quantity?, sku? }`                                                                                                                                                                                                                                                                                                                     |
| `previousPage`     | —        | The **only** page URL the email reports. The page the visitor came from **before** the form page (`document.referrer`). Aliases: `previous_page`, `previousPageUrl`, `previous_page_url`, `previousUrl`, `previous_url`, `documentReferrer`, `document_referrer`, `referrer`, `referer`. Send it empty for a direct visit — the email then says so explicitly. The server cannot derive this on its own |
| any other field    | —        | rendered in the "Additional fields" table                                                                                                                                                                                                                                                                                                                                                               |
| any file field     | —        | up to 10 files, 10 MB each                                                                                                                                                                                                                                                                                                                                                                              |

Copy-pasteable example:

```bash
curl -X POST http://localhost:3000/api/contact-form \
  -H 'Referer: https://shopdaddy-studio.com/pages/contact' \
  -F 'name=Jane Doe' \
  -F 'email=jane.doe@example.com' \
  -F 'phone=+1 555 0100' \
  -F 'subject=Bulk order request' \
  -F 'message=Hi, I would like a quote for 200 units before the end of the month.' \
  -F 'terms=on' \
  -F 'company=Acme Interiors' \
  -F 'selectedProducts=[{"name":"Red Set of Thick Leather Coasters (5 pcs)","variant":"Red","url":"/products/set-of-thick-leather-coasters-5-pcs?_pos=1&variant=39382829957207"}]' \
  -F 'logo=@./brand-logo.png;type=image/png' \
  -F 'files[]=@./requirements.pdf;type=application/pdf'
```

```json
{
  "success": true,
  "data": {
    "messageId": "<f1b0c9e2-6c1d-4a3f-9a54-6b3a1f0d77c2@shopdaddy.studio>",
    "accepted": ["admin@shopdaddy.studio"],
    "sentAt": "2026-09-10T14:32:07.412Z",
    "productsCount": 1,
    "attachmentsCount": 2
  }
}
```

Allowed upload types: PNG, JPEG, GIF, WebP, SVG, PDF, TXT, CSV, DOC, DOCX. Raster images are additionally
previewed inline in the email.

### Errors

| Status | When                                               | Body                                                                                                         |
| ------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `400`  | Payload failed validation                          | `{ "success": false, "message": "Validation failed", "errors": { "formErrors": [], "fieldErrors": { … } } }` |
| `400`  | File too large, too many files, or disallowed type | `{ "success": false, "message": "Each file must be 10 MB or smaller", "errors": { … } }`                     |
| `502`  | SMTP refused or failed                             | `{ "success": false, "message": "Failed to send the contact form email", "errors": { "reason": "…" } }`      |
| `500`  | Anything unexpected                                | `{ "success": false, "message": "<error message, else Internal error>", "errors": {} }`                      |

---

## Deployment

```bash
npm ci
npm run build
npm start          # serves dist/src/server.js
```

Checklist:

- Set `NODE_ENV=production` and pin `AVAILABLE_ORIGINS` to your storefront origins — do not ship `*`.
- Provide the environment variables through the platform's secret store (Railway, Render, Fly, Heroku, Docker
  secrets). `.env` is git-ignored and is a local-development convenience only.
- Point the platform health check at `GET /health`. It performs no SMTP call, so it stays green during a mail
  outage while submissions correctly return 502.
- Outbound TCP to the SMTP port (465 or 587) must be open; some hosts block 25 and 587 by default.
- Only `dependencies` are needed at runtime; `devDependencies` can be pruned after `npm run build`.
- Logs: startup line with the port, the SMTP verification result, and `[ERROR] …` for every failed request.
