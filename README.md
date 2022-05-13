## Deno SMTP mail client

### Example

```ts
import { SmtpClient } from "https://raw.githubusercontent.com/sholvoir/deno-smtp/master/smtp.ts";

const client = new SmtpClient();

await client.connect({
  hostname: "smtp.163.com",
  port: 25,
  username: "username",
  password: "password",
});

await client.send({
  from: "mailaddress@163.com",
  to: "to-address@xx.com",
  subject: "Mail Title",
  content: "Mail Content",
  html: "<a href='https://github.com'>Github</a>",
});

await client.close();
```

#### TLS connection

```ts
await client.connectTLS({
  hostname: "smtp.163.com",
  port: 465,
  username: "username",
  password: "password",
});
```

#### Use in Gmail

```ts
await client.connectTLS({
  hostname: "smtp.gmail.com",
  port: 465,
  username: "your username",
  password: "your password",
});

await client.send({
  from: "someone@163.com", // Your Email address
  to: "someone@xx.com", // Email address of the destination
  subject: "Mail Title",
  content: "Mail Content，maybe HTML",
});

await client.close();
```

### Configuring your client

You can pass options to your client through the `SmtpClient` constructor.

```ts
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

//Defaults
const client = new SmtpClient({
  content_encoding: "quoted-printable", // 7bit, 8bit, base64, binary, quoted-printable
});
```
