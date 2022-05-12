import { serve } from "https://deno.land/std@0.138.0/http/server.ts";
import { Status } from 'https://deno.land/std@0.138.0/http/http_status.ts';
import { ConnectConfigWithAuthentication, SendConfig } from "./config.ts";
import { SmtpClient } from "./smtp.ts"

interface mailBody {
    tls: boolean;
    connect: ConnectConfigWithAuthentication;
    mail: SendConfig;
}

await serve(async (req: Request) => {
    try {
        const body = (await req.json()) as mailBody;
        const client = new SmtpClient();
        if (body.tls) await client.connectTLS(body.connect);
        else await client.connect(body.connect);
        await client.send(body.mail);
        await client.close();
        return new Response(undefined, { status: Status.OK });
    } catch (e) {
        return new Response(JSON.stringify(e), { status: Status.InternalServerError });
    }
}, { port: 80 });