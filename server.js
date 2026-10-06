// Jaypee Assist - zero-dependency Node server (JSON file storage). Emails use nodemailer if installed + SMTP env vars set.
const http = require('http'), fs = require('fs'), path = require('path');
let mailer = null; try { const n = require('nodemailer'); if (process.env.SMTP_HOST) mailer = n.createTransport({ host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT || 587, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }) } catch (e) { }
const F = path.join(__dirname, 'data.json');
const db = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F)) : { complaints: [], lost: [], sos: [], outbox: [] };
const save = () => fs.writeFileSync(F, JSON.stringify(db, null, 1));
function mail(to, subject, text) {
  db.outbox.unshift({ to, subject, text, at: new Date().toISOString(), sent: !!mailer }); console.log(`[EMAIL] to ${to}: ${subject}`);
  if (mailer) mailer.sendMail({ from: process.env.SMTP_USER, to, subject, text }).catch(e => console.log('mail error', e.message))
}
http.createServer((q, r) => {
  let b = ''; q.on('data', d => b += d); q.on('end', () => {
    const u = q.url.split('?')[0], send = (o, c = 200) => { r.writeHead(c, { 'Content-Type': 'application/json' }); r.end(JSON.stringify(o)) };
    if (u.startsWith('/api/')) {
      const [, , coll, id] = u.split('/'); if (!db[coll]) return send({ error: 'not found' }, 404); const body = b ? JSON.parse(b) : {};
      if (q.method === 'GET') return send(db[coll]);
      if (q.method === 'POST') {
        const o = { ...body, id: Date.now().toString(36), createdAt: new Date().toISOString() };
        if (coll === 'complaints') { o.status = 'Open'; o.history = [{ s: 'Open', at: o.createdAt }]; mail(o.email, `Complaint #${o.id} received`, `Your ${o.category} complaint (${o.loc}) was registered with priority ${o.priority}.`) }
        db[coll].unshift(o); save(); return send(o)
      }
      if (q.method === 'PATCH') {
        const o = db[coll].find(x => x.id === id); if (!o) return send({}, 404);
        if (body.assignedTo && o.status === 'Open' && !body.status) body.status = 'Assigned';
        const ch = []; if (body.status && body.status !== o.status) { ch.push('Status: ' + body.status); o.history.push({ s: body.status, at: new Date().toISOString() }) }
        if (body.assignedTo && body.assignedTo !== o.assignedTo) ch.push('Assigned to: ' + body.assignedTo);
        if (body.priority && body.priority !== o.priority) ch.push('Priority changed to: ' + body.priority);
        Object.assign(o, body); if (ch.length) mail(o.email, `Update on complaint #${o.id}`, ch.join('\n')); save(); return send(o)
      }
    }
    fs.readFile(path.join(__dirname, 'public', u === '/' ? 'index.html' : path.basename(u)), (e, d) => { if (e) { r.writeHead(404); return r.end('404') } r.writeHead(200, { 'Content-Type': 'text/html' }); r.end(d) })
  })
}).listen(process.env.PORT || 3000, () => console.log('Jaypee Assist running at http://localhost:' + (process.env.PORT || 3000)));
