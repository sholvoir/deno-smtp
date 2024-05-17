import { IConfig } from "./iconfig.ts";
import { IMail } from "./imail.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

enum CommandCode {
    READY = 220,
    BYE = 221,
    AUTHO_SUCCESS = 235,
    OK = 250,
    AUTHO_NEXT = 334,
    BEGIN_DATA = 354,
    FAIL = 554
}

export class SmtpClient {
    #conn: Deno.Conn | undefined;
    #reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    #writer: WritableStreamDefaultWriter<Uint8Array> | undefined;

    constructor(private console_debug = false) {}

    async connect(config: IConfig) {
        this.#conn = await Deno.connectTls({hostname: config.hostname, port: config.mailPort});
        this.#reader = this.#conn.readable.getReader();
        this.#writer = this.#conn.writable.getWriter();

        await this.#writeReadAssert(undefined, CommandCode.READY);
        await this.#writeReadAssert(`EHLO ${config.hostname}`, CommandCode.OK);
        await this.#writeReadAssert("AUTH LOGIN", CommandCode.AUTHO_NEXT);
        await this.#writeReadAssert(btoa(config.username), CommandCode.AUTHO_NEXT);
        await this.#writeReadAssert(btoa(config.password), CommandCode.AUTHO_SUCCESS);
    }

    async close() {
        await this.#writeReadAssert('QUIT', CommandCode.BYE);
        await this.#writer?.close();
    }

    async send(mail: IMail) {
        const [from, fromData] = this.#parseAddress(mail.from);
        const [to, toData] = this.#parseAddress(mail.to);
        const date = mail.date ?? new Date().toString();

        await this.#writeReadAssert(`MAIL FROM: ${from}`, CommandCode.OK);
        await this.#writeReadAssert(`RCPT TO: ${to}`, CommandCode.OK);
        await this.#writeReadAssert("DATA", CommandCode.BEGIN_DATA);

        await this.#writeReadAssert(`Subject: ${mail.subject}`);
        await this.#writeReadAssert(`From: ${fromData}`);
        await this.#writeReadAssert(`To: ${toData}`);
        await this.#writeReadAssert(`Date: ${date}`);
        await this.#writeReadAssert("MIME-Version: 1.0");
        await this.#writeReadAssert("Content-Type: text/html;charset=utf-8\r\n");
        await this.#writeReadAssert(mail.content);
        await this.#writeReadAssert(".", CommandCode.OK);
    }

    #parseAddress(email: string): [string, string] {
        const m = email.toString().match(/(.*)\s*<(.*)>/);
        return m?.length === 3 ? [`<${m[2]}>`, email] : [`<${email}>`, `<${email}>`];
    }

    async #writeReadAssert(line?: string, assert?: CommandCode) {
        if (line) {
            if (!this.#writer) throw new Error('Not Ready!');
            if (this.console_debug) console.log(`--C: ${line}`);
            await this.#writer.ready;
            await this.#writer.write(encoder.encode(`${line}\r\n`));
        }
        if (assert) {
            if (!this.#reader) throw new Error('Not Ready!');
            const result = await this.#reader.read();
            const truck = decoder.decode(result.value).trim();
            if (!truck) throw new Error(`invalid cmd`);
            const lines = truck.split('\r\n');
            if (this.console_debug) for (const l of lines ) console.log(`--S: ${l}`);
            const code = parseInt(lines.at(-1)!.slice(0, 3).trim());
            if (code != assert) throw new Error(`expect code: ${assert}, but get code: ${code}`);
        }
    }
}
