import { Status } from 'https://deno.land/std@0.138.0/http/http_status.ts';
import { serve } from "https://deno.land/std@0.138.0/http/server.ts";
import { ConnectConfig, SendConfig, SmtpClient } from "./smtp.ts"

interface mailBody {
    tls: boolean;
    connect: ConnectConfig;
    mail: SendConfig;
}

export async function handler(req: Request) {
    try {
        const body = (await req.json()) as mailBody;
        const client = new SmtpClient();
        if (body.tls) await client.connectTLS(body.connect);
        else await client.connect(body.connect);
        await client.send(body.mail);
        client.close();
        return new Response(undefined, { status: Status.OK });
    } catch (e) {
        console.log(e);
        return new Response(JSON.stringify(e), { status: Status.InternalServerError });
    }
}

if (import.meta.main) await serve(handler, { port: 80 });
