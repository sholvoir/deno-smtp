## Deno SMTP mail client

Extreme Simple SMTPClient with no dependencies.

### Example

```ts
import { SmtpClient } from "https://deno.land/x/deno_esmtp/smtp.ts";

const client = new SmtpClient();

await client.connect({
  hostname: "smtp.gmail.com",
  port: 465,
  username: "username",
  password: "password",
});

await client.send({
  from: "you@gmail.com",
  to: "someone@xx.com",
  subject: "Mail Title",
  content: "<a href='https://github.com'>Github</a>",
});

await client.close();
```