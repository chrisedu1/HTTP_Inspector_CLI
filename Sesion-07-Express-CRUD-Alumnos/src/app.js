/**
 * app.js — Servidor Express (API REST + sitio estático)
 * Tarea Sesión 7 · Desarrollo Web · UMG
 */

import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RepositorioAlumnos } from './repositorio.js';

// __dirname en ES Modules
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// ============================================================
// MIDDLEWARES
// ============================================================

/**
 * "Autenticación falsa": exige el header `x-api-key`.
 * @type {import('express').RequestHandler}
 */
export function autenticacionFalsa(req, res, next) {
    const clave = req.get('x-api-key');
    const claveValida = process.env.API_KEY ?? 'umg-2026';

    if (!clave || clave !== claveValida) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
}

/**
 * Validación básica del cuerpo de un alumno.
 * @type {import('express').RequestHandler}
 */
export function validarAlumno(req, res, next) {
    const { nombre, apellido, email, edad } = req.body;

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (!apellido || typeof apellido !== 'string' || !apellido.trim()) {
        return res.status(400).json({ error: 'El apellido es obligatorio' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'El email debe incluir "@"' });
    }
    if (edad !== undefined && edad !== null && edad !== '') {
        const edadNum = Number(edad);
        if (isNaN(edadNum) || edadNum < 0) {
            return res.status(400).json({ error: 'La edad debe ser un número >= 0' });
        }
    }

    next();
}

// ============================================================
// APP
// ============================================================

/**
 * Crea la app de Express con sus rutas.
 * Recibe el repositorio por parámetro (inyección de dependencias).
 *
 * @param {import('./repositorio.js').RepositorioAlumnos} repositorio
 * @returns {import('express').Express}
 */
export function crearApp(repositorio) {
    const app = express();

    // Middlewares base
    app.use(express.json());

    // Sitio web estático (public/index.html, styles.css, app.js)
    app.use(express.static(join(__dirname, '..', 'public')));

    // GET /alumnos → lista todos
    app.get('/alumnos', (req, res) => {
        res.json(repositorio.listar());
    });

    // GET /alumnos/:id → uno o 404
    app.get('/alumnos/:id', (req, res) => {
        const alumno = repositorio.obtener(req.params.id);
        if (!alumno) {
            return res.status(404).json({ error: 'Alumno no encontrado' });
        }
        res.json(alumno);
    });

    // POST /alumnos → crear
    app.post('/alumnos', autenticacionFalsa, validarAlumno, (req, res) => {
        const nuevo = repositorio.crear(req.body);
        res.status(201).json(nuevo);
    });

    // PUT /alumnos/:id → actualizar
    app.put('/alumnos/:id', autenticacionFalsa, validarAlumno, (req, res) => {
        const actualizado = repositorio.actualizar(req.params.id, req.body);
        if (!actualizado) {
            return res.status(404).json({ error: 'Alumno no encontrado' });
        }
        res.json(actualizado);
    });

    // DELETE /alumnos/:id → eliminar
    app.delete('/alumnos/:id', autenticacionFalsa, (req, res) => {
        const eliminado = repositorio.eliminar(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Alumno no encontrado' });
        }
        res.status(204).send();
    });

    return app;
}

export const repo = new RepositorioAlumnos();
export const app = crearApp(repo);