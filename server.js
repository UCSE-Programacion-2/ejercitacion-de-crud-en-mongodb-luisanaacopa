const express = require('express');
const { ObjectId } = require('mongodb');
const { client, connectDB, closeDB } = require('./src/mongodb');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

function validarEquipo(data) {
    return (
        typeof data.equipo === 'string'
        && typeof data.tecnico === 'string'
        && typeof data.continente === 'string'
        && typeof data.campeonatos_mundiales === 'number'
    );
}

app.use((req, res, next) => {
    req.db = client.db('MundialDB');
    req.collection = req.db.collection('equipos');
    next();
});

app.get('/equipos', async (req, res) => {
    const equipos = await req.collection.find().toArray();

    return res.status(200).json(equipos);
});

app.get('/equipos/buscar', async (req, res) => {
    const { tecnico } = req.query;

    const equipos = await req.collection.find({
        tecnico: {
            $regex: tecnico,
            $options: 'i',
        },
    }).toArray();

    return res.status(200).json(equipos);
});

app.get('/equipos/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({
            error: 'ID inválido',
        });
    }

    const equipo = await req.collection.findOne({
        _id: new ObjectId(id),
    });

    if (!equipo) {
        return res.status(404).json({
            error: 'Equipo no encontrado',
        });
    }

    return res.status(200).json(equipo);
});

app.post('/equipos', async (req, res) => {
    const nuevoEquipo = {
        equipo: req.body.equipo,
        tecnico: req.body.tecnico,
        continente: req.body.continente,
        campeonatos_mundiales: req.body.campeonatos_mundiales,
    };

    if (!validarEquipo(nuevoEquipo)) {
        return res.status(400).json({
            error: 'Datos inválidos',
        });
    }

    const resultado = await req.collection.insertOne(nuevoEquipo);

    return res.status(201).json({
        _id: resultado.insertedId,
        ...nuevoEquipo,
    });
});

app.put('/equipos/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({
            error: 'ID inválido',
        });
    }

    const equipoActualizado = {
        equipo: req.body.equipo,
        tecnico: req.body.tecnico,
        continente: req.body.continente,
        campeonatos_mundiales: req.body.campeonatos_mundiales,
    };

    if (!validarEquipo(equipoActualizado)) {
        return res.status(400).json({
            error: 'Datos inválidos',
        });
    }

    const resultado = await req.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: equipoActualizado }
    );

    if (resultado.matchedCount === 0) {
        return res.status(404).json({
            error: 'Equipo no encontrado',
        });
    }

    return res.status(200).json({
        mensaje: 'Equipo actualizado correctamente',
    });
});

app.delete('/equipos/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({
            error: 'ID inválido',
        });
    }

    const resultado = await req.collection.deleteOne({
        _id: new ObjectId(id),
    });

    if (resultado.deletedCount === 0) {
        return res.status(404).json({
            error: 'Equipo no encontrado',
        });
    }

    return res.status(200).json({
        mensaje: 'Equipo eliminado correctamente',
    });
});

if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
        });
    });
}

module.exports = { app, closeDB, client, connectDB };