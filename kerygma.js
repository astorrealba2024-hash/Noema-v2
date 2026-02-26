/* ==========================================================================
   MÓDULO KERYGMA (MENTOR SOCRÁTICO + BOSQUEJO FINAL LIMPIO)
   ========================================================================== */
const Kerygma = {
    state: {
        fase: 'INICIO', 
        contexto: null, 
        metodo: null,   
        history: []
    },

    TIMEOUT_MS: 180000,

    // --- CEREBRO CON FORMATO DE SALIDA PROFESIONAL ---
    sysPromptBase: `Eres Kerygma, Mentor de Homilética Pentecostal y Teología Sistemática.

    🚫 REGLA DE ORO:
    NO HAGAS LA TAREA. Enseña a pescar (Método Socrático). Guía al usuario paso a paso (Observación -> Interpretación -> Aplicación).

    CONTEXTO:
    - Si es Célula: Usa método PEICA (Presentación, Explicación, Ilustración, Confirmación, Aplicación).
    - Si es Iglesia: Usa método Expositivo o Temático con exégesis profunda.

    🛡️ CORRECCIÓN:
    Si el usuario interpreta mal o propone herejías, CORRIGE con Biblia en mano antes de avanzar.

    📦 FORMATO DE ENTREGA FINAL (IMPORTANTE):
    Cuando el usuario haya definido todos los puntos y el sermón esté listo, O SI EL USUARIO PIDE "DAME EL BOSQUEJO", genera un resultado FINAL, LIMPIO y ESTRUCTURADO.
    
    El Bosquejo Final debe verse ASÍ (Usa Markdown):
    
    ---
    # [TÍTULO ATRACTIVO DEL SERMÓN]
    **Texto Base:** [Cita Bíblica]
    **Propósito:** [¿Qué queremos lograr en el oyente?]
    
    ## INTRODUCCIÓN
    [Gancho o anécdota breve para captar atención]
    
    ## I. [PRIMER PUNTO PRINCIPAL]
    * **Explicación:** [¿Qué significa el texto?]
    * **Ilustración:** [Ejemplo práctico o bíblico]
    * **Aplicación:** [¿Cómo lo vivimos hoy?]
    
    ## II. [SEGUNDO PUNTO PRINCIPAL]
    ... (Repetir estructura)
    
    ## CONCLUSIÓN
    [Resumen rápido]
    **Llamado al Altar:** [Invitación específica para orar]
    ---
    
    (NO agregues comentarios tipo "Espero te guste", solo entrega el bosquejo limpio).`,

    // --- APERTURA INTELIGENTE ---
    abrir: () => {
        Kerygma.inyectarBotonCierre();
        document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
        
        const vista = document.getElementById('vista-kerygma');
        if (vista) {
            vista.classList.remove('hidden');
            vista.classList.add('activa');
            vista.style.display = 'flex';
        }

        if (!history.state || history.state.vista !== 'kerygma') {
            history.pushState({ vista: 'kerygma' }, "Kerygma");
        }
        window.addEventListener('popstate', Kerygma.manejarBotonAtras);

        const rol = localStorage.getItem('noema-rol');
        if (!rol || rol === '') {
            Kerygma.lanzarEncuestaIdentidad();
        } else {
            if (rol === 'miembro' || rol === 'discipulo') {
                Kerygma.redireccionarANoema();
            } else {
                const historial = document.getElementById('kerygma-chat-history');
                if (!historial || historial.children.length === 0) {
                    Kerygma.iniciarSesion(rol);
                }
            }
        }
    },

    manejarBotonAtras: (event) => {
        const vista = document.getElementById('vista-kerygma');
        if (vista && vista.classList.contains('activa')) {
            Kerygma.cerrar(true); 
        }
    },

    cerrar: (desdeBotonFisico = false) => {
        const vista = document.getElementById('vista-kerygma');
        if (vista) {
            vista.classList.remove('activa');
            vista.classList.add('hidden');
            vista.style.display = 'none';
        }
        window.removeEventListener('popstate', Kerygma.manejarBotonAtras);
        if (!desdeBotonFisico && history.state && history.state.vista === 'kerygma') {
            history.back();
        }
        App.navegar('vista-inicio');
    },

    inyectarBotonCierre: () => {
        const vista = document.getElementById('vista-kerygma');
        const header = vista.querySelector('div'); 
        if (!header || header.querySelector('.btn-cerrar-kerygma')) return;
        header.style.position = 'relative'; 

        const btn = document.createElement('button');
        btn.className = 'btn-cerrar-kerygma';
        btn.innerHTML = '✕';
        btn.onclick = () => Kerygma.cerrar(false);
        btn.style.cssText = `position: absolute; left: 15px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--text); font-size: 1.2rem; font-weight: bold; cursor: pointer; padding: 10px; z-index: 10;`;
        header.insertBefore(btn, header.firstChild);
    },

    // --- ENCUESTA ---
    lanzarEncuestaIdentidad: () => {
        const chat = document.getElementById('kerygma-chat-history');
        if (!chat) return;
        chat.innerHTML = "";
        chat.innerHTML += `<div class="k-chat-msg k-msg-noema">Bienvenido a Kerygma. Para asistirte con la profundidad adecuada, <strong>¿cuál es tu labor actual en el cuerpo de Cristo?</strong></div>`;
        const botones = `
            <div id="selector-roles-kerygma" style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px; padding: 0 10px;">
                <button onclick="Kerygma.asignarRol('miembro')" style="background: transparent; border: 1px solid rgba(142,68,173,0.5); color: var(--text); padding: 18px; border-radius: 15px; font-weight: bold; font-size: 1rem; cursor: pointer; text-align: left;">👤 Miembro / Lector</button>
                <button onclick="Kerygma.asignarRol('discipulo')" style="background: transparent; border: 1px solid rgba(142,68,173,0.5); color: var(--text); padding: 18px; border-radius: 15px; font-weight: bold; font-size: 1rem; cursor: pointer; text-align: left;">📖 Discípulo</button>
                <button onclick="Kerygma.asignarRol('lider')" style="background: rgba(142,68,173,0.1); border: 1px solid #8e44ad; color: var(--text); padding: 18px; border-radius: 15px; font-weight: bold; font-size: 1rem; cursor: pointer; text-align: left;">🔥 Líder / Servidor</button>
                <button onclick="Kerygma.asignarRol('pastor')" style="background: rgba(142,68,173,0.1); border: 1px solid #8e44ad; color: var(--text); padding: 18px; border-radius: 15px; font-weight: bold; font-size: 1rem; cursor: pointer; text-align: left;">🕊️ Pastor / Ministro</button>
            </div>`;
        chat.innerHTML += botones;
    },

    asignarRol: (nuevoRol) => {
        localStorage.setItem('noema-rol', nuevoRol);
        const selector = document.getElementById('selector-roles-kerygma');
        if (selector) selector.remove();
        if (nuevoRol === 'miembro' || nuevoRol === 'discipulo') {
            Kerygma.agregarMensaje('Kerygma', "Entendido. Nôema es tu mejor compañera para el aprendizaje diario. Te llevo con ella...");
            setTimeout(() => { Kerygma.cerrar(false); App.abrirIA(); }, 2500);
        } else {
            Kerygma.agregarMensaje('Kerygma', "Entendido, consiervo. Iniciando modo de mentoría homilética.");
            setTimeout(() => { Kerygma.iniciarSesion(nuevoRol); }, 1500);
        }
    },

    redireccionarANoema: () => {
        const chat = document.getElementById('kerygma-chat-history');
        if (chat) chat.innerHTML = "";
        Kerygma.agregarMensaje('Kerygma', "Hola de nuevo. Recuerda que este espacio es para gestión ministerial. Para tu lectura diaria, Nôema te espera.");
        setTimeout(() => { Kerygma.cerrar(false); App.abrirIA(); }, 3000);
    },

    // --- SESIÓN ---
    iniciarSesion: (rolUsuario = 'Líder') => {
        Kerygma.state = { fase: 'INICIO', contexto: null, metodo: null, history: [] };
        const chatContainer = document.getElementById('kerygma-chat-history');
        if (chatContainer) chatContainer.innerHTML = '';
        const rolFormat = rolUsuario.charAt(0).toUpperCase() + rolUsuario.slice(1);

        // Detectar Devocional
        let devocionalTexto = null;
        const devContainer = document.querySelector('.dev-verso'); 
        if(devContainer) devocionalTexto = devContainer.innerText;

        setTimeout(() => {
            let saludo = `👋 Paz, ${rolFormat}. Vamos a trabajar en tu mensaje.`;
            if (devocionalTexto) {
                saludo += `<br><br>💡 <strong>He notado que leíste este devocional hoy:</strong><br><em>"${devocionalTexto.substring(0, 50)}..."</em><br><br>¿Te gustaría usar este texto para armar tu sermón o prefieres empezar con otro tema?`;
            } else {
                saludo += `<br><br>Para empezar, dime: <strong>¿Dónde vas a predicar?</strong> (Célula, Culto Dominical, Aire libre) y ¿Qué texto tienes en mente?`;
            }
            Kerygma.agregarMensaje('Kerygma', saludo);
        }, 300);

        setTimeout(() => {
            const input = document.getElementById('k-input-chat');
            if (input) input.focus();
        }, 600);
    },

    enviarMensaje: async () => {
        const input = document.getElementById('k-input-chat');
        if (!input || !input.value.trim()) return;
        const texto = input.value.trim();
        Kerygma.agregarMensaje('Usuario', texto);
        input.value = '';
        input.disabled = true;
        input.placeholder = "Kerygma te está leyendo...";

        // LÓGICA DE FASES Y CONTEXTO
        let promptAdicional = "";
        const t = texto.toLowerCase();
        
        if (Kerygma.state.fase === 'INICIO') {
            if (t.includes('célula') || t.includes('casa') || t.includes('grupo')) {
                Kerygma.state.contexto = 'CELULA'; Kerygma.state.metodo = 'PEICA';
                promptAdicional = "[SISTEMA: Contexto CÉLULA (PEICA).]";
            } else if (t.includes('iglesia') || t.includes('domingo')) {
                Kerygma.state.contexto = 'IGLESIA';
                promptAdicional = "[SISTEMA: Contexto IGLESIA.]";
            }
            Kerygma.state.fase = 'DESARROLLO';
        }
        
        promptAdicional += " [SISTEMA: Si el usuario pide el bosquejo o dice 'ya está', GENERA EL FORMATO FINAL LIMPIO definido en el prompt.]";

        const thinkingId = Kerygma.mostrarThinking();

        try {
            await Kerygma.consultarIARobusta(texto, promptAdicional, thinkingId);
        } catch (e) {
            console.error(e);
            Kerygma.mostrarError("Conexión inestable.");
        } finally {
            input.disabled = false;
            input.placeholder = "Escribe tu respuesta...";
            input.focus();
        }
    },

    consultarIARobusta: async (inputUser, promptInstruccion, thinkingId) => {
        const historialTxt = Kerygma.state.history.slice(-12).map(m => `${m.role}: ${m.content}`).join('\n');
        const fullPrompt = `${Kerygma.sysPromptBase}\n\n[HISTORIAL]:\n${historialTxt}\n\n[INSTRUCCIÓN]: ${promptInstruccion}\nUsuario: ${inputUser}\nKerygma (Mentor):`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Kerygma.TIMEOUT_MS);

        try {
            const response = await fetch('/api/chat', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: fullPrompt, 
                    max_tokens: 2500, // Más tokens para asegurar que el bosquejo final quepa entero
                    temperature: 0.7
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error("Error HTTP");
            
            const json = await response.json();
            const dataText = json.text || json.respuesta || "";
            const thinking = document.getElementById(thinkingId);
            if (thinking) thinking.remove();

            Kerygma.agregarMensaje('Kerygma', dataText);
            Kerygma.verificarCortes(dataText);

        } catch (error) {
            clearTimeout(timeoutId);
            const thinking = document.getElementById(thinkingId);
            if (thinking) thinking.remove();
            Kerygma.mostrarError("Error de conexión.");
            Kerygma.agregarBoton("⬇️ Intentar de nuevo", Kerygma.forzarContinuacion); 
        }
    },

    forzarContinuacion: async () => {
        document.querySelectorAll('.btn-k-action').forEach(b => b.remove());
        const thinkingId = Kerygma.mostrarThinking();
        await Kerygma.consultarIARobusta("Sigue.", "[SISTEMA: Continúa exactamente donde te quedaste.]", thinkingId);
    },

    verificarCortes: (texto) => {
        if (!texto) return;
        // Detectar si Kerygma generó un título (# Título) o el separador (---)
        if (texto.includes('# ') || texto.includes('---') || texto.includes('BOSQUEJO FINAL')) {
            Kerygma.agregarBoton("📋 Copiar Bosquejo", () => {
                // Limpiamos etiquetas HTML para que al pegar en Word/Notas quede bien
                const textoLimpio = texto.replace(/<br>/g, '\n').replace(/<\/?[^>]+(>|$)/g, "");
                navigator.clipboard.writeText(textoLimpio);
                alert('¡Bosquejo copiado al portapapeles!');
            }, "#8e44ad");
        }
    },

    // === UI UTILS ===
    agregarMensaje: (remitente, texto) => {
        const container = document.getElementById('kerygma-chat-history');
        if (!container) return;
        const div = document.createElement('div');
        div.className = remitente === 'Usuario' ? 'k-chat-msg k-msg-user' : 'k-chat-msg k-msg-noema';
        
        div.style.marginBottom = "15px"; div.style.padding = "12px"; div.style.borderRadius = "15px";
        div.style.maxWidth = "85%"; div.style.lineHeight = "1.5";

        if(remitente === 'Usuario') {
            div.style.alignSelf = "flex-end"; div.style.background = "#333"; div.style.color = "white";
        } else {
            div.style.alignSelf = "flex-start";
            if(document.body.classList.contains('dark')) {
                div.style.background = "#2c2c2e"; div.style.color = "#ecf0f1"; div.style.borderLeft = "4px solid #9b59b6";
            } else {
                div.style.background = "rgba(142,68,173,0.1)"; div.style.color = "#333"; div.style.borderLeft = "4px solid #8e44ad";
            }
        }
        div.innerHTML = texto.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        Kerygma.state.history.push({ role: remitente === 'Usuario' ? 'user' : 'assistant', content: texto });
    },

    mostrarThinking: () => {
        const container = document.getElementById('kerygma-chat-history');
        const id = 'k-think-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.innerHTML = "<em style='color:#888; margin-left:10px;'>Kerygma está analizando...</em>";
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return id;
    },

    mostrarError: (msg) => {
        const container = document.getElementById('kerygma-chat-history');
        const div = document.createElement('div');
        div.innerHTML = `<div style="color:red; text-align:center; margin:10px;">⚠️ ${msg}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    agregarBoton: (texto, accion, color="#27ae60") => {
        const container = document.getElementById('kerygma-chat-history');
        const btn = document.createElement('button');
        btn.innerText = texto;
        btn.className = "btn-k-action"; 
        btn.onclick = accion;
        btn.style.cssText = `display:block; margin:10px auto; padding:10px 20px; background:${color}; color:white; border:none; border-radius:20px; cursor:pointer;`;
        container.appendChild(btn);
        container.scrollTop = container.scrollHeight;
    }
};

window.Kerygma = Kerygma;