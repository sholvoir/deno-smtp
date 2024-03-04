const deploy = async () => {
    const jsr = JSON.parse(await Deno.readTextFile('./jsr.json'));
    const m = jsr.version as string;
    const version = m.split('.').map(i=>+i);
    let success = (await new Deno.Command('deno', { args: ['bundle', 'server.ts', 'server.js']}).output()).success;
    if (!success) return console.error('Deno bundle error.'); else console.log('Deno bundle success!');
    success = (await new Deno.Command('docker', { args: ['build', '-t', `sholvoir/mail:${m}`, '.']}).output()).success;
    if (!success) return console.error('Docker build error.'); else console.log('Docker build success!');
    success = (await new Deno.Command('docker', { args: ['push', `sholvoir/mail:${m}`]}).output()).success;
    if (!success) return console.error('Docker push error.'); else console.log('Docker push success!');
    success = (await new Deno.Command('docker', { args: ['tag', `sholvoir/mail:${m}`, 'sholvoir/mail:latest']}).output()).success;
    if (!success) return console.error('Docker tag error'); else console.log('Docker tag success!');
    success = (await new Deno.Command('docker', { args: ['push', 'sholvoir/mail:latest']}).output()).success;
    if (!success) return console.error('Docker push latest error.'); else console.log('Docker push latest success!');
    version[version.length - 1]++;
    jsr.version = version.join('.');
    await Deno.writeTextFile('./jsr.json', JSON.stringify(jsr, undefined, 4));
    await Deno.remove('./server.js');
    console.log('Done!');
}
if (import.meta.main) await deploy();