import "std/dotenv/load.ts";
import { SmtpClient } from "./smtp.ts";

Deno.test('Send Mail', async () => {
    const client = new SmtpClient(true);
    const config = {
        hostname: Deno.env.get('MAIL_SERVER')!,
        port: +(Deno.env.get('MAIL_PORT') ?? 465),
        username: Deno.env.get('MAIL_USER')!,
        password: Deno.env.get('MAIL_PASS')!,
    };
    await client.connect(config);

    await client.send({
        from: config.username,
        to: Deno.env.get('MAIL_TO_USER')!,
        subject: `Deno Smtp build Success ${Date.now()}`,
        content: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="X-UA-Compatible" content="ie=edge" />
          <title>Deno Smtp build Success</title>
        </head>
        <body>
          <h1>Success</h1>
          <p>Build succeed!</p>
          <p>${new Date()}</p>
        </body>
      </html>`,
    });

    await client.close();
});