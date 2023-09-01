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
        content: `<h1>Success</h1>
          <p>Build succeed!</p>
          <p>${new Date()}</p>`,
    });

    await client.close();
});