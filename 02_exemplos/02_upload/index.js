const express = require('express');
const fileUpload = require('express-fileupload');
const sharp = require('sharp');
const app = express();

app.use(express.static('public'));
app.use(express.json());

app.use(fileUpload({
    limits: {
        fileSize: 50 * 1024 * 1024 // 50mb
    }
}));

app.post('/upload', (req, res) => {
    const imagem = req.files.imagem;
    const { cropx, cropy, cropwidth, cropheight } = req.body;

    sharp(imagem.data)
        .extract({
            top: parseInt(cropy),
            left: parseInt(cropx),
            height: parseInt(cropheight),
            width: parseInt(cropwidth)
        })
        .toFile('resultado.png')
        .then(() => res.send())
        .catch(err => {
            console.error(err);
            res.status(500).send();
        });

});

app.listen(3000);
