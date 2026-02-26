/* ===================================================
   NÔEMA - CEREBRO DE ESTUDIO BÍBLICO (VERSIÓN DEFINITIVA)
   - Integración Doctrinal (Asambleas de Dios)
   - Memoria de Sesión (Recuerda al recargar)
   - Sistema Anti-Corte (Botón Continuar)
   - Reconocimiento de Usuario Mejorado
   =================================================== */

const NOEMA_OFFLINE = {
    "default": "Modo Local. Verifica tu conexión para usar la IA profunda."
};

const IA = {
    state: {
        // Al iniciar, intentamos recuperar la charla de la sesión actual
        history: JSON.parse(sessionStorage.getItem('noema_chat_memoria') || '[]')
    },

    // ----------------------------------------------------
    // 1. GESTIÓN DE IDENTIDAD Y MEMORIA
    // ----------------------------------------------------

    // Obtiene el nombre real del usuario (Lógica Robusta)
    obtenerNombreUsuario: () => {
        // 1. Intentar leer visualmente del Menú Lateral (Lo más seguro si ya iniciaste sesión)
        const nombreSidebar = document.getElementById('nombre-sidebar');
        if (nombreSidebar && nombreSidebar.innerText.trim() !== "" && nombreSidebar.innerText !== "Usuario") {
            return nombreSidebar.innerText;
        }

        // 2. Intentar leer del Saludo de Bienvenida
        const saludo = document.getElementById('saludo-usuario');
        if (saludo) {
            // Si dice "Hola Juan", extraemos "Juan"
            let texto = saludo.innerText.replace(/Hola|Bienvenido/gi, "").trim();
            if (texto.length > 0) return texto;
        }

        // 3. Intentar leer de la base de datos interna (LocalStorage)
        try {
            const perfil = JSON.parse(localStorage.getItem('noema_user_profile') || '{}');
            if (perfil.nombre && perfil.nombre.length > 0) {
                return perfil.nombre;
            }
        } catch (e) { }

        return "Hijo de Dios"; // Fallback por defecto
    },

    // Construye el cerebro teológico + instrucciones de trato
    // Construye el cerebro teológico + instrucciones de trato
obtenerSystemPrompt: () => {
    const nombreUser = IA.obtenerNombreUsuario();
    
    // 1. Definimos la restricción absoluta de contenido
    const restriccionesEstrictas = `
        ESTRICTAMENTE PARA ESTUDIO BÍBLICO:
        1. Tu conocimiento se limita EXCLUSIVAMENTE a la Biblia, Teología y Vida Cristiana.
        2. Si el usuario te pide algo ajeno a la Biblia (recetas, consejos técnicos, ciencia, ocio, etc.), DEBES responder: 
           "Como tu asistente de estudio bíblico, mi labor se limita a las Sagradas Escrituras. No puedo ayudarte con temas ajenos a la Palabra de Dios."
        3. NO intentes buscar una conexión bíblica forzada para temas mundanos (como recetas o chistes). No inventes.
        4. No sermonées por preguntas fuera de lugar, simplemente declina la respuesta amablemente.`;
    
    let basePrompt = "Eres Nôema, asistente bíblico especializado en Teología (Asambleas de Dios).";
    
    // Inyectamos la doctrina si el archivo doctrinas.js cargó bien
    if (typeof GeneradorTeologico !== 'undefined') {
        basePrompt = GeneradorTeologico.construirPrompt();
    }
    
    return `${basePrompt}
        
        ${restriccionesEstrictas}
        
        INSTRUCCIÓN DE INTERACCIÓN:
        El usuario se llama: "${nombreUser}".
        Dirígete a él por su nombre cuando sea natural, pero EVITA saludos repetitivos o introducciones largas.
        Ve directo a la respuesta teológica o bíblica para optimizar el tiempo.`;
},

    // Guarda el historial solo mientras la app esté abierta (seguridad)
    guardarMemoria: () => {
        sessionStorage.setItem('noema_chat_memoria', JSON.stringify(IA.state.history));
    },

    // ----------------------------------------------------
    // 2. FUNCIONES DE ANÁLISIS BÍBLICO (Vínculo con App.js)
    // ----------------------------------------------------

    explicarSeleccion: () => {
        // Validación de seguridad por si State no existe
        if (typeof State === 'undefined' || !State.selTexto) {
            App.abrirIA(); // Abre el panel visualmente
            return;
        }

        App.abrirIA();
        // Prompt enriquecido para exégesis
        const prompt = `Analiza este texto: ${State.selRef} "${State.selTexto}". 
        Dame contexto histórico, significado original y aplicación práctica según la sana doctrina.`;

        IA.procesar(prompt, "[SISTEMA: El usuario seleccionó un texto bíblico específico. Analízalo a fondo.]");

        if (typeof Lectura !== 'undefined') Lectura.cerrarSeleccion();
    },

    // Alias para compatibilidad con botones antiguos de tu interfaz
    consultarSeleccion: () => {
        IA.explicarSeleccion();
    },

    // ----------------------------------------------------
    // 3. NÚCLEO DE PROCESAMIENTO (CON ANTI-CORTE)
    // ----------------------------------------------------

    procesar: async (promptUser, instruccionSistema = "") => {
        const tempId = "thinking-" + Date.now();
        IA.agregarMsg("Escudriñando las Escrituras...", "ia thinking", tempId);

        try {
            // Enviamos los últimos 6 mensajes para mantener el hilo sin saturar
            const historialTxt = IA.state.history.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

            const fullPrompt = `${IA.obtenerSystemPrompt()}\n\n${instruccionSistema}\n\nHISTORIAL:\n${historialTxt}\n\nUsuario: ${promptUser}\nNôema:`;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    // DOCTRINA: Usamos el generador teológico como base del sistema
                    system: "Experto en Teología Asambleas de Dios",
                    max_tokens: 2048, // Zona segura para evitar cortes por timeout
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error("Fallo de Servidor: " + response.status);
            }

            const data = await response.json();

            // Eliminar thinking
            const thinking = document.getElementById(tempId);
            if (thinking) thinking.remove();

            // Renderizar respuesta
            IA.agregarMsg(data.text, 'ia');

            // --- DETECTOR DE CORTE ---
            // Si el texto es largo y no termina en puntuación, activamos rescate
            const ultimoChar = data.text.trim().slice(-1);
            const signosFin = ['.', '!', '?', '"', '»', ')', '`'];

            if (data.text.length > 80 && !signosFin.includes(ultimoChar)) {
                IA.agregarBotonContinuar();
            }

        } catch (error) {
            console.error("Error Noema:", error);
            const thinking = document.getElementById(tempId);
            if (thinking) thinking.remove();

            if (error.message.includes("Fallo de Servidor")) {
                IA.agregarMsg("⚠️ La conexión tardó demasiado. Intenta ser más breve o usa el botón de continuar.", 'ia');
            } else {
                IA.agregarMsg("📡 " + NOEMA_OFFLINE.default, 'ia');
            }
        }
    },

    // ----------------------------------------------------
    // 4. ESTRATEGIA DE RESCATE (CONTINUAR)
    // ----------------------------------------------------

    forzarContinuacion: () => {
        // Eliminamos botones viejos para limpiar la interfaz
        const botones = document.querySelectorAll('.btn-continuar-noema');
        botones.forEach(b => b.remove());

        // Enviamos la orden de continuar
        IA.procesar("Continúa exactamente donde te quedaste.", "[SISTEMA: Tu respuesta anterior se cortó. Sigue inmediatamente desde la última palabra. NO repitas el inicio.]");
    },

    agregarBotonContinuar: () => {
        const container = document.getElementById('chat-historial');
        if (!container) return;

        const div = document.createElement('div');
        div.className = 'btn-continuar-noema';
        div.style.cssText = "text-align: center; margin: 5px 0 15px 0; width: 100%;";
        div.innerHTML = `
            <button onclick="IA.forzarContinuacion()" 
                style="background: #27ae60; color: white; border: none; padding: 6px 15px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                ⟳ Continuar explicación...
            </button>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    // ----------------------------------------------------
    // 5. INTERFAZ Y UTILIDADES
    // ----------------------------------------------------

    agregarMsg: (txt, tipo, id = null) => {
        const div = document.createElement('div');
        // Mantiene tus clases CSS originales (msg, ia, user)
        div.className = `msg ${tipo}`;
        if (id) div.id = id;

        div.innerHTML = txt.replace(/\n/g, '<br>');

        const container = document.getElementById('chat-historial');
        if (container) {
            container.appendChild(div);
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }

        // Guardamos en historial si no es un mensaje de "pensando"
        if (!tipo.includes('thinking')) {
            const role = tipo.includes('user') ? 'Usuario' : 'Noema';
            IA.state.history.push({ role: role, content: txt });

            // Limitamos el historial a 10 mensajes para no gastar tokens infinitos
            if (IA.state.history.length > 10) IA.state.history.shift();

            // PERSISTENCIA: Guardamos en SessionStorage
            IA.guardarMemoria();
        }
    },

    enviar: () => {
        const input = document.getElementById('input-ia');
        if (!input) return;
        const txt = input.value.trim();
        if (!txt) return;

        // Historial Unificado
        if (typeof Historial !== 'undefined' && Historial.agregar) {
            Historial.agregar('chat', txt, {});
        }

        IA.agregarMsg(txt, 'user');
        input.value = "";
        IA.procesar(txt);
    }
};

// Inicialización de Eventos
window.addEventListener('load', () => {
    // Restaurar chat en la memoria interna (State)
    // No lo renderizamos visualmente para evitar duplicados visuales al recargar,
    // pero la IA sí recordará de qué hablaban.

    // Vincular tecla Enter
    const inputIA = document.getElementById('input-ia');
    if (inputIA) {
        inputIA.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') IA.enviar();
        });

        // Ocultar sugerencias al escribir
        inputIA.addEventListener('input', () => {
            const panel = document.getElementById('panel-sugerencias');
            if (panel && typeof Sugerencias !== 'undefined') {
                if (inputIA.value.trim().length > 0) {
                    panel.classList.add('oculto');
                } else {
                    Sugerencias.verificarEstado();
                }
            }
        });
    }
});

// Exponer globalmente
window.IA = IA;
/* ==========================================================================
   MÓDULO SUGERENCIAS (CORREGIDO PARA TU HTML)
   ========================================================================== */
const Sugerencias = {
    lista: [
        { icono: '😔', texto: 'Necesito versículos para la ansiedad' },

        { icono: '🚀', texto: '¿Por dónde empiezo a leer la Biblia?' },

        { icono: '❓', texto: '¿Quién fue el apóstol Pablo?' },

        { icono: '💡', texto: 'Dame un consejo sabio para hoy' },

        { icono: '💡', texto: 'Ideas para memorizar la biblia' }
    ],

    init: () => {
        // Buscamos el panel que acabamos de agregar al HTML
        const panel = document.getElementById('panel-sugerencias');
        if (!panel) return;

        panel.innerHTML = '<h3 class="titulo-sugerencias">¿Por dónde empezamos?</h3>';

        Sugerencias.lista.forEach(item => {
            const btn = document.createElement('div');
            btn.className = 'chip-sugerencia';
            btn.innerHTML = `<span class="chip-icono">${item.icono}</span> ${item.texto}`;

            btn.onclick = () => {
                Sugerencias.enviar(item.texto);
            };

            panel.appendChild(btn);
        });

        // Revisamos si hay que mostrarlo u ocultarlo
        Sugerencias.verificarEstado();
    },

    verificarEstado: () => {
        const panel = document.getElementById('panel-sugerencias');
        // Tu chat real se llama 'chat-historial' en el HTML que me pasaste
        const historial = document.getElementById('chat-historial');

        if (!panel || !historial) return;

        // Si el historial tiene mensajes (hijos), ocultamos las sugerencias
        if (historial.children.length > 0) {
            panel.classList.add('oculto');
        } else {
            panel.classList.remove('oculto');
        }
    },

    enviar: (texto) => {
        // 1. Ocultar panel
        document.getElementById('panel-sugerencias').classList.add('oculto');

        // 2. Colocar texto en el input y enviarlo
        const inputIA = document.getElementById('input-ia');
        if (inputIA) {
            inputIA.value = texto; // Escribimos en el input

            // Llamamos a tu función existente IA.enviar()
            if (typeof IA !== 'undefined' && IA.enviar) {
                IA.enviar();
            }
        }
    }
};

// --- IMPORTANTE: AUTO-INICIAR ---
// Agrega esto al final para que cargue apenas abras la app
window.addEventListener('load', () => {
    setTimeout(() => {
        if (typeof Sugerencias !== 'undefined') Sugerencias.init();
    }, 1000); // Un pequeño retraso para asegurar que el HTML cargó
});