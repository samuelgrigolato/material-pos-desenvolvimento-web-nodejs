

/**
 * Compara os itens entre origem e destino, executando as seguintes ações:
 * 
 * - "criar" é chamado sempre que um item é encontrado em origem e não em destino.
 * - "atualizar" é chamado sempre que um item é encontrado dos dois lados.
 * - "remover" é chamado sempre que um item está no destino mas não está na origem.
 * 
 * A igualdade entre itens é decidida através de uma chamada ao método "saoIguais".
 * 
 * Os vetores originais não são modificados.
 */
module.exports.mesclar = async (origem, destino, saoIguais, criar, atualizar, remover) => {
    const restantes = [].concat(destino);
    for (const x of origem) {
        let indiceDoExistente = -1;
        for (let i = 0; i < restantes.length; i++) {
            if (saoIguais(x, restantes[i])) {
                indiceDoExistente = i;
                break;
            }
        }
        if (indiceDoExistente >= 0) {
            await atualizar(x, restantes[indiceDoExistente]);
            restantes.splice(indiceDoExistente, 1);
        } else {
            await criar(x);
        }
    }
    for (const x of restantes) {
        await remover(x);
    }
}
