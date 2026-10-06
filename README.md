# Jaypee Assist - Smart Campus Complaint System (prototype)
## Run
1. Install Node.js 16+ (https://nodejs.org)
2. `cd jaypee-assist` then `node server.js`
3. Open http://localhost:3000
- Student: any enrollment no. (e.g. 251b010) -> email 251b010@juetguna.in
- Staff: any ID, password `staff123`
## Real emails (optional)
`npm install nodemailer`, then set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and restart. Without it, emails are simulated: printed in the terminal and shown in Staff > Email log.
## Notes
Data is stored in data.json (delete it to reset). Edit the EM list in public/index.html to set real campus numbers (electrical and security currently dial 112).
