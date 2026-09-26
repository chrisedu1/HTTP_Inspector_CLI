const API = '/alumnos';
const API_KEY = 'umg-2026';

// Helper: cabeceras para las peticiones
const cabeceras = (conJson = true) => ({
    ...(conJson ? { 'Content-Type': 'application/json' } : {}),
    'x-api-key': API_KEY,
});

let idEnEdicion = null;
let idAEliminar = null;

/**
 * GET /alumnos y pinta las filas en la tabla.
 */
async function cargarAlumnos() {
    try {
        const res = await fetch(API);
        const alumnos = await res.json();
        const tabla = document.querySelector('#tablaAlumnos tbody');
        if (!tabla) return;

        tabla.innerHTML = '';

        alumnos.forEach((alumno) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${alumno.id}</td>
                <td>${alumno.nombre}</td>
                <td>${alumno.apellido}</td>
                <td>${alumno.email}</td>
                <td>${alumno.edad ?? ''}</td>
                <td>
                    <button class="btn-editar">Editar</button>
                    <button class="btn-eliminar">Eliminar</button>
                </td>
            `;

            const btnEditar = tr.querySelector('.btn-editar');
            const btnEliminar = tr.querySelector('.btn-eliminar');

            if (btnEditar) btnEditar.addEventListener('click', () => abrirDialogoEditar(alumno.id));
            if (btnEliminar) btnEliminar.addEventListener('click', () => abrirDialogoEliminar(alumno.id));

            tabla.appendChild(tr);
        });
    } catch (error) {
        mostrarMensaje('Error al cargar la lista', 'error');
    }
}

/**
 * Abre el diálogo de formulario para crear un nuevo alumno.
 */
function abrirDialogoNuevo() {
    const form = document.querySelector('#formAlumno');
    const dialogoForm = document.querySelector('#dialogoForm');
    const tituloForm = document.querySelector('#tituloForm');

    if (form) form.reset();
    idEnEdicion = null;
    if (tituloForm) tituloForm.textContent = 'Nuevo alumno';
    
    if (dialogoForm) {
        if (typeof dialogoForm.showModal === 'function') {
            dialogoForm.showModal();
        } else {
            dialogoForm.setAttribute('open', '');
        }
    }
}

/**
 * Precarga los datos del alumno y abre el diálogo de edición.
 */
async function abrirDialogoEditar(id) {
    try {
        const res = await fetch(`${API}/${id}`);
        if (!res.ok) throw new Error();
        const alumno = await res.json();

        idEnEdicion = id;
        const form = document.querySelector('#formAlumno');
        const tituloForm = document.querySelector('#tituloForm');
        const dialogoForm = document.querySelector('#dialogoForm');

        if (tituloForm) tituloForm.textContent = 'Editar alumno';

        if (form) {
            if (form.nombre) form.nombre.value = alumno.nombre || '';
            if (form.apellido) form.apellido.value = alumno.apellido || '';
            if (form.email) form.email.value = alumno.email || '';
            if (form.edad) form.edad.value = alumno.edad ?? '';
        }

        if (dialogoForm) {
            if (typeof dialogoForm.showModal === 'function') {
                dialogoForm.showModal();
            } else {
                dialogoForm.setAttribute('open', '');
            }
        }
    } catch (error) {
        mostrarMensaje('Error al cargar el alumno', 'error');
    }
}

/**
 * Guarda o actualiza un alumno mediante POST o PUT.
 */
async function guardarAlumno(event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    const form = document.querySelector('#formAlumno');
    if (!form) return;

    const datos = {
        nombre: form.nombre ? form.nombre.value.trim() : '',
        apellido: form.apellido ? form.apellido.value.trim() : '',
        email: form.email ? form.email.value.trim() : '',
        edad: form.edad && form.edad.value !== '' ? Number(form.edad.value) : undefined
    };

    const url = idEnEdicion ? `${API}/${idEnEdicion}` : API;
    const method = idEnEdicion ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: cabeceras(true),
            body: JSON.stringify(datos)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || errData.mensaje || 'Error al guardar');
        }

        const dialogoForm = document.querySelector('#dialogoForm');
        if (dialogoForm) {
            if (typeof dialogoForm.close === 'function') {
                dialogoForm.close();
            } else {
                dialogoForm.removeAttribute('open');
            }
        }

        await cargarAlumnos();
        mostrarMensaje(idEnEdicion ? 'Alumno actualizado con éxito' : 'Alumno creado con éxito', 'ok');
    } catch (error) {
        mostrarMensaje(error.message, 'error');
    }
}

/**
 * Prepara y muestra el diálogo de confirmación de eliminación.
 */
async function abrirDialogoEliminar(id) {
    idAEliminar = id;
    const dialogoEliminar = document.querySelector('#dialogoEliminar');
    const nombreEliminar = document.querySelector('#nombreEliminar');

    try {
        const res = await fetch(`${API}/${id}`);
        if (res.ok) {
            const alumno = await res.json();
            if (nombreEliminar) nombreEliminar.textContent = `${alumno.nombre} ${alumno.apellido}`;
        }
    } catch (_) {}

    if (dialogoEliminar) {
        if (typeof dialogoEliminar.showModal === 'function') {
            dialogoEliminar.showModal();
        } else {
            dialogoEliminar.setAttribute('open', '');
        }
    }
}

/**
 * Ejecuta la llamada DELETE a la API.
 */
async function confirmarEliminacion() {
    if (!idAEliminar) return;

    try {
        const res = await fetch(`${API}/${idAEliminar}`, {
            method: 'DELETE',
            headers: cabeceras(false)
        });

        if (!res.ok) throw new Error('Error al eliminar');

        const dialogoEliminar = document.querySelector('#dialogoEliminar');
        if (dialogoEliminar) {
            if (typeof dialogoEliminar.close === 'function') {
                dialogoEliminar.close();
            } else {
                dialogoEliminar.removeAttribute('open');
            }
        }

        await cargarAlumnos();
        mostrarMensaje('Alumno eliminado con éxito', 'ok');
    } catch (error) {
        mostrarMensaje('Error al eliminar el alumno', 'error');
    }
}

/**
 * Muestra el mensaje de resultado (éxito o error).
 */
function mostrarMensaje(texto, tipo = 'ok') {
    const mensaje = document.querySelector('#mensaje');
    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.className = tipo === 'error' ? 'mensaje-error' : 'mensaje-ok';

    setTimeout(() => {
        if (mensaje) mensaje.textContent = '';
    }, 3000);
}

// Inicialización de eventos
function inicializar() {
    const btnNuevo = document.querySelector('#btnNuevo');
    const formAlumno = document.querySelector('#formAlumno');
    const btnCancelarForm = document.querySelector('#btnCancelarForm');
    const btnCancelarEliminar = document.querySelector('#btnCancelarEliminar');
    const btnConfirmarEliminar = document.querySelector('#btnConfirmarEliminar');

    if (btnNuevo) btnNuevo.addEventListener('click', abrirDialogoNuevo);
    if (formAlumno) formAlumno.addEventListener('submit', guardarAlumno);
    
    if (btnCancelarForm) {
        btnCancelarForm.addEventListener('click', () => {
            const d = document.querySelector('#dialogoForm');
            if (d) typeof d.close === 'function' ? d.close() : d.removeAttribute('open');
        });
    }

    if (btnCancelarEliminar) {
        btnCancelarEliminar.addEventListener('click', () => {
            const d = document.querySelector('#dialogoEliminar');
            if (d) typeof d.close === 'function' ? d.close() : d.removeAttribute('open');
        });
    }

    if (btnConfirmarEliminar) btnConfirmarEliminar.addEventListener('click', confirmarEliminacion);

    cargarAlumnos();
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
}