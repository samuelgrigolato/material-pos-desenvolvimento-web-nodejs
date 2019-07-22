const nodemailer = require('nodemailer');


let _transporter;

async function getTransporter() {
    if (!_transporter) {
        const testAccount = await nodemailer.createTestAccount();
        _transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
        });
    }
    return _transporter;
}

module.exports.enviar = async function (assunto, texto, para) {
    const transporter = await getTransporter();
    let info = await transporter.sendMail({
        from: '"Equipe de Cotação" <contato@exemplo.com>',
        to: para,
        subject: assunto,
        text: texto
    });
    console.log("URL de pré-visualização: %s", nodemailer.getTestMessageUrl(info));
};
