import net from 'net';

const client = new net.Socket();
const host = 'aws-0-eu-west-1.pooler.supabase.com';
const port = 6543;

client.connect(port, host, () => {
    console.log('CONNECTED TO ' + host + ':' + port);
    client.destroy();
});

client.on('error', (err) => {
    console.error('CONNECTION ERROR: ' + err.message);
});
