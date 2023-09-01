import { TextLineStream } from "std/streams/text_line_stream.ts";

export interface ConnectConfig {
    hostname: string;
    port?: number;
    username: string;
    password: string;
}

export interface SendConfig {
    to: string;
    from: string;
    date?: string;
    subject: string;
    content: string;
}

const encoder = new TextEncoder();
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
    #reader: ReadableStreamDefaultReader<string> | undefined;
    #writer: WritableStreamDefaultWriter<Uint8Array> | undefined;

    constructor(private console_debug = false) {}

    async connect(config: ConnectConfig) {
        this.#conn = await Deno.connectTls({hostname: config.hostname, port: config.port ?? 465});
        this.#reader = this.#conn.readable.pipeThrough(new TextDecoderStream())
            .pipeThrough(new TextLineStream({ allowCR: true })).getReader();
        this.#writer = this.#conn.writable.getWriter();

        await this.#writeReadAssert(undefined, CommandCode.READY);
        await this.#writeReadAssert(`EHLO ${config.hostname}`, CommandCode.OK);
        await this.#writeReadAssert("AUTH LOGIN", CommandCode.AUTHO_NEXT);
        await this.#writeReadAssert(btoa(config.username), CommandCode.AUTHO_NEXT);
        await this.#writeReadAssert(btoa(config.password), CommandCode.AUTHO_SUCCESS);
    }

    async close() {
        await this.#writeReadAssert('QUIT', CommandCode.BYE);
        while (true) {
            const r = await this.#reader?.read();
            if (r?.done) break;
        }
        await this.#reader?.cancel()
        await this.#writer?.close();
    }

    async send(config: SendConfig) {
        const [from, fromData] = this.#parseAddress(config.from);
        const [to, toData] = this.#parseAddress(config.to);
        const date = config.date ?? new Date().toString();

        await this.#writeReadAssert(`MAIL FROM: ${from}`, CommandCode.OK);
        await this.#writeReadAssert(`RCPT TO: ${to}`, CommandCode.OK);
        await this.#writeReadAssert("DATA", CommandCode.BEGIN_DATA);

        await this.#writeReadAssert(`Subject: ${config.subject}`);
        await this.#writeReadAssert(`From: ${fromData}`);
        await this.#writeReadAssert(`To: ${toData}`);
        await this.#writeReadAssert(`Date: ${date}`);
        await this.#writeReadAssert("MIME-Version: 1.0");
        await this.#writeReadAssert("Content-Type: text/html;charset=utf-8\r\n");
        await this.#writeReadAssert(config.content);
        await this.#writeReadAssert("\r\n.", CommandCode.OK);
    }

    #parseAddress(email: string): [string, string] {
        const m = email.toString().match(/(.*)\s<(.*)>/);
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
            while (true) {
                const result = await this.#reader.read();
                const line = result.value! as string;
                if (!line) throw new Error(`invalid cmd`);
                console.log(`--S: ${line}`);
                if (line.at(3) === '-') continue;
                const code = parseInt(line.slice(0, 3).trim());
                if (code != assert) throw new Error(`expect code: ${assert}, but get code: ${code}`);
                break;
            }
        }
    }
}
