const crypto = require('crypto');
const { Usuario } = require('../usuarios/usuarios-modelo');


const criptografar = senha => {
    const salt = 'segredo';
    let senhaCriptografada = `${salt}${senha}`;
    for (let i = 0; i < 10; i++) {
        senhaCriptografada = crypto.createHash('sha256')
            .update(senhaCriptografada)
            .digest();
    }
    return senhaCriptografada;
};


module.exports.credenciaisValidas = async (login, senha) => {
    const usuario = await Usuario.findOne({
        where: { login, senha: criptografar(senha) }
    });
    return !!usuario;
};
