import { SmtpClient, parseAddress } from "./smtp.ts";
import { assertEquals } from "https://deno.land/std@0.138.0/testing/asserts.ts";

Deno.test("parse adresses (MAIL FROM, RCPT TO and DATA commands)", () => {
    const [e1, e2] = parseAddress("Deno Land <root@deno.land>");
    assertEquals([e1, e2], ["<root@deno.land>", "Deno Land <root@deno.land>"]);

    const [e3, e4] = parseAddress("root@deno.land");
    assertEquals([e3, e4], ["<root@deno.land>", "<root@deno.land>"]);
});

Deno.test('Send Mail', async () => {
    const tls = true;
    const client = new SmtpClient();
    const config = {
        hostname: 'smtp.gmail.com',
        port: 465,
        username: 'contact@peoplemart.io',
        password: 'PeopleMart@2022!',
    };
    if (tls) {
        await client.connectTLS(config);
    } else {
        await client.connect(config);
    }

    await client.send({
        from: 'PeopleMartDAO <contact@peoplemart.io>',
        to: 'sovar.he@gmail.com',
        subject: "Deno Smtp build Success" + Math.random() * 1000,
        content: "plain text email",
        html: `
  <!DOCTYPE html>
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
      </html>
  `,
    });

    client.close();
});