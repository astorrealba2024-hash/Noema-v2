let versiculoSeleccionado = null;
/* ==========================================================================
   APP.JS - VERSIÓN COMPLETA Y FUNCIONAL (NOEMA + KERYGMA + STUDIO)
   ========================================================================== */

const State = {
    user: localStorage.getItem('noema-user'),
    version: localStorage.getItem('noema-version') || 'RV1960',
    versionSec: 'RV1960', // Default secondary version
    libro: localStorage.getItem('noema-libro') || 'Génesis',
    cap: parseInt(localStorage.getItem('noema-cap')) || 1,
    font: parseInt(localStorage.getItem('noema-font')) || 100,
    selTexto: '',
    selRef: ''
};

// NOTA:
// La función `renderSecundario` ya existe dentro del módulo `Lectura` más abajo.
// Aquí había quedado un bloque duplicado suelto (con coma final) que rompía el parseo
// e impedía que se definieran módulos como `Selector` (causando el error "Unexpected token 'const'").

const VERSICULOS_CUMPLE = [
    { t: "Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti.", r: "Números 6:24-25", g: "both" },
    { t: "Deléitate asimismo en Jehová, Y él te concederá las peticiones de tu corazón.", r: "Salmos 37:4", g: "both" },
    { t: "Te alabaré; porque formidables, maravillosas son sus obras.", r: "Salmos 139:14", g: "mujer" },
    { t: "Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo... porque Jehová tu Dios es el que va contigo.", r: "Deuteronomio 31:6", g: "hombre" },
    { t: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal.", r: "Jeremías 29:11", g: "both" },
    { t: "Engañosa es la gracia, y vana la hermosura; La mujer que teme a Jehová, ésa será alabada.", r: "Proverbios 31:30", g: "mujer" },
    { t: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes.", r: "Josué 1:9", g: "hombre" }
];

const BIBLIAS = {
    'RV1960': { data: null, tipo: 'js' },
    'PDT': { data: null, tipo: 'js' },
    'TLA': { data: null, tipo: 'js' }
};

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

/* ==========================================================================
   MÓDULO APP (CORE) - VERSIÓN 5.0.7 (CON UPDATE BEACON & BARRA)
   ========================================================================== */
const App = {
    // 1. DEFINE TU VERSIÓN ACTUAL AQUÍ (Cambia esto para disparar la alerta)
    version: "5.0.7",

    ajustesTimer: null,
    ignoreNextPop: false, // Flag para limpieza de historial

    init: async () => {
            // --- NUEVO: OCULTAR BARRA DURANTE ANIMACIÓN INICIAL ---
            const barraNav = document.querySelector('.bottom-nav');
            if (barraNav) barraNav.style.display = 'none';
            
            // --- LÓGICA DE TEMA INTELIGENTE (ACTUALIZADA) ---
            const temaManual = localStorage.getItem('noema-tema');
            const autoActivado = localStorage.getItem('noema-auto-noche') !== 'false'; // Por defecto es true
            
            if (autoActivado) {
                // Si la automatización está encendida, manda la hora actual
                const hora = new Date().getHours();
                if (hora >= 19 || hora < 6) document.body.classList.add('dark');
                else document.body.classList.remove('dark');
            } else {
                // Si está apagada, manda solo lo que el usuario eligió manualmente
                if (temaManual === 'oscuro') document.body.classList.add('dark');
                else document.body.classList.remove('dark');
            }
            
            // Sincronizar los interruptores visuales un momento después de que cargue el DOM
            setTimeout(() => {
                const swModo = document.getElementById('switch-modo-oscuro');
                const swAuto = document.getElementById('switch-auto-noche');
                if (swModo) swModo.checked = document.body.classList.contains('dark');
                if (swAuto) swAuto.checked = autoActivado;
            }, 1000);
            // -----------------------------------------------
            
            // (Aquí sigue el resto de tu código: Cargar Biblias, etc...)

        // --- NUEVO: CARGAR TAMAÑO DE BARRA ---
        App.cargarPreferenciasBarra();

        // 2. Cargar Biblias
        if (window.BIBLIAS && window.BIBLIAS.RV1960) BIBLIAS['RV1960'].data = window.BIBLIAS.RV1960;

        setTimeout(() => {
            if (!BIBLIAS['RV1960'].data && window.BIBLIAS && window.BIBLIAS.RV1960) {
                BIBLIAS['RV1960'].data = window.BIBLIAS.RV1960;
            }
        }, 500);

        if (State.version !== 'RV1960') await Lectura.cargarJson(State.version);

        // 3. Cargar Usuario
        setTimeout(() => {
            const usuarioGuardado = localStorage.getItem('noema-user');
            if (usuarioGuardado && localStorage.getItem('noema-setup-complete')) {
                State.user = usuarioGuardado;
                App.actualizarUIUsuario();
                if (typeof App.verificarCumple === 'function') App.verificarCumple();

                // CORRECCIÓN: Usamos navegar() para limpiar todo rastro de otras vistas
                if (typeof App.navegar === 'function') App.navegar('vista-inicio');
                else {
                    document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
                    document.getElementById('vista-inicio').style.display = 'block';
                }

            } else {
                // Si es usuario nuevo, ocultamos todo y mostramos Setup
                document.querySelectorAll('.vista').forEach(v => {
                    v.classList.remove('activa');
                    v.style.display = 'none';
                });
                const loading = document.getElementById('loading-indicator');
                const setup = document.getElementById('vista-setup');
                const form = document.getElementById('form-setup');

                if (loading) loading.style.display = 'none';
                if (setup) { setup.classList.add('activa'); setup.style.display = 'flex'; }
                if (form) { form.classList.remove('hidden'); form.style.display = 'flex'; }
            }
        }, 5500); // Tiempo de splash screen

        // 4. Listeners Generales
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.onclick = () => App.cerrarTodo();

        // 5. Scroll Listener
        window.addEventListener('scroll', () => {
            const menu = document.getElementById('ajustes-texto');
            if (menu && !menu.classList.contains('hidden')) {
                menu.classList.add('hidden');
                if (App.ajustesTimer) clearTimeout(App.ajustesTimer);
            }
        }, { passive: true });

        // 6. Manejo de Botón Atrás (Navegación Nativa)
        window.addEventListener('popstate', (event) => {
            const modals = ['modal-resaltados', 'modal-historial', 'modal-mis-notas'];
            modals.forEach(id => {
                const el = document.getElementById(id);
                if (el && !el.classList.contains('hidden')) {
                    el.classList.add('hidden');
                }
            });
        });

        if (typeof Devocional !== 'undefined') Devocional.generar();

        setTimeout(() => { if (typeof Gestos !== 'undefined') Gestos.init(); }, 1000);

        // --- NUEVO: COMPROBAR ACTUALIZACIÓN (BEACON) ---
        setTimeout(() => {
            App.checkUpdate();
            // Iniciar animación de saludo después de cargar
            App.iniciarAnimacionSaludo();
            // Cargar contenido del Pan Diario
            App.cargarPanDiario();
// Actualizar Carrusel con verso del día
App.actualizarCarruselConVersoDia();

// LLAMAMOS A LA FUNCIÓN AQUÍ PARA QUE APAREZCA LA FECHA
App.mostrarFecha();
}, 2500);
},

// Esta es tu función (está perfecta)
mostrarFecha: () => {
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    const hoy = new Date().toLocaleDateString('es-ES', opciones);
    
    // Capitalizar la primera letra
    const fechaFormateada = hoy.charAt(0).toUpperCase() + hoy.slice(1);
    
    const el = document.getElementById('fecha-actual-header');
    if (el) el.innerText = fechaFormateada;
},

    // --- LÓGICA DE SALUDO DINÁMICO CON ICONOS PREMIUM ---
    iniciarAnimacionSaludo: () => {
        const titulo = document.getElementById('titulo-pan-diario');
        if (!titulo) return;

        let mostrandoSaludo = false;

        const iconSun = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-left: 8px; filter: drop-shadow(0 0 8px rgba(241, 196, 15, 0.6));"><circle cx="12" cy="12" r="5" fill="#F1C40F" /><path d="M12 2V4" stroke="#F1C40F" stroke-width="2" stroke-linecap="round"/><path d="M12 20V22" stroke="#F1C40F" stroke-width="2" stroke-linecap="round"/><path d="M4.92993 4.92999L6.34993 6.34999" stroke="#F1C40F" stroke-width="2" stroke-linecap="round"/><path d="M17.66 17.66L19.07 19.07" stroke="#F1C40F" stroke-width="2" stroke-linecap="round"/><path d="M2 12H4" stroke="#F1C40F" stroke-width="2" stroke-linecap="round"/><path d="M20 12H22" stroke="#F1C40F" stroke-width="2" stroke-linecap="round"/><path d="M6.34993 17.66L4.92993 19.07" stroke="#F1C40F" stroke-width="2" stroke-linecap="round"/><path d="M19.07 4.92999L17.66 6.34999" stroke="#F1C40F" stroke-width="2" stroke-linecap="round"/></svg>`;

        const iconMoon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-left: 8px; filter: drop-shadow(0 0 8px rgba(52, 152, 219, 0.6));"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" fill="#3498DB" stroke="#3498DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

        setInterval(() => {
            // Calcular saludo basado en hora actual cada vez
            const hora = new Date().getHours();
            let saludo = "";

            if (hora >= 5 && hora < 12) {
                saludo = `Buenos días ${iconSun}`;
            } else if (hora >= 12 && hora < 19) {
                saludo = `Buenas tardes ${iconSun}`;
            } else {
                saludo = `Buenas noches ${iconMoon}`;
            }

            if (mostrandoSaludo) {
                titulo.innerHTML = "Pan diario"; // Regresar a título
                mostrandoSaludo = false;
            } else {
                titulo.innerHTML = saludo; // Mostrar saludo con icono
                mostrandoSaludo = true;
            }
        }, 8000);
    },

    // --- ACTUALIZAR CARRUSEL CON VERSO DEL DÍA ---
    actualizarCarruselConVersoDia: () => {
        const pd = App.getPanDiario();
        if (!pd) return;

        const texto = `"${pd.verso.texto}"`;
        const cita = `${pd.verso.libro} ${pd.verso.cap}:${pd.verso.versiculo}`;

        // Imágenes de fondo aleatorias de alta calidad para versículos
        const imagenes = [
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=800'
        ];

        const cards = document.querySelectorAll('.verse-card-item');
        cards.forEach((card, index) => {
            // Actualizar onclick para abrir lightbox con el verso del día
            const imgUrl = imagenes[index % imagenes.length];

            // Reemplazamos el onclick
            card.setAttribute('onclick', `App.abrirImagenFull('${imgUrl}', '${cita}', '${texto.replace(/'/g, "\\'")}')`);

            // Actualizar referencia visual mini
            const refMini = card.querySelector('.verse-ref-mini');
            if (refMini) refMini.innerText = cita;

            // Actualizar texto visual mini (NUEVO - Solicitado por usuario)
            const textMini = card.querySelector('.verse-text-mini');
            if (textMini) textMini.innerText = pd.verso.texto;
        });
    },

    // =============================================================
    // 1. NUEVO SISTEMA: PAN DIARIO AUTOMÁTICO (VERCEL + GROQ)
    // =============================================================
    
    datosDevocional: null,

    // Carga inteligente: Revisa si hay algo guardado o pide a la nube
    cargarPanDiario: async () => {
        const hoy = new Date().toLocaleDateString();
        const guardado = localStorage.getItem('noema-devocional-dia');
        const datosGuardados = localStorage.getItem('noema-devocional-json');

        // A. Si ya tenemos el de hoy guardado en el teléfono, úsalo
        if (guardado === hoy && datosGuardados) {
            try {
                App.datosDevocional = JSON.parse(datosGuardados);
                App.actualizarUIPanDiario();
                return;
            } catch(e) { console.log("Cache corrupto, recargando..."); }
        }

        // B. Si es un nuevo día, pídelo a tu servidor en Vercel
        console.log("Conectando con la nube...");
        const txtVerso = document.getElementById('texto-verso-dia');
        if(txtVerso) txtVerso.innerText = "Recibiendo palabra del cielo...";

        try {
            // Llamada a tu API segura
            const response = await fetch('/api/devocional');
            
            if (!response.ok) throw new Error("Error API Vercel");
            const devocional = await response.json();

            // Guardar en el teléfono para no gastar internet luego
            localStorage.setItem('noema-devocional-dia', hoy);
            localStorage.setItem('noema-devocional-json', JSON.stringify(devocional));
            
            App.datosDevocional = devocional;
            App.actualizarUIPanDiario();

        } catch (error) {
            console.error("Fallo de conexión:", error);
            App.usarRespaldo(); // Si no hay internet, usa el respaldo
        }
    },

    // Actualiza textos, reflexión, oración Y LOS CARRUSELES
    actualizarUIPanDiario: () => {
        const pd = App.datosDevocional;
        if (!pd) return;

        // 1. Tarjeta Principal (Versículo)
        const ref = document.getElementById('ref-verso-dia');
        const txt = document.getElementById('texto-verso-dia');
        if (ref) ref.innerText = `${pd.verso.libro} ${pd.verso.cap}:${pd.verso.versiculo}`;
        if (txt) txt.innerText = `"${pd.verso.texto}"`;

        // 2. Tarjetas Secundarias (Reflexión y Oración)
        const temaRef = document.getElementById('tema-reflexion-dia');
        const temaOra = document.getElementById('tema-oracion-dia');
        if (temaRef) temaRef.innerText = pd.reflexion.tema;
        if (temaOra) temaOra.innerText = pd.oracion.tema;

        // 3. ¡MAGIA! Actualiza también los diseños de abajo con el mismo verso
        if (typeof App.actualizarCarruselConVersoDia === 'function') {
            App.actualizarCarruselConVersoDia();
        }
    },

    // Devocional de emergencia (por si falla internet)
    usarRespaldo: () => {
        App.datosDevocional = {
            verso: { 
                libro: "Filipenses", 
                cap: 4, 
                versiculo: 6, 
                texto: "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias." 
            },
            reflexion: { 
                tema: "La cura para la ansiedad", 
                titulo: "Intercambio Divino", 
                explicacion: "Pablo no nos pide negar la realidad de nuestros problemas, sino cambiar nuestra reacción ante ellos. El afán es intentar controlar lo incontrolable; la oración es transferir esa carga a Aquel que todo lo puede.", 
                aplicacion: "Hoy, cuando sientas que la ansiedad toca a tu puerta, haz el 'intercambio divino'. Identifica una cosa específica que te preocupa y entrégasela a Dios en oración ahora mismo." 
            },
            oracion: { 
                tema: "Entregando mis cargas hoy", 
                slides: [
                    {
                        titulo: "Enfoque", 
                        texto: "Señor, reconozco que he estado cargando con preocupaciones que no puedo resolver. Decido soltar el control y confiar en Ti.", 
                        img: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=1000"
                    },
                    {
                        titulo: "Petición", 
                        texto: "Traigo delante de ti mi ansiedad por el futuro. Que tu paz, que sobrepasa todo entendimiento, guarde mi corazón ahora mismo.", 
                        img: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&q=80&w=1000"
                    },
                    {
                        titulo: "Gratitud", 
                        texto: "Gracias, Padre, porque me escuchas. Gracias porque no estoy solo en esta batalla. Descanso en tu poder y fidelidad. Amén.", 
                        img: "https://images.unsplash.com/photo-1518176258769-f227c798150e?auto=format&fit=crop&q=80&w=1000"
                    }
                ] 
            }
        };
        App.actualizarUIPanDiario();
    },

    // Getters para que el resto de la App siga funcionando sin errores
    get PanDiario() { return App.datosDevocional || App.usarRespaldo() || App.datosDevocional; },
    getPanDiario: () => { return App.PanDiario; },

    // =============================================================
    // 2. SISTEMA DE HISTORIAS Y ORACIÓN (INTACTO)
    // =============================================================
    
    storyIndex: 0,
    storyTimer: null,
    storyDuration: 5000, // 5 segundos por slide

// Abre el modo "Stories" para la oración
abrirOracion: () => {
        // Registrar estado para que el botón atrás del teléfono funcione
        history.pushState({ modal: 'oracion' }, "");
        
        const pd = App.PanDiario;
        const slides = pd.oracion.slides || pd.slides;
        
        if (!slides || slides.length === 0) return;

        App.storyIndex = 0;
        const vista = document.getElementById('vista-oracion');
        if (vista) {
            vista.style.display = 'flex';
            // Generar barras de progreso superiores
            const barsContainer = document.getElementById('stories-progress-bars');
            barsContainer.innerHTML = '';
            slides.forEach((_, idx) => {
                const bar = document.createElement('div');
                bar.className = 'story-progress-bg';
                bar.innerHTML = `<div class="story-progress-fill" id="prog-fill-${idx}"></div>`;
                barsContainer.appendChild(bar);
            });

            App.renderStory();
        }
    },

    cerrarOracion: () => {
        const vista = document.getElementById('vista-oracion');
        if (vista) vista.style.display = 'none';
        if (App.storyTimer) clearInterval(App.storyTimer);
        App.storyTimer = null;
    },

    renderStory: () => {
        const idx = App.storyIndex;
        const pd = App.PanDiario;
        const slides = pd.oracion.slides || pd.slides;

        if (!slides) return;
        const currentSlide = slides[idx];

        // 1. Contenido visual
        document.getElementById('story-title').innerText = currentSlide.titulo;
        document.getElementById('story-text').innerText = currentSlide.texto;
        const area = document.getElementById('story-content-area');
        area.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('${currentSlide.img}')`;

        // 2. Barras de Progreso
        slides.forEach((_, i) => {
            const fill = document.getElementById(`prog-fill-${i}`);
            if (fill) {
                fill.style.transition = 'none';
                fill.style.width = i < idx ? '100%' : '0%';
            }
        });

        // 3. Animar barra actual
        const currentFill = document.getElementById(`prog-fill-${idx}`);
        if (currentFill) {
            void currentFill.offsetWidth; // Forzar reflow
            currentFill.style.transition = `width ${App.storyDuration}ms linear`;
            currentFill.style.width = '100%';
        }

        // 4. Temporizador automático
        if (App.storyTimer) clearInterval(App.storyTimer);
        App.storyTimer = setInterval(App.siguienteHistoria, App.storyDuration);
    },

    siguienteHistoria: (e) => {
        if (e) e.stopPropagation();
        const pd = App.PanDiario;
        const slides = pd.oracion.slides || pd.slides;
        const max = slides.length - 1;

        if (App.storyIndex < max) {
            App.storyIndex++;
            App.renderStory();
        } else {
            App.cerrarOracion();
        }
    },
    
    historiaAnterior: (e) => {
        if (e) e.stopPropagation();
        if (App.storyIndex > 0) {
            App.storyIndex--;
            App.renderStory();
        } else {
            App.renderStory();
        }
    },

    // Muestra la reflexión en pantalla completa
    mostrarReflexionCompleta: () => {
        const pd = App.PanDiario;
        const container = document.getElementById('contenido-devocional-detalle');
        if (container) {
            container.innerHTML = `
                <div style="max-width: 600px; padding-bottom: 80px;">
                    <span style="color: var(--primary); font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Reflexión del día</span>
                    <h1 style="font-size: 2rem; margin: 10px 0 20px 0; line-height: 1.2;">${pd.reflexion.titulo}</h1>
                    
                    <div style="background: var(--card); padding: 20px; border-radius: 15px; border-left: 4px solid var(--primary); margin-bottom: 30px;">
                        <h3 style="margin:0 0 5px 0;">${pd.verso.libro} ${pd.verso.cap}:${pd.verso.versiculo}</h3>
                        <p style="font-style: italic; opacity: 0.9; line-height: 1.6;">"${pd.verso.texto}"</p>
                    </div>

                    <div style="font-size: 1.1rem; line-height: 1.8; opacity: 0.9;">
                        <h3>Explicación</h3>
                        <p>${pd.reflexion.explicacion}</p>
                        <h3 style="margin-top: 30px;">Aplicación</h3>
                        <p>${pd.reflexion.aplicacion}</p>
                    </div>
                </div>
            `;
        }
        App.navegar('vista-devocional');
    },

    abrirLecturaPanDiario: () => {
        const pd = App.PanDiario;
        // Navegar a Biblia y abrir ubicación
        if (typeof Lectura !== 'undefined') {
            State.libro = pd.verso.libro;
            State.cap = pd.verso.cap;
            Lectura.render(); // Renderizar primero
            App.navegar('vista-biblia');
            // Intentar scrollear al verso (si existiera lógica para ello, por ahora solo abre el capítulo)
            setTimeout(() => {
                // Lógica simple de scroll si se implementara ids por versiculo
            }, 500);
        } else {
            App.navegar('vista-biblia');
        }
    },

    compartirPanDiario: (e) => {
    if (e) e.stopPropagation(); // Evita que se abra la lectura al tocar el botón
    
    const pd = App.PanDiario;
    
    // 1. CONSTRUCCIÓN DEL MENSAJE CON FIRMA
    const textoCompartir = `"${pd.verso.texto}"\n\n📍 ${pd.verso.libro} ${pd.verso.cap}:${pd.verso.versiculo}\n\n— NÔEMA App`;
    
    // 2. INTENTO DE COMPARTIR NATIVO (ANDROID/IOS)
    if (navigator.share) {
        navigator.share({
            title: 'Pan Diario Nôema',
            text: textoCompartir,
        }).catch(console.error);
    } else {
        // 3. PLAN B: Si el navegador no soporta compartir (ej: algunos PC), copia al portapapeles
        navigator.clipboard.writeText(textoCompartir).then(() => {
            alert("Copiado (Tu navegador no soporta compartir directo)");
        });
    }
},

    // --- FUNCIONES DE AJUSTE DE BARRA (NUEVAS) ---
    ajustarBarra: (delta) => {
        let current = parseInt(localStorage.getItem('noema-bar-scale-val')) || 100;
        let nuevo = current + delta;
        if (nuevo < 80) nuevo = 80;
        if (nuevo > 140) nuevo = 140;

        localStorage.setItem('noema-bar-scale-val', nuevo);
        document.documentElement.style.setProperty('--bar-scale', nuevo / 100);

        const indicador = document.getElementById('conf-indicador-barra');
        if (indicador) indicador.innerText = nuevo + '%';
    },

    cargarPreferenciasBarra: () => {
        const guardado = parseInt(localStorage.getItem('noema-bar-scale-val')) || 100;
        document.documentElement.style.setProperty('--bar-scale', guardado / 100);
        const indicador = document.getElementById('conf-indicador-barra');
        if (indicador) indicador.innerText = guardado + '%';
    },

    // --- FUNCIONES DE ACTUALIZACIÓN (BEACON) ---
    // --- FUNCIONES DE ACTUALIZACIÓN (BEACON) ---
checkUpdate: () => {
    const versionGuardada = localStorage.getItem('noema-version-instalada');
    
    // --- NUEVO: VERIFICAR QUE ESTAMOS EN INICIO ---
    const vistaInicio = document.getElementById('vista-inicio');
    const estamosEnInicio = vistaInicio && (vistaInicio.classList.contains('activa') || vistaInicio.style.display === 'block');
    
    // Si la versión es diferente Y el usuario está en la pantalla principal...
    if (versionGuardada !== App.version && estamosEnInicio) {
        
        // Inyectar HTML del Beacon si no existe
        if (!document.getElementById('update-beacon')) {
            const div = document.createElement('div');
            div.id = 'update-beacon';
            div.innerHTML = `
                    <div class="beacon-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </div>
                    <div class="beacon-info">
                        <h4 class="beacon-title">Nueva Versión</h4>
                        <p class="beacon-desc">Nôema ${App.version} está lista.</p>
                    </div>
                    <button class="btn-beacon" onclick="App.irAActualizar()">ACTUALIZAR</button>
                `;
            document.body.appendChild(div);
            
            // Animación de entrada
            setTimeout(() => document.getElementById('update-beacon').classList.add('visible'), 100);
        }
    }
},

    irAActualizar: () => {
        const beacon = document.getElementById('update-beacon');
        if (beacon) beacon.classList.remove('visible');
        if (typeof Configuracion !== 'undefined') Configuracion.abrir();
    },

    // ---------------------------------------------

    // --- PUENTE AL CREADOR PREMIUM ---
    // --- PUENTE AL CREADOR PREMIUM ---
    abrirCreadorPremium: () => {
        let texto = "";
        let cita = "";
        const seleccionNavegador = window.getSelection().toString().trim();

        if (typeof versiculoSeleccionado !== 'undefined' && versiculoSeleccionado) {
            texto = versiculoSeleccionado.texto;
            cita = `${versiculoSeleccionado.libro} ${versiculoSeleccionado.cap}:${versiculoSeleccionado.numero}`;
        } else if (seleccionNavegador) {
            texto = seleccionNavegador;
            cita = "Biblia";
        } else {
            // Intentar con el versículo del día (Prioridad)
            const versoDia = document.getElementById('texto-verso-dia');
            const refDia = document.getElementById('ref-verso-dia');

            if (versoDia && refDia) {
                texto = versoDia.innerText.replace(/"/g, '').trim();
                cita = refDia.innerText.trim();
            } else {
                const versoDev = document.querySelector('.dev-verso');
                if (versoDev) {
                    texto = versoDev.innerText.replace(/"/g, '').split('-')[0].trim();
                    cita = "Devocional de Hoy";
                }
            }
        }

        if (!texto) return alert("Selecciona un versículo primero.");
        if (typeof Lectura !== 'undefined') Lectura.cerrarSeleccion();

        setTimeout(() => {
            if (typeof EditorAutonomo !== 'undefined') {
                EditorAutonomo.abrir(texto, cita);
            } else {
                alert("Módulo de diseño cargando... (Intenta de nuevo)");
            }
        }, 100);
    },

    // --- FUNCIONES CARRUSEL IMÁGENES ---
    // --- FUNCIONES CARRUSEL IMÁGENES (Minimalista Lightbox) ---
    abrirImagenFull: (urlImagen, cita, texto) => {
        const lightbox = document.getElementById('lightbox-premium');
        const imgFull = document.getElementById('img-lightbox-full');

        if (lightbox && imgFull) {
            imgFull.src = urlImagen;
            // Guardamos metadatos en el elemento para usar al compartir/descargar
            lightbox.dataset.cita = cita;
            lightbox.dataset.texto = texto;

            // --- NUEVO: Mostrar texto visualmente sobre la imagen ---
            const lblTexto = document.getElementById('lbl-texto-full');
            const lblCita = document.getElementById('lbl-cita-full');
            if (lblTexto) lblTexto.innerText = texto;
            if (lblCita) lblCita.innerText = cita;

            lightbox.classList.add('active');
            // Bloquear scroll de fondo
            document.body.style.overflow = 'hidden';
        }
    },

    cerrarLightbox: () => {
        const lightbox = document.getElementById('lightbox-premium');
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = ''; // Restaurar scroll
        }
    },

    descargarImagen: () => {
        const imgFull = document.getElementById('img-lightbox-full');
        if (imgFull && imgFull.src) {
            const link = document.createElement('a');
            link.href = imgFull.src;
            link.download = `noema-design-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    compartirImagen: () => {
        const lightbox = document.getElementById('lightbox-premium');
        const cita = lightbox ? lightbox.dataset.cita : 'Diseño Bíblico';
        const texto = lightbox ? lightbox.dataset.texto : 'Mira este diseño increíble.';
        const imgFull = document.getElementById('img-lightbox-full');

        if (navigator.share) {
            navigator.share({
                title: 'Nôema Design',
                text: `${cita} - ${texto}`,
                url: imgFull ? imgFull.src : window.location.href
            }).catch(console.error);
        } else {
            // Fallback: Copiar al portapapeles
            if (imgFull) {
                navigator.clipboard.writeText(imgFull.src).then(() => {
                    alert("Enlace de imagen copiado al portapapeles");
                });
            }
        }
    },

    procesarFoto: (input, imgId) => {
        if (input.files && input.files[0]) {
            if (typeof Editor !== 'undefined') {
                Editor.abrir(input.files[0], imgId);
            } else {
                alert("Editor no cargado. Recarga la página.");
            }
        }
    },

    actualizarUIUsuario: () => {
        const u = localStorage.getItem('noema-user');
        const f = localStorage.getItem('noema-avatar') || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

        ['saludo-usuario', 'saludo-usuario-dashboard', 'nombre-sidebar', 'conf-nombre'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = u ? (id === 'saludo-usuario' || id === 'saludo-usuario-dashboard' ? u : u) : 'Usuario';
        });

        // Actualizar saludo compuesto si es necesario
        const saludoDash = document.getElementById('saludo-usuario-dashboard');
        if (saludoDash && u) {
            // El HTML ya tiene "Hola, " antes del span, así que solo ponemos el nombre
            saludoDash.innerText = u;
        }

        ['avatar-inicio', 'avatar-dashboard', 'avatar-sidebar', 'img-perfil-edit', 'setup-avatar', 'conf-avatar'].forEach(id => {
            const img = document.getElementById(id);
            if (img) {
                img.src = f;
                if (f.includes('svg+xml')) img.style.backgroundColor = "#222";
                else img.style.backgroundColor = "transparent";
            }
        });
    },

    verificarCumple: () => {
        const cumple = localStorage.getItem('noema-cumple');
        if (!cumple) return;

        const hoy = new Date();
        const [cy, cm, cd] = cumple.split('-').map(Number);

        if (hoy.getDate() === cd && (hoy.getMonth() + 1) === cm) {
            setTimeout(() => {
                const nombre = localStorage.getItem('noema-user') || "Hijo de Dios";
                const genero = localStorage.getItem('noema-genero') || 'both';

                if (typeof VERSICULOS_CUMPLE !== 'undefined') {
                    const pool = VERSICULOS_CUMPLE.filter(v => v.g === 'both' || v.g === genero);
                    const verso = pool[Math.floor(Math.random() * pool.length)];

                    const elNombre = document.getElementById('cumple-nombre');
                    const elVerso = document.getElementById('cumple-verso');
                    const elRef = document.getElementById('cumple-ref');

                    if (elNombre) elNombre.innerText = nombre;
                    if (elVerso) elVerso.innerText = `"${verso.t}"`;
                    if (elRef) elRef.innerText = verso.r;

                    const modal = document.getElementById('modal-cumple');
                    if (modal) {
                        modal.classList.remove('hidden');
                        console.log("🎉 Feliz cumpleaños!");
                    }
                }
            }, 3000);
        }
    },

    guardarPerfil: () => {
        const nombre = document.getElementById('input-nombre').value.trim();
        const genero = document.getElementById('setup-genero').value;
        const cumple = document.getElementById('setup-cumple').value;
        const fotoSrc = document.getElementById('setup-avatar').src;

        if (!nombre) return alert("Por favor, dinos tu nombre.");

        localStorage.setItem('noema-user', nombre);
        localStorage.setItem('noema-genero', genero);
        localStorage.setItem('noema-cumple', cumple);
        localStorage.setItem('noema-rol', '');

        if (!fotoSrc.includes("svg+xml")) {
            localStorage.setItem('noema-avatar', fotoSrc);
        }

        localStorage.setItem('noema-setup-complete', 'true');
        State.user = nombre;
        location.reload();
    },

    // --- LÓGICA MI ESPACIO (NUEVO PERFIL) ---
    abrirMiEspacio: () => {
        // Cargar datos del usuario
        const nombre = localStorage.getItem('noema-user') || 'Usuario';
        const avatar = localStorage.getItem('noema-avatar') || DEFAULT_AVATAR;

        const elNombre = document.getElementById('nombre-mi-espacio');
        const elAvatar = document.getElementById('avatar-mi-espacio');

        if (elNombre) elNombre.innerText = nombre;
        if (elAvatar) {
            elAvatar.src = avatar;
            if (avatar.includes('svg+xml')) elAvatar.style.backgroundColor = "#222";
            else elAvatar.style.backgroundColor = "transparent";
        }

        const modal = document.getElementById('modal-mi-espacio');
        if (modal) modal.classList.remove('hidden');
    },

    cerrarMiEspacio: () => {
        const modal = document.getElementById('modal-mi-espacio');
        if (modal) modal.classList.add('hidden');
    },

    abrirPerfil: () => {
        const nombreActual = localStorage.getItem('noema-user');
        const generoActual = localStorage.getItem('noema-genero');
        const cumpleActual = localStorage.getItem('noema-cumple');
        const avatarActual = localStorage.getItem('noema-avatar') || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

        const inpNombre = document.getElementById('input-nombre-edit');
        if (inpNombre) inpNombre.value = nombreActual || "";

        const selGenero = document.getElementById('select-genero');
        if (selGenero) selGenero.value = generoActual || "";

        const inpCumple = document.getElementById('input-cumple');
        if (inpCumple) inpCumple.value = cumpleActual || "";

        const imgEdit = document.getElementById('img-perfil-edit');
        if (imgEdit) imgEdit.src = avatarActual;

        const modalConfig = document.getElementById('modal-config');
        if (modalConfig) modalConfig.classList.add('hidden');

        const modalPerfil = document.getElementById('modal-perfil');
        if (modalPerfil) modalPerfil.classList.remove('hidden');

        history.pushState({ modal: 'perfil' }, "");
    },

    cerrarPerfil: () => {
        const modalPerfil = document.getElementById('modal-perfil');
        if (modalPerfil) modalPerfil.classList.add('hidden');
        if (typeof Configuracion !== 'undefined') Configuracion.abrir();
    },

    guardarPerfilEditado: () => {
        const nuevoNombre = document.getElementById('input-nombre-edit').value;
        const nuevoGenero = document.getElementById('select-genero').value;
        const nuevoCumple = document.getElementById('input-cumple').value;
        const nuevaFoto = document.getElementById('img-perfil-edit').src;

        if (nuevoNombre) localStorage.setItem('noema-user', nuevoNombre);
        localStorage.setItem('noema-genero', nuevoGenero);
        localStorage.setItem('noema-cumple', nuevoCumple);

        if (!nuevaFoto.includes("svg+xml")) localStorage.setItem('noema-avatar', nuevaFoto);

        App.actualizarUIUsuario();

        const modalPerfil = document.getElementById('modal-perfil');
        if (modalPerfil) modalPerfil.classList.add('hidden');

        const modalConfig = document.getElementById('modal-config');
        if (modalConfig) {
            modalConfig.style.display = 'none';
            modalConfig.classList.add('hidden');
        }

        const menu = document.getElementById('menu-lateral');
        if (menu) menu.classList.remove('abierto');

        const overlay = document.getElementById('overlay');
        if (overlay) overlay.classList.add('hidden');

        document.body.style.overflow = 'auto';

        if (history.state && history.state.modal === 'perfil') {
            history.back();
        }
    },

    navegar: (idVista) => {
        const vistaBiblia = document.getElementById('vista-biblia');
        if (vistaBiblia && vistaBiblia.classList.contains('activa') && idVista !== 'vista-biblia') {
            if (typeof Notas !== 'undefined') { Notas.guardarFinal(true); Notas.cerrar(); }
        }

        document.querySelectorAll('.vista').forEach(v => {
            v.classList.remove('activa');
            v.style.display = 'none';
        });

        const nuevaVista = document.getElementById(idVista);
        if (nuevaVista) {
            nuevaVista.classList.add('activa');
            if (idVista === 'vista-setup' || idVista === 'vista-kerygma') nuevaVista.style.display = 'flex';
            else nuevaVista.style.display = 'block';
        }

        // --- NUEVO: OCULTAR BARRA AUTOMÁTICAMENTE ---
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            if (idVista === 'vista-kerygma' || idVista === 'vista-setup') {
                bottomNav.style.display = 'none'; // Oculta en Kerygma
            } else if (idVista === 'vista-inicio' || idVista === 'vista-biblia') {
                bottomNav.style.display = 'flex'; // Muestra en Inicio
            }
        }
        // --------------------------------------------

        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        let activeIndex = -1;
        if (idVista === 'vista-inicio') activeIndex = 0;
        else if (idVista === 'vista-biblia') activeIndex = 1;

        if (activeIndex !== -1 && navItems[activeIndex]) {
            navItems[activeIndex].classList.add('active');
        }

        if (idVista === 'vista-biblia') {
            if (typeof Lectura !== 'undefined') setTimeout(Lectura.render, 50);
        }
        
        App.cerrarTodo();
        window.scrollTo(0, 0);
    },

    cerrarIA: () => {
        const panel = document.getElementById('panel-ia');
        if (panel) panel.classList.remove('abierto');

        // --- RESTAURAR BARRA CORRECTAMENTE ---
        const bottomNav = document.querySelector('.bottom-nav');
        const esInicio = document.getElementById('vista-inicio') && document.getElementById('vista-inicio').classList.contains('activa');
        const esBiblia = document.getElementById('vista-biblia') && document.getElementById('vista-biblia').classList.contains('activa');
        
        if (bottomNav && (esInicio || esBiblia)) bottomNav.style.display = 'flex';
        // -------------------------------------

        if (typeof versiculoSeleccionado !== 'undefined' && !versiculoSeleccionado) {
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.classList.add('hidden');
        }

        if (history.state && history.state.modal === 'ia') {
            App.ignoreNextPop = true;
            history.back();
        }
    },

    cerrarTodo: () => {
        const barra = document.getElementById('barra-acciones');
        if (barra) barra.classList.remove('visible');
        App.cerrarIA();

        // --- RESTAURAR BARRA POR SEGURIDAD ---
        const bottomNav = document.querySelector('.bottom-nav');
        const esInicio = document.getElementById('vista-inicio') && document.getElementById('vista-inicio').classList.contains('activa');
        const esBiblia = document.getElementById('vista-biblia') && document.getElementById('vista-biblia').classList.contains('activa');
        
        if (bottomNav && (esInicio || esBiblia)) bottomNav.style.display = 'flex';
        // -------------------------------------

        if (typeof Lectura !== 'undefined') Lectura.cerrarSeleccion();

        if (typeof versiculoSeleccionado !== 'undefined' && !versiculoSeleccionado) {
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.classList.add('hidden');
        }
    },
// --- NUEVAS FUNCIONES DE CONTROL DE NOCHE ---
toggleModoOscuro: () => {
        // Al tocar manualmente, apagamos la automatización para que no haya conflicto
        localStorage.setItem('noema-auto-noche', 'false');
        const swAuto = document.getElementById('switch-auto-noche');
        if (swAuto) swAuto.checked = false;
        
        document.body.classList.toggle('dark');
        const esOscuro = document.body.classList.contains('dark');
        localStorage.setItem('noema-tema', esOscuro ? 'oscuro' : 'claro');
        
        const swModo = document.getElementById('switch-modo-oscuro');
        if (swModo) swModo.checked = esOscuro;
    },
    
    // --- NUEVAS FUNCIONES DE CONTROL DE NOCHE ---
toggleModoOscuro: () => {
        // 1. Apagamos el automático para que tú tengas el control
        localStorage.setItem('noema-auto-noche', 'false');
        const swAuto = document.getElementById('switch-auto-noche');
        if (swAuto) swAuto.checked = false;
        
        // 2. Alternamos el color real de la app
        document.body.classList.toggle('dark');
        const esOscuro = document.body.classList.contains('dark');
        localStorage.setItem('noema-tema', esOscuro ? 'oscuro' : 'claro');
        
        // 3. Movemos la bolita de la luna visualmente
        const swModo = document.getElementById('switch-modo-oscuro');
        if (swModo) swModo.checked = esOscuro;
    },
    
    toggleAutoNoche: () => {
        const swAuto = document.getElementById('switch-auto-noche');
        if (!swAuto) return;
        
        // Invertimos el switch manualmente porque bloqueamos el click nativo
        const nuevoEstado = !swAuto.checked;
        swAuto.checked = nuevoEstado;
        localStorage.setItem('noema-auto-noche', nuevoEstado);
        
        if (nuevoEstado) {
            // Si SE ENCIENDE, aplica la hora
            const hora = new Date().getHours();
            if (hora >= 19 || hora < 6) document.body.classList.add('dark');
            else document.body.classList.remove('dark');
        }
        // Si SE APAGA, no cambiamos el color (te deja la pantalla como está para que tú la cambies manual).
        
        // Sincronizar el switch de la luna
        const swModo = document.getElementById('switch-modo-oscuro');
        if (swModo) swModo.checked = document.body.classList.contains('dark');
    },

   abrirIA: () => {
        history.pushState({ modal: 'ia' }, "");
        const panelIA = document.getElementById('panel-ia');
        const overlay = document.getElementById('overlay');
        const menuLateral = document.getElementById('menu-lateral');
        
        // Ocultar barra de navegación inferior
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) bottomNav.style.display = 'none';
        
        // --- NUEVO: Mostrar opciones SOLO si el historial está vacío ---
        const chatHistorial = document.getElementById('chat-historial');
        const sugerencias = document.querySelector('.sugerencias-container');
        if (chatHistorial && sugerencias) {
            if (chatHistorial.children.length === 0) {
                sugerencias.style.display = 'flex';
                setTimeout(() => sugerencias.classList.remove('oculto'), 10);
            } else {
                sugerencias.classList.add('oculto');
                sugerencias.style.display = 'none';
            }
        }
        // ---------------------------------------------------------------
        
        if (panelIA) {
            panelIA.style.display = 'flex';
            panelIA.classList.remove('hidden');
            setTimeout(() => { panelIA.classList.add('abierto'); }, 10);
        }
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'block';
            overlay.style.zIndex = '9999';
        }
        if (menuLateral && menuLateral.classList.contains('abierto')) menuLateral.classList.remove('abierto');
    },

    cerrarIA: () => {
        const panel = document.getElementById('panel-ia');
        if (panel) panel.classList.remove('abierto');

        // Mostrar barra de navegación inferior SOLO si estamos en inicio
        const bottomNav = document.querySelector('.bottom-nav');
        const esInicio = document.getElementById('vista-inicio') && document.getElementById('vista-inicio').classList.contains('activa');
        if (bottomNav && esInicio) bottomNav.style.display = '';

        if (typeof versiculoSeleccionado !== 'undefined' && !versiculoSeleccionado) {
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.classList.add('hidden');
        }

        if (history.state && history.state.modal === 'ia') {
            App.ignoreNextPop = true;
            history.back();
        }
    },

    cerrarTodo: () => {
        const barra = document.getElementById('barra-acciones');
        if (barra) barra.classList.remove('visible');
        App.cerrarIA();

        // Mostrar barra de navegación inferior por seguridad (Solo en inicio)
        const bottomNav = document.querySelector('.bottom-nav');
        const esInicio = document.getElementById('vista-inicio') && document.getElementById('vista-inicio').classList.contains('activa');
        if (bottomNav && esInicio) bottomNav.style.display = '';

        if (typeof Lectura !== 'undefined') Lectura.cerrarSeleccion();

        if (typeof versiculoSeleccionado !== 'undefined' && !versiculoSeleccionado) {
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.classList.add('hidden');
        }
    }
};

/* ==========================================================================
   MÓDULO CONFIGURACIÓN & MANUAL (CON ANIMACIÓN DE ACTUALIZACIÓN)
   ========================================================================== */
const Configuracion = {

    abrir: () => {




        const switchOscuro = document.getElementById('switch-modo-oscuro');
        if (switchOscuro) {
            switchOscuro.checked = document.body.classList.contains('dark');
        }

        history.pushState({ modal: 'config' }, "");
        const m = document.getElementById('modal-config');
        if (m) {
            m.classList.remove('hidden');
            m.style.display = 'flex';
        }

        const menu = document.getElementById('menu-lateral');
        if (menu) menu.classList.remove('abierto');
    },

    cerrar: () => {
        const m = document.getElementById('modal-config');
        if (m) m.classList.add('hidden');
        if (history.state && history.state.modal === 'config') {
            App.ignoreNextPop = true;
            history.back();
        }
    },

    verAcercaDe: () => {
        const modal = document.getElementById('modal-acerca');
        const cuerpo = document.getElementById('cuerpo-acerca');
        const titulo = modal.querySelector('h3');

        if (titulo) titulo.innerText = "Sobre el Proyecto";

        const iconLogo = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8e44ad" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block; margin: 0 auto 15px auto;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>`;

        cuerpo.innerHTML = `
            <style>
                .about-container { text-align: left; font-size: 0.9rem; line-height: 1.7; color: var(--text); padding: 0 10px; }
                .about-highlight { color: #8e44ad; font-weight: 700; }
                .about-footer { margin-top: 30px; text-align: center; font-size: 0.75rem; opacity: 0.5; border-top: 1px solid var(--border); padding-top: 15px; }
            </style>
            ${iconLogo}
            <div class="about-container">
                <p><strong>NÔEMA</strong> es más que una aplicación; es una herramienta de estudio bíblico diseñada para conectar la profundidad teológica con la tecnología moderna.</p>
                <p>Nuestro propósito es facilitar el acceso a las Escrituras a través de una interfaz limpia, libre de distracciones y enriquecida con herramientas de inteligencia artificial y diseño gráfico.</p>
                <p>Versión actual: <span class="about-highlight">5.0.3 Premium</span></p>
                <div class="about-footer">© 2026 Nôema Project.<br>"Porque la palabra de Dios es viva y eficaz."<br>Hebreos 4:12</div>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    verGuia: () => {
        const modal = document.getElementById('modal-acerca');
        const cuerpo = document.getElementById('cuerpo-acerca');
        const titulo = modal.querySelector('h3');

        if (titulo) titulo.innerText = "Manual de Usuario";

        const iBook = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;
        const iTouch = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-5 0v5"></path><path d="M14 10V4a2 2 0 0 0-5 0v6"></path><path d="M10 10.5V6a2 2 0 0 0-5 0v4"></path><path d="M18 11a4 4 0 0 1-3.09 3.9L9 16.5l-4-3-3 3 9.77 8.35c1.65 1.41 4.23.8 4.23-1.35V11"></path></svg>`;
        const iSplit = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`;
        const iMagic = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.2L3 12l5.8 1.9a2 2 0 0 1 1.2 1.2L12 21l1.9-5.8a2 2 0 0 1 1.2-1.2L21 12l-5.8-1.9a2 2 0 0 1-1.2-1.2L12 3Z"/></svg>`;

        cuerpo.innerHTML = `
            <style>
                .manual-container { text-align: left; padding: 0 5px; }
                .manual-section { margin-bottom: 30px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
                .manual-section:last-child { border: none; }
                .manual-head { color: #8e44ad; font-weight: 800; font-family: 'Montserrat', sans-serif; margin-bottom: 15px; font-size: 1rem; letter-spacing: -0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 10px; }
                .manual-item { margin-bottom: 15px; display: flex; align-items: flex-start; gap: 12px; }
                .manual-bullet { min-width: 6px; height: 6px; background: #8e44ad; border-radius: 50%; margin-top: 8px; }
                .manual-content h4 { margin: 0 0 4px 0; font-size: 0.9rem; font-weight: 700; color: var(--text); }
                .manual-content p { margin: 0; font-size: 0.85rem; line-height: 1.6; color: var(--text); opacity: 0.8; }
                .manual-tag { font-size: 0.7rem; font-weight: 800; background: rgba(142,68,173,0.15); color: #8e44ad; padding: 2px 6px; border-radius: 4px; margin-left: 5px; text-transform: uppercase; }
            </style>
            <div class="manual-container">
                <div class="manual-section">
                    <div class="manual-head">${iBook} La Barra Superior</div>
                    <div class="manual-item"><div class="manual-bullet"></div><div class="manual-content"><h4>Selector de Libro (Izquierda)</h4><p>Muestra el pasaje actual. Toca para buscar rápidamente.</p></div></div>
                    <div class="manual-item"><div class="manual-bullet"></div><div class="manual-content"><h4>Selector de Versión <span class="manual-tag">Truco</span></h4><p><strong>Toque simple:</strong> Cambia versión.<br><strong>Mantener presionado:</strong> Activa Pantalla Dividida.</p></div></div>
                    <div class="manual-item"><div class="manual-bullet"></div><div class="manual-content"><h4>Botón NÔEMA (Derecha)</h4><p>Invoca a la IA para explicar el capítulo.</p></div></div>
                </div>
                <div class="manual-section">
                    <div class="manual-head">${iTouch} Interacción</div>
                    <div class="manual-item"><div class="manual-bullet"></div><div class="manual-content"><h4>Crear Imagen <span class="manual-tag">Premium</span></h4><p>Al seleccionar un verso, toca "IMAGEN" para abrir el estudio de diseño.</p></div></div>
                </div>
                <div class="manual-section">
                    <div class="manual-head">${iSplit} Personalización</div>
                    <div class="manual-item"><div class="manual-bullet"></div><div class="manual-content"><h4>Tamaño de Barra</h4><p>En Ajustes, usa los botones <strong>+</strong> y <strong>-</strong> para cambiar el tamaño de la cabecera.</p></div></div>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    // --- NUEVA FUNCIÓN DE ACTUALIZACIÓN ANIMADA ---
    reiniciarApp: () => {
        // 1. Inyectar HTML del modal si no existe
        if (!document.getElementById('modal-update')) {
            const div = document.createElement('div');
            div.id = 'modal-update';
            div.innerHTML = `
                <div class="update-content">
                    <div class="update-title">Actualizando Sistema</div>
                    <div class="progress-track">
                        <div id="update-bar-fill" class="progress-fill"></div>
                    </div>
                    <div id="update-text" class="progress-text">0%</div>
                </div>
            `;
            document.body.appendChild(div);
        }

        // 2. Mostrar Modal
        const modal = document.getElementById('modal-update');
        const bar = document.getElementById('update-bar-fill');
        const text = document.getElementById('update-text');

        // Cerrar otros modales para limpiar la vista
        Configuracion.cerrar();
        modal.classList.add('activo');

        // 3. Iniciar Animación
        let progress = 0;

        const interval = setInterval(async () => {
            // Incremento no lineal para sentirlo más natural
            progress += Math.floor(Math.random() * 5) + 1;

            if (progress > 100) progress = 100;

            // Actualizar UI
            bar.style.width = `${progress}%`;
            text.innerText = `${progress}%`;

            // 4. AL LLEGAR AL 50%: Limpieza de datos (Invisible)
            if (progress > 50 && progress < 60 && !window.cleanDone) {
                window.cleanDone = true;

                // Backup
                const backup = {
                    user: localStorage.getItem('noema-user'),
                    avatar: localStorage.getItem('noema-avatar'),
                    genero: localStorage.getItem('noema-genero'),
                    cumple: localStorage.getItem('noema-cumple'),
                    setup: localStorage.getItem('noema-setup-complete'),
                    barScale: localStorage.getItem('noema-bar-scale-val') // Guardamos el tamaño de barra también
                };

                localStorage.clear();

                // Restaurar
                if (backup.user) localStorage.setItem('noema-user', backup.user);
                if (backup.avatar) localStorage.setItem('noema-avatar', backup.avatar);
                if (backup.genero) localStorage.setItem('noema-genero', backup.genero);
                if (backup.cumple) localStorage.setItem('noema-cumple', backup.cumple);
                if (backup.setup) localStorage.setItem('noema-setup-complete', backup.setup);
                if (backup.barScale) localStorage.setItem('noema-bar-scale-val', backup.barScale);

                // Service Workers
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) await registration.unregister();
                }
            }

            // 5. AL LLEGAR AL 100%: Recarga
            if (progress === 100) {

                // --- NUEVO: GUARDAR VERSIÓN PARA QUITAR LA ALERTA ---
                // Esto confirma que la actualización fue exitosa
                if (typeof App !== 'undefined') {
                    localStorage.setItem('noema-version-instalada', App.version);
                }
                // ----------------------------------------------------

                clearInterval(interval);
                setTimeout(() => {
                    window.location.reload(true);
                }, 200); // Pequeña pausa al final
            }

        }, 30); // Velocidad de la animación
    }
};
/* ==========================================================================
   MÓDULO LECTURA: VERSIÓN PERFECTA (ALINEADA Y BARRA INTEGRADA)
   ========================================================================== */
const Lectura = {
    versionActual: 'RV1960',
    versionSecundaria: 'RV1960',
    destinoVersion: 'primaria',

    cargarJson: async (version) => {
        if (typeof BIBLIAS !== 'undefined' && BIBLIAS[version]?.data) return true;
        if (window.BIBLIAS && window.BIBLIAS[version]) {
            if (typeof BIBLIAS === 'undefined') window.BIBLIAS = {};
            BIBLIAS[version] = window.BIBLIAS[version];
            BIBLIAS[version].data = window.BIBLIAS[version];
            return true;
        }
        return false;
    },

    abrirMenuVersiones: (esSecundario) => {
        Lectura.destinoVersion = esSecundario ? 'secundaria' : 'primaria';
        const modal = document.getElementById('modal-versiones');
        if (modal) modal.classList.remove('hidden');
    },

    cambiarVersion: async (ver) => {
        const cargada = await Lectura.cargarJson(ver);
        if (cargada) {
            if (Lectura.destinoVersion === 'secundaria') {
                Lectura.versionSecundaria = ver;
                State.versionSec = ver;
                Lectura.renderSecundario();
            } else {
                Lectura.versionActual = ver;
                State.version = ver;
                localStorage.setItem('noema-version', ver);
                Lectura.render();
            }
            document.getElementById('modal-versiones').classList.add('hidden');
            Lectura.destinoVersion = 'primaria';
        }
    },

    // --- RENDERIZADO PRINCIPAL (ARRIBA) ---
    render: () => {
        let versionAUsar = State.version || Lectura.versionActual;
        let data = BIBLIAS[versionAUsar]?.data || BIBLIAS['RV1960']?.data;
        if (!data || !data[State.libro]) return;

        if (typeof Historial !== 'undefined' && Historial.agregar) {
            Historial.agregar('lectura', `${State.libro} ${State.cap}`, { libro: State.libro, cap: State.cap });
        }

        const btnLibro = document.getElementById('btn-selector-libro');
        if (btnLibro) btnLibro.innerHTML = `<span onclick="event.stopPropagation(); App.navegar('vista-inicio')" style="opacity:0.6; margin-right:5px; cursor:pointer;">←</span> ${State.libro} ${State.cap} ▾`;

        const btnVersion = document.getElementById('btn-selector-version');
        if (btnVersion) {
            btnVersion.innerText = versionAUsar;
            btnVersion.onclick = () => Lectura.abrirMenuVersiones(false);
        }

        const contenedor = document.getElementById('area-lectura');
        if (!contenedor) return;
        contenedor.innerHTML = '';
        contenedor.style.fontSize = (State.font || 100) + '%';

        const versiculos = data[State.libro][State.cap];
        if (versiculos) {
            Object.keys(versiculos).sort((a, b) => Number(a) - Number(b)).forEach(v => {
                const colorGuardado = localStorage.getItem(`mark-${versionAUsar}-${State.libro}-${State.cap}-${v}`) || '';
                const div = document.createElement('div');
                div.className = 'versiculo';
                div.id = `v-${v}`;
                div.style.backgroundColor = colorGuardado;

                // Alineación estándar para la principal
                div.style.padding = '5px 20px';

                let pressTimer;
                const startPress = () => {
                    if (document.getElementById('barra-acciones').classList.contains('visible')) return;
                    pressTimer = setTimeout(() => { Lectura.activarModoSeleccion(v, div); if (navigator.vibrate) navigator.vibrate(50); }, 500);
                };
                const cancelPress = () => clearTimeout(pressTimer);
                div.addEventListener('touchstart', startPress, { passive: true });
                div.addEventListener('touchend', cancelPress);
                div.addEventListener('touchmove', cancelPress);
                div.onclick = () => {
                    const barra = document.getElementById('barra-acciones');
                    if (barra && barra.classList.contains('visible')) { div.classList.toggle('seleccionado'); Lectura.recalcularTextoSeleccionado(); }
                };
                div.oncontextmenu = (e) => e.preventDefault();

                div.innerHTML = `<sup>${v}</sup> ${versiculos[v]}`;
                contenedor.appendChild(div);
            });
        }

        if (typeof SplitScreen !== 'undefined' && SplitScreen.activo) {
            Lectura.renderSecundario();
        }
    },

    // --- RENDERIZADO SECUNDARIO (ABAJO) - BARRA INTEGRADA Y ALINEADA ---
    renderSecundario: async () => {
        const area = document.getElementById('area-lectura-secundaria');
        if (!area || area.classList.contains('hidden')) return;

        // 1. LIMPIEZA TOTAL: Quitamos márgenes del contenedor para controlar todo nosotros
        area.style.background = 'transparent';
        area.style.padding = '0';
        area.style.margin = '0';
        area.style.fontSize = (State.font || 100) + '%'; // Mismo tamaño que arriba

        const verSec = Lectura.versionSecundaria || 'RV1960';
        await Lectura.cargarJson(verSec);

        let data = BIBLIAS[verSec]?.data || BIBLIAS['RV1960']?.data;
        if (!data) return;

        if (!data[State.libro] || !data[State.libro][State.cap]) {
            area.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.5; font-size: 0.8rem;">Pasaje no disponible.</div>';
            return;
        }

        // --- HEADER INTEGRADO (Full Width, Mismo Color, Sin Bordes) ---
        const headerHTML = `
            <div style="
                position: sticky; 
                top: 0; 
                z-index: 50; 
                width: 100%;
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                
                /* Mismo color del fondo (con toque de transparencia para efecto blur) */
                background: color-mix(in srgb, var(--bg) 96%, transparent);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                
                /* SIN BORDES */
                border: none;
                
                /* Padding alineado con el texto (20px laterales) */
                padding: 6px 20px;
                margin: 0;
            ">
                <span style="
                    font-family: 'Cinzel', serif; 
                    font-size: 0.75rem; 
                    font-weight: bold; 
                    color: var(--text); 
                    opacity: 0.7; 
                    letter-spacing: 1px;
                ">
                    ${State.libro} ${State.cap}
                </span>
                
                <button id="btn-version-secundaria" 
                    onclick="Lectura.abrirMenuVersiones(true)" 
                    style="
                        background: transparent; 
                        border: none; 
                        color: #8e44ad; 
                        font-size: 0.75rem; 
                        cursor: pointer; 
                        font-weight: bold; 
                        padding: 2px 5px;
                    ">
                    ${verSec} ▾
                </button>
            </div>
        `;

        let contenidoHTML = '';
        const versiculos = data[State.libro][State.cap];

        Object.keys(versiculos).sort((a, b) => Number(a) - Number(b)).forEach(v => {
            contenidoHTML += `
                <div class="versiculo versiculo-sec" style="
                    /* ALINEACIÓN PERFECTA: Usamos el mismo padding que la barra y la biblia de arriba */
                    padding: 5px 20px; 
                    margin-bottom: 2px;
                    line-height: 1.5;
                    width: 100%;
                    box-sizing: border-box;
                ">
                    <sup style="color: #8e44ad; font-weight: bold; margin-right: 5px; font-size: 0.75em;">${v}</sup>
                    <span style="opacity: 0.9;">${versiculos[v]}</span>
                </div>`;
        });

        area.innerHTML = headerHTML + `<div style="padding-bottom: 30px;">${contenidoHTML}</div>`;
        area.scrollTop = 0;
    },

    // --- UTILIDADES ---
    activarModoSeleccion: (numero, elementoDOM) => {
        const barra = document.getElementById('barra-acciones');
        if (barra) { barra.classList.remove('hidden'); setTimeout(() => barra.classList.add('visible'), 10); }
        elementoDOM.classList.add('seleccionado');
        State.selRef = `${State.libro} ${State.cap}:${numero}`;
        Lectura.recalcularTextoSeleccionado();
    },

    recalcularTextoSeleccionado: () => {
        const seleccionados = document.querySelectorAll('.versiculo.seleccionado');
        if (seleccionados.length > 0) {
            const textos = Array.from(seleccionados).map(v => v.innerText.replace(/^\d+\s*/, '').trim());
            State.selTexto = textos.join('\n\n');
            const primerId = seleccionados[0].id.replace('v-', '');
            State.selRef = `${State.libro} ${State.cap}:${primerId}`;
        } else {
            State.selTexto = '';
            Lectura.cerrarSeleccion();
        }
    },

    cerrarSeleccion: () => {
        document.querySelectorAll('.versiculo.seleccionado').forEach(v => v.classList.remove('seleccionado'));
        const barra = document.getElementById('barra-acciones');
        if (barra) barra.classList.remove('visible');
        State.selTexto = '';
    },

    resaltar: (color) => {
        try {
            const seleccionados = document.querySelectorAll('.versiculo.seleccionado');
            seleccionados.forEach(div => {
                const n = div.id.replace('v-', '');
                const key = `mark-${State.version}-${State.libro}-${State.cap}-${n}`;
                if (!color || color === 'transparent') localStorage.removeItem(key);
                else localStorage.setItem(key, color);
            });
            Lectura.render();
        } catch (e) { } finally { Lectura.cerrarSeleccion(); }
    },

    copiar: () => {
        if (!State.selTexto) return;
        const textoFull = `${State.selTexto}\n(${State.selRef})`;
        if (navigator.clipboard) navigator.clipboard.writeText(textoFull).then(() => alert("Copiado"));
        else {
            const t = document.createElement("textarea"); t.value = textoFull; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); alert("Copiado");
        }
        Lectura.cerrarSeleccion();
    },

    compartir: async () => {
        if (!State.selTexto) return;
        try { await navigator.share({ title: 'Nôema', text: `"${State.selTexto}"\n\n📖 ${State.selRef}` }); } catch (e) { Lectura.copiar(); }
        Lectura.cerrarSeleccion();
    },

    ajustarFuente: (delta) => {
        State.font = Math.max(60, Math.min(250, (State.font || 100) + delta));
        localStorage.setItem('noema-font', State.font);

        const area = document.getElementById('area-lectura');
        if (area) area.style.fontSize = State.font + '%';

        const areaSec = document.getElementById('area-lectura-secundaria');
        if (areaSec) areaSec.style.fontSize = State.font + '%';

        ['indicador-fuente', 'conf-indicador-barra'].forEach(id => { const el = document.getElementById(id); if (el) el.innerText = State.font + '%'; });
    },

    capituloSiguiente: () => { State.cap++; Lectura.render(); document.getElementById('scroll-wrapper-sup').scrollTop = 0; },
    capituloAnterior: () => { if (State.cap > 1) { State.cap--; Lectura.render(); document.getElementById('scroll-wrapper-sup').scrollTop = 0; } }
};
/* ==========================================================================
   MÓDULO RESALTADOS (REVISIÓN PARA COMPATIBILIDAD)
   ========================================================================== */
const Resaltados = {
    abrir: () => {
        history.pushState({ modal: 'resaltados' }, null, '');
        const contenedor = document.getElementById('lista-resaltados');
        if (!contenedor) return;
        contenedor.innerHTML = '';
        let hayResaltados = false;
        for (let i = 0; i < localStorage.length; i++) {
            const clave = localStorage.key(i);
            if (clave && clave.startsWith('mark-')) {
                hayResaltados = true;
                const color = localStorage.getItem(clave);
                const partes = clave.split('-');
                const ref = `${partes[2]} ${partes[3]}:${partes[4]}`;

                const div = document.createElement('div');
                div.className = 'card-shortcut';
                div.style.borderLeft = `8px solid ${color}`;
                div.style.marginBottom = '12px';
                div.style.padding = '15px';
                div.style.cursor = 'pointer';
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.alignItems = 'center';

                div.onclick = () => Resaltados.irA(partes[2], partes[3], partes[4]);

                div.innerHTML = `
                    <div style="pointer-events: none;">
                        <small style="opacity:0.6; font-weight:bold; display:block; text-transform:uppercase;">${partes[1]}</small>
                        <p style="margin:5px 0; font-weight:bold; font-size:1.1rem; color:var(--text);">${ref}</p>
                    </div>
                    <span style="font-size:1.2rem; opacity:0.3;">➔</span>
                `;
                contenedor.appendChild(div);
            }
        }
        if (!hayResaltados) contenedor.innerHTML = '<p style="text-align:center; opacity:0.5; padding:40px;">No tienes versículos resaltados aún.</p>';
        document.getElementById('modal-resaltados').classList.remove('hidden');
    },

    cerrar: () => { document.getElementById('modal-resaltados').classList.add('hidden'); },

    irA: (libro, cap, v) => {
        State.libro = libro;
        State.cap = parseInt(cap);
        Resaltados.cerrar();
        App.navegar('vista-biblia');

        setTimeout(() => {
            Lectura.render();
            const el = document.getElementById(`v-${v}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.transition = "0.8s";
                el.style.boxShadow = "inset 0 0 10px rgba(241, 196, 15, 0.5)";
                setTimeout(() => { el.style.boxShadow = ""; }, 2000);
            }
        }, 150);
    }
};

// ============================================
// ESCUCHA GLOBAL PARA EL BOTÓN ATRÁS (MÓVILES)
// ============================================
window.onpopstate = (event) => {
    // Si cerramos selección
    if (document.getElementById('barra-acciones') &&
        document.getElementById('barra-acciones').classList.contains('visible')) {
        Lectura.cerrarSeleccion();
        return;
    }
    // Si cerramos resaltados
    if (!document.getElementById('modal-resaltados').classList.contains('hidden')) {
        Resaltados.cerrar();
        return;
    }
    // Si volvemos de una navegación
    if (event.state && event.state.vista) {
        App.navegar(event.state.vista);
    }
};
/* ==========================================================================
   MÓDULO HISTORIAL
   ========================================================================== */
const Historial = {
    // NUEVA LÓGICA: LECTURA + CHAT (Con Expiración 24h)
    KEY: 'noema_historial_mix',

    agregar: (tipo, titulo, data = {}) => {
        try {
            let historial = JSON.parse(localStorage.getItem(Historial.KEY) || "[]");
            const ahora = Date.now();
            const unDia = 24 * 60 * 60 * 1000;

            // 1. LIMPIEZA AUTOMÁTICA (> 24h)
            historial = historial.filter(item => (ahora - item.timestamp) < unDia);

            // 2. EVITAR DUPLICADOS CONSECUTIVOS RECIENTES
            if (historial.length > 0) {
                const ultimo = historial[0];
                if (ultimo.tipo === tipo && ultimo.titulo === titulo) {
                    // Si es lo mismo, solo actualizamos el timestamp para que suba
                    ultimo.timestamp = ahora;
                    ultimo.fechaFormato = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    // Reordenar: sacarlo y ponerlo al inicio
                    historial.splice(0, 1);
                    historial.unshift(ultimo);
                    localStorage.setItem(Historial.KEY, JSON.stringify(historial));
                    return;
                }
            }

            // 3. AGREGAR NUEVO
            const nuevoItem = {
                tipo: tipo, // 'lectura' | 'chat'
                titulo: titulo,
                data: data,
                timestamp: ahora,
                fechaFormato: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            };

            historial.unshift(nuevoItem);

            // Límite de seguridad
            if (historial.length > 50) historial.pop();

            localStorage.setItem(Historial.KEY, JSON.stringify(historial));
        } catch (e) { console.error("Error Historial:", e); }
    },

    abrir: () => {
        history.pushState({ modal: 'historial' }, null, '');
        const contenedor = document.getElementById('lista-historial');
        if (!contenedor) return;

        // Limpiar expirados al abrir
        let historial = JSON.parse(localStorage.getItem(Historial.KEY) || "[]");
        const ahora = Date.now();
        const unDia = 24 * 60 * 60 * 1000;
        const validos = historial.filter(item => (ahora - item.timestamp) < unDia);

        if (validos.length !== historial.length) {
            localStorage.setItem(Historial.KEY, JSON.stringify(validos));
            historial = validos;
        }

        contenedor.innerHTML = '';

        if (historial.length === 0) {
            contenedor.innerHTML = `
                <div style="text-align:center; opacity:0.5; margin-top:50px;">
                    <span style="font-size:3rem; display:block; margin-bottom:10px;">🕒</span>
                    <p>Tu actividad de las últimas 24h aparecerá aquí.</p>
                </div>`;
        } else {
            historial.forEach(item => {
                const div = document.createElement('div');
                div.className = 'card-shortcut';
                div.style.marginBottom = '10px';
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.justifyContent = 'space-between';
                div.style.padding = '15px 20px';
                div.style.cursor = 'pointer';

                // Icono según tipo
                let icono = '📖';
                let color = 'var(--text)';
                if (item.tipo === 'chat') { icono = '💬'; color = '#8e44ad'; }

                div.innerHTML = `
                    <div style="text-align:left; display:flex; align-items:center; gap:15px;">
                        <span style="font-size:1.5rem;">${icono}</span>
                        <div>
                            <h3 style="margin:0; font-size:1rem; color:${color};">${item.titulo}</h3>
                            <small style="opacity:0.6;">${item.fechaFormato}</small>
                        </div>
                    </div>
                    <span style="color:var(--primary); font-size:1.2rem;">➔</span>
                `;

                div.onclick = () => {
                    if (item.tipo === 'lectura') {
                        State.libro = item.data.libro;
                        State.cap = item.data.cap;
                        Historial.cerrar();
                        App.navegar('vista-biblia');
                        setTimeout(() => Lectura.render(), 100);
                    } else if (item.tipo === 'chat') {
                        // Navegar al chat y re-inyectar pregunta
                        Historial.cerrar();
                        App.abrirIA();
                        const input = document.getElementById('input-ia');
                        if (input) {
                            input.value = item.titulo;
                            // Opcional: Auto-enviar si se desea
                        }
                    }
                };

                contenedor.appendChild(div);
            });
        }

        document.getElementById('modal-historial').classList.remove('hidden');
    },

    cerrar: () => {
        document.getElementById('modal-historial').classList.add('hidden');
    },

    limpiar: () => {
        if (confirm("¿Borrar todo el historial?")) {
            localStorage.removeItem(Historial.KEY);
            Historial.abrir();
        }
    }
};

/* ==========================================================================
   MÓDULO SELECTOR (CON BUSCADOR FUNCIONAL)
   ========================================================================== */
const Selector = {
    abrir: () => {
        const modal = document.getElementById('modal-selector');
        if (modal) {
            modal.classList.remove('hidden');
            // Al abrir, renderizamos la lista de libros y limpiamos el buscador
            Selector.renderLibros();
            const input = document.getElementById('input-busqueda-libros');
            if (input) input.value = '';
        }
    },

    cerrar: (e, force) => {
        if (force || !e || e.target.id === 'modal-selector' || e.target.classList.contains('close-btn')) {
            document.getElementById('modal-selector').classList.add('hidden');
            // Restaurar vista de libros al cerrar
            Selector.verTab('libros');
        }
    },

    // Cambiar entre pestañas (Libro / Capítulo / Versículo)
    verTab: (tab) => {
        // Actualizar botones de tabs
        document.querySelectorAll('.selector-tabs .tab').forEach(t => t.classList.remove('active'));
        const btnTab = document.getElementById(`tab-${tab}`);
        if (btnTab) btnTab.classList.add('active');

        // Mostrar/Ocultar buscador dependiendo si estamos en "libros"
        const buscador = document.getElementById('search-container');
        if (buscador) buscador.style.display = (tab === 'libros') ? 'block' : 'none';

        // Lógica de renderizado según tab
        const lista = document.getElementById('lista-selector');
        if (!lista) return;
        lista.innerHTML = '';

        if (tab === 'libros') Selector.renderLibros();
        else if (tab === 'caps') Selector.renderCapitulos(State.libro);
        else if (tab === 'vers') Selector.renderVersiculos();
    },

    renderLibros: () => {
        const contenedor = document.getElementById('lista-selector');
        if (!contenedor) return;
        contenedor.innerHTML = '';

        const version = State.version || 'RV1960';
        // Aseguramos que existan datos
        if (!BIBLIAS[version] || !BIBLIAS[version].data) return;

        const libros = Object.keys(BIBLIAS[version].data);

        libros.forEach(libro => {
            const btn = document.createElement('button');
            btn.className = 'btn-item-selector'; // Clase para estilos si tienes
            // Estilos inline para asegurar apariencia grid
            btn.className = 'btn-item-selector';
            // Estilos movidos a CSS (estilos.css) para mejor control y animaciones

            btn.innerText = libro;
            btn.onclick = () => {
                State.libro = libro;
                Selector.verTab('caps'); // Pasar a capítulos automáticamente
            };
            contenedor.appendChild(btn);
        });
    },

    // --- AQUÍ ESTÁ LA FUNCIÓN DE FILTRADO QUE FALTABA ---
    filtrarLibros: (query) => {
        const contenedor = document.getElementById('lista-selector');
        if (!contenedor) return;

        // 1. Si no estamos en la tab de libros, forzamos ir a ella
        const tabActiva = document.querySelector('.selector-tabs .tab.active');
        if (tabActiva && tabActiva.id !== 'tab-libros') Selector.verTab('libros');

        // 2. Normalizar texto (quitar tildes y mayúsculas)
        const busqueda = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const botones = contenedor.getElementsByTagName('button');

        // 3. Filtrar
        for (let i = 0; i < botones.length; i++) {
            const btn = botones[i];
            const texto = btn.innerText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            if (texto.includes(busqueda)) {
                btn.style.display = ""; // Mostrar
            } else {
                btn.style.display = "none"; // Ocultar
            }
        }
    },

    renderCapitulos: (libro) => {
        if (!libro) return;
        const contenedor = document.getElementById('lista-selector');
        contenedor.innerHTML = '';

        const version = State.version || 'RV1960';
        const capitulos = BIBLIAS[version].data[libro];

        Object.keys(capitulos).sort((a, b) => Number(a) - Number(b)).forEach(cap => {
            const btn = document.createElement('button');
            btn.innerText = cap;
            // Estilos de botón cuadrado grande
            btn.style.padding = '15px';
            btn.style.background = (parseInt(cap) === State.cap) ? '#8e44ad' : 'rgba(255,255,255,0.05)';
            btn.style.color = (parseInt(cap) === State.cap) ? 'white' : 'var(--text)';
            btn.style.border = 'none';
            btn.style.borderRadius = '10px';
            btn.style.fontWeight = 'bold';

            btn.onclick = () => {
                State.cap = parseInt(cap);
                Lectura.render(); // Renderizar lectura
                Selector.cerrar(null, true); // Cerrar modal
            };
            contenedor.appendChild(btn);
        });
    },

    renderVersiculos: () => {
        // Opcional: si quieres selector de versículos, implementarlo aquí similar a capítulos
        const contenedor = document.getElementById('lista-selector');
        contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px; opacity:0.6;">Selecciona un capítulo primero para leer.</div>';
    },

    // Función auxiliar para abrir versión secundaria (comparar)
    abrirVersiones: (esSecundario) => {
        Lectura.abrirMenuVersiones(esSecundario);
    }
};

/* ==========================================================================
   MÓDULO DE NOTAS
   ========================================================================== */
const Notas = {
    notaActualId: null,

    abrir: () => {
        const tituloActual = document.getElementById('nota-titulo').value;
        const cuerpoActual = document.getElementById('nota-cuerpo').innerHTML;

        if (!Notas.notaActualId && !tituloActual && !cuerpoActual) {
            document.getElementById('nota-titulo').value = "";
            document.getElementById('nota-cuerpo').innerHTML = "";
        }

        // Push History State para manejar el botón Atrás
        history.pushState({ modal: 'notas' }, null, '');
        Notas.mostrarPanel();
    },

    editar: (id) => {
        const historial = JSON.parse(localStorage.getItem('noema_notas_db') || "[]");
        const nota = historial.find(n => n.id === id);

        if (nota) {
            Notas.notaActualId = id;
            document.getElementById('nota-titulo').value = nota.titulo;
            document.getElementById('nota-cuerpo').innerHTML = nota.contenido;

            MisNotas.cerrar();
            // Push History State aqui tambien
            history.pushState({ modal: 'notas' }, null, '');
            Notas.mostrarPanel();
        }
    },

    mostrarPanel: () => {
        const win = document.getElementById('win-notas');
        const backdrop = document.getElementById('notas-backdrop');

        if (win) {
            win.classList.remove('hidden');
            win.style.display = 'flex';
            setTimeout(() => win.classList.add('abierto'), 10);
        }
        if (backdrop) {
            backdrop.classList.remove('hidden');
            setTimeout(() => backdrop.classList.add('visible'), 10);
        }
    },

    cerrar: (fromPopstate = false) => {
        const win = document.getElementById('win-notas');
        const backdrop = document.getElementById('notas-backdrop');

        if (win) {
            win.classList.remove('abierto');
            setTimeout(() => {
                win.style.display = 'none';
                win.classList.add('hidden');
            }, 300);
        }
        if (backdrop) {
            backdrop.classList.remove('visible');
            setTimeout(() => backdrop.classList.add('hidden'), 300);
        }

        // Si cerramos con botón (no popstate), debemos hacer back para limpiar el historial
        if (!fromPopstate && history.state && history.state.modal === 'notas') {
            history.back();
        }
    },

    guardarFinal: (silencioso = false) => {
        const tituloEl = document.getElementById('nota-titulo');
        const cuerpoEl = document.getElementById('nota-cuerpo');
        const titulo = tituloEl.value.trim() || "Nota sin título";
        const cuerpo = cuerpoEl.innerHTML.trim();

        if (!cuerpo) {
            if (!silencioso && !Notas.notaActualId) alert("La nota está vacía");
            return;
        }

        let historial = JSON.parse(localStorage.getItem('noema_notas_db') || "[]");

        if (Notas.notaActualId) {
            const indice = historial.findIndex(n => n.id === Notas.notaActualId);
            if (indice !== -1) {
                historial[indice].titulo = titulo;
                historial[indice].contenido = cuerpo;
                historial[indice].fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) + " (Editado)";

                const notaEditada = historial.splice(indice, 1)[0];
                historial.unshift(notaEditada);
            }
        } else {
            const nuevaNota = {
                id: Date.now(),
                fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }),
                titulo: titulo,
                contenido: cuerpo,
                ref: State.selRef || ""
            };
            historial.unshift(nuevaNota);
        }

        localStorage.setItem('noema_notas_db', JSON.stringify(historial));

        tituloEl.value = "";
        cuerpoEl.innerHTML = "";
        Notas.notaActualId = null;

        if (!silencioso) {
            alert("Nota guardada");
            Notas.cerrar();
        }
    },

    formato: (cmd, value = null) => {
        document.execCommand(cmd, false, value);
        document.getElementById('nota-cuerpo').focus();
    },

    setColor: (color) => {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, color);
        const editor = document.getElementById('nota-cuerpo');
        if (editor) editor.focus();
    },

    init: () => {
        // Bloqueo de menú contextual nativo
        const cuerpo = document.getElementById('nota-cuerpo');
        if (cuerpo) {
            cuerpo.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
        }

        // Ajuste de viewport para teclado (Refinado)
        if (window.visualViewport) {
            const handleResize = () => {
                const win = document.getElementById('win-notas');
                if (!win || win.classList.contains('hidden')) return;

                // Forzar altura y posición para coincidir con el área visible
                win.style.height = `${window.visualViewport.height}px`;
                win.style.top = `${window.visualViewport.offsetTop}px`;

                // Asegurar que el contenido use el espacio restante
                const content = document.querySelector('.ios-content-area');
                if (content) {
                    content.style.flex = '1';
                    content.style.overflowY = 'auto';
                    content.style.height = 'auto'; // Resetear altura fija anterior
                }

                // Bloquear scroll del body
                window.scrollTo(0, 0);
            };

            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }
    }
};

const MisNotas = {
    abrir: () => {
        history.pushState({ modal: 'mis-notas' }, null, '');
        const contenedor = document.getElementById('lista-notas-guardadas');
        const historial = JSON.parse(localStorage.getItem('noema_notas_db') || "[]");
        contenedor.innerHTML = '';

        if (historial.length === 0) {
            contenedor.innerHTML = `<div style="text-align:center; opacity:0.5; margin-top:50px;"><span style="font-size:3rem;">📝</span><p>No tienes notas guardadas.</p></div>`;
        } else {
            historial.forEach(nota => {
                const div = document.createElement('div');
                div.className = 'card-shortcut';
                div.style.textAlign = 'left';
                div.style.marginBottom = '15px';
                div.style.display = 'block';
                div.style.cursor = 'pointer';

                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; pointer-events:none;">
                        <small style="color:var(--primary); font-weight:bold;">${nota.fecha}</small>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="pointer-events:none; flex:1;">
                            <h3 style="margin:0 0 5px 0; font-size:1.1rem;">${nota.titulo}</h3>
                            <p style="font-size:0.9rem; opacity:0.8; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                ${nota.contenido}
                            </p>
                        </div>
                        <div class="borrar" style="padding:10px; margin:-10px; cursor:pointer;">
                            <span style="font-size:1.2rem;">🗑️</span>
                        </div>
                    </div>
                `;

                div.querySelector('.borrar').onclick = (e) => {
                    e.stopPropagation();
                    MisNotas.borrar(nota.id, e);
                };

                div.onclick = (e) => {
                    if (!e.target.closest('.borrar')) Notas.editar(nota.id);
                };

                contenedor.appendChild(div);
            });
        }
        document.getElementById('modal-mis-notas').classList.remove('hidden');
    },

    cerrar: () => { document.getElementById('modal-mis-notas').classList.add('hidden'); },

    borrar: (id, e) => {
        if (e) e.stopPropagation();
        if (!confirm("¿Eliminar esta nota permanentemente?")) return;

        let historial = JSON.parse(localStorage.getItem('noema_notas_db') || "[]");
        historial = historial.filter(n => n.id !== id);
        localStorage.setItem('noema_notas_db', JSON.stringify(historial));
        MisNotas.abrir();
    }
};

/* ==========================================================================
   MÓDULO NOTIFICACIONES (CENTRO DE AVISOS)
   ========================================================================== */
const Notificaciones = {
    abrir: () => {
        Notificaciones.cargar();
        document.getElementById('panel-notificaciones').classList.add('abierto');
        const overlay = document.getElementById('overlay-notif');
        if (overlay) {
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.add('visible'), 10);
        }
        
        // Ocultar punto rojo al abrir y quitar la animación
        const dot = document.getElementById('notif-dot');
        if (dot) {
            dot.style.display = 'none';
            dot.classList.remove('activa'); // <--- NUEVO: Apaga el latido
        }
        localStorage.setItem('noema-last-notif-check', Date.now());
    },
    
    cerrar: () => {
        document.getElementById('panel-notificaciones').classList.remove('abierto');
        const overlay = document.getElementById('overlay-notif');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    },
    
    cargar: () => {
        const contenedor = document.getElementById('lista-notificaciones');
        if (!contenedor) return;
        
        let html = '';
        
        // 1. RECORDATORIO DEVOCIONAL
        const lecturaHoy = localStorage.getItem('noema-devocional-leido');
        const fechaHoy = new Date().toLocaleDateString();
        
        if (lecturaHoy !== fechaHoy) {
            html += `
                <div class="notif-section-title">Recordatorios</div>
                <div class="notif-card" onclick="App.abrirLecturaPanDiario(); Notificaciones.cerrar()" style="cursor:pointer;">
                    <div class="notif-icon-box bg-yellow">📖</div>
                    <div class="notif-info">
                        <h4>Pan Diario Pendiente</h4>
                        <p>Aún no has leído la porción de hoy. Toma un momento para meditar.</p>
                        <span class="notif-btn-action">LEER AHORA ➜</span>
                    </div>
                </div>
            `;
        }
        
        // 2. ACTUALIZACIONES (Historial)
        html += `<div class="notif-section-title" style="margin-top:25px;">Novedades v5.0.3</div>`;
        
        const updates = [
            { icono: '🎨', color: 'bg-purple', titulo: 'Nuevo Diseño Premium', desc: 'Interfaz renovada con estilo glassmorphism y mejor navegación.' },
            { icono: '👤', color: 'bg-blue', titulo: 'Mi Espacio', desc: 'Gestiona tu perfil, notas y resaltados desde un solo lugar.' },
            { icono: '⚡', color: 'bg-yellow', titulo: 'Modo Rápido', desc: 'Mantén presionado el selector de versión para pantalla dividida.' }
        ];
        
        updates.forEach(u => {
            html += `
                <div class="notif-card" style="cursor:default;">
                    <div class="notif-icon-box ${u.color}">${u.icono}</div>
                    <div class="notif-info">
                        <h4>${u.titulo}</h4>
                        <p>${u.desc}</p>
                    </div>
                </div>
            `;
        });
        
        // 3. TIPS PRO (Aleatorio)
        const tips = [
            "Puedes ajustar el tamaño de la fuente desde los Ajustes.",
            "Toca dos veces un versículo para seleccionarlo rápidamente.",
            "Usa el botón de micrófono para dictar tus notas.",
            "Invoca a Noema IA desde el botón flotante inferior."
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        html += `
            <div class="notif-section-title" style="margin-top:25px;">Tip Pro 💡</div>
            <div class="notif-card bg-purple" style="background:rgba(142,68,173,0.05);">
                <div class="notif-info" style="width:100%">
                    <p style="font-style:italic;">"${randomTip}"</p>
                </div>
            </div>
        `;
        
        contenedor.innerHTML = html;
        
        // Lógica de punto rojo (si hay devocional pendiente)
        const dot = document.getElementById('notif-dot');
        if (dot && lecturaHoy !== fechaHoy) {
            dot.classList.add('activa'); // <--- NUEVO: Enciende la animación de latido
        }
    },
    
    // Llamar al iniciar para verificar notificaciones pendientes
    init: () => {
        setTimeout(Notificaciones.cargar, 2000);
    }
};

// Auto-init si App ya cargó
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => setTimeout(Notificaciones.init, 1000));
}
/* ==========================================================================
   MÓDULO EDITOR DE FOTO (PERFIL)
   ========================================================================== */
const Editor = {
    img: new Image(), canvas: null, ctx: null,

    // Ajustes de imagen
    brightness: 100,
    contrast: 100,

    // Texto
    overlayText: "",
    fontFamilyKey: "system",
    fontSize: 24,
    scale: 1, posX: 0, posY: 0,
    isDragging: false, lastX: 0, lastY: 0, lastDist: 0,
    targetImgId: null,

    abrir: (file, targetId) => {
        Editor.targetImgId = targetId;
        const r = new FileReader();
        r.onload = (ev) => {
            Editor.img.src = ev.target.result;
            Editor.img.onload = () => {
                // Ocultar modal perfil temporalmente si está abierto
                // NO cerramos perfil, solo superponemos el recorte.
                // Ocultamos para menor ruido visual si se quiere
                // document.getElementById('modal-perfil').classList.add('hidden');

                const modal = document.getElementById('modal-recorte');
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                Editor.init();
            };
        };
        r.readAsDataURL(file);
    },

    init: () => {
        Editor.canvas = document.getElementById('canvas-crop');
        Editor.ctx = Editor.canvas.getContext('2d');

        // Ajustar Canvas al tamaño real del contenedor (CSS 280x280)
        Editor.canvas.width = 280;
        Editor.canvas.height = 280;

        // Reset
        const ratio = Math.max(280 / Editor.img.width, 280 / Editor.img.height);
        Editor.scale = ratio;
        Editor.posX = (280 - Editor.img.width * ratio) / 2;
        Editor.posY = (280 - Editor.img.height * ratio) / 2;
        Editor.lastDist = 0;

        // Listeners (remover anteriores si existen para evitar duplicados sería ideal, pero overwrite es ok)
        // Importante: usar { passive: false } para prevenir scroll/zoom del navegador

        const c = Editor.canvas;
        c.ontouchstart = Editor.handleTouchStart;
        c.ontouchmove = Editor.handleTouchMove;
        c.ontouchend = () => { Editor.isDragging = false; Editor.lastDist = 0; };

        // Mouse support for desktop testing
        c.onmousedown = (e) => {
            Editor.isDragging = true;
            Editor.lastX = e.offsetX - Editor.posX;
            Editor.lastY = e.offsetY - Editor.posY;
        };
        c.onmousemove = (e) => {
            if (Editor.isDragging) {
                Editor.posX = e.offsetX - Editor.lastX;
                Editor.posY = e.offsetY - Editor.lastY;
                Editor.draw();
                Editor.iniciarControles();
            }
        };
        c.onmouseup = () => Editor.isDragging = false;
        c.onmouseleave = () => Editor.isDragging = false;

        Editor.draw();
    },


    iniciarControles: () => {
        const brillo = document.getElementById('ctrl-brillo');
        const contraste = document.getElementById('ctrl-contraste');
        const texto = document.getElementById('ctrl-texto');
        const fuente = document.getElementById('ctrl-fuente');
        const tamano = document.getElementById('ctrl-tamano');

        if (brillo) brillo.value = String(Editor.brightness || 100);
        if (contraste) contraste.value = String(Editor.contrast || 100);
        if (texto) texto.value = Editor.overlayText || "";
        if (fuente) fuente.value = Editor.fontFamilyKey || "system";
        if (tamano) tamano.value = String(Editor.fontSize || 24);

        const bindOnce = (el, fn) => {
            if (!el || el.dataset.bound === "1") return;
            el.addEventListener('input', fn);
            el.dataset.bound = "1";
        };

        bindOnce(brillo, () => { Editor.brightness = Number(brillo.value) || 100; Editor.draw(); });
        bindOnce(contraste, () => { Editor.contrast = Number(contraste.value) || 100; Editor.draw(); });
        bindOnce(texto, () => { Editor.overlayText = texto.value || ""; Editor.draw(); });
        bindOnce(fuente, () => { Editor.fontFamilyKey = fuente.value || "system"; Editor.draw(); });
        bindOnce(tamano, () => { Editor.fontSize = Number(tamano.value) || 24; Editor.draw(); });
    },

    handleTouchStart: (e) => {
        if (e.cancelable) e.preventDefault(); // STOP BROWSER ZOOM
        e.stopPropagation();

        if (e.touches.length === 1) {
            Editor.isDragging = true;
            // Usar coordenadas relativas al canvas
            const rect = Editor.canvas.getBoundingClientRect();
            Editor.lastX = e.touches[0].clientX - rect.left - Editor.posX;
            Editor.lastY = e.touches[0].clientY - rect.top - Editor.posY;
        } else if (e.touches.length === 2) {
            Editor.isDragging = false;
            Editor.lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
    },

    handleTouchMove: (e) => {
        if (e.cancelable) e.preventDefault(); // STOP BROWSER ZOOM
        e.stopPropagation();

        if (e.touches.length === 1 && Editor.isDragging) {
            const rect = Editor.canvas.getBoundingClientRect();
            Editor.posX = e.touches[0].clientX - rect.left - Editor.lastX;
            Editor.posY = e.touches[0].clientY - rect.top - Editor.lastY;
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            if (Editor.lastDist > 0) {
                const zoomFactor = dist / Editor.lastDist;
                // Limit zoom levels if desired
                Editor.scale *= zoomFactor;
            }
            Editor.lastDist = dist;
        }
        Editor.draw();
    },

    draw: () => {
        if (!Editor.ctx) return;

        Editor.ctx.clearRect(0, 0, 280, 280);

        const b = Math.max(50, Math.min(150, Number(Editor.brightness) || 100));
        const c = Math.max(50, Math.min(150, Number(Editor.contrast) || 100));

        Editor.ctx.save();
        Editor.ctx.filter = `brightness(${b}%) contrast(${c}%)`;

        Editor.ctx.drawImage(
            Editor.img,
            Editor.posX,
            Editor.posY,
            Editor.img.width * Editor.scale,
            Editor.img.height * Editor.scale
        );
        Editor.ctx.restore();

        const t = (Editor.overlayText || "").trim();
        if (t) {
            Editor.ctx.save();

            const familyMap = {
                system: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                serif: "Georgia, 'Times New Roman', Times, serif",
                sans: "Arial, Helvetica, system-ui, -apple-system, Segoe UI, Roboto",
                mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
            };

            const family = familyMap[Editor.fontFamilyKey] || familyMap.system;
            const size = Math.max(12, Math.min(64, Number(Editor.fontSize) || 24));

            Editor.ctx.font = `700 ${size}px ${family}`;
            Editor.ctx.textAlign = "center";
            Editor.ctx.textBaseline = "bottom";

            Editor.ctx.shadowColor = "rgba(0,0,0,0.55)";
            Editor.ctx.shadowBlur = 6;
            Editor.ctx.shadowOffsetY = 2;

            Editor.ctx.fillStyle = "#ffffff";
            Editor.ctx.fillText(t, 140, 270);

            Editor.ctx.restore();
        }
    },

    guardar: () => {
        const u = Editor.canvas.toDataURL('image/jpeg', 0.8);

        // Update Actual IMG tag in UI
        if (Editor.targetImgId) {
            const el = document.getElementById(Editor.targetImgId);
            if (el) {
                el.src = u;
                el.style.backgroundColor = "transparent";
            }
        }

        // If we are editing profile in Settings, we might need to inform that flow?
        // No, visual update is enough, then user clicks "Guardar" in profile modal.

        Editor.cerrar();
        // If we hid the profile modal, show it again?
        // document.getElementById('modal-perfil').classList.remove('hidden');
    },

    cerrar: () => {
        const modal = document.getElementById('modal-recorte');
        modal.classList.add('hidden');
        setTimeout(() => modal.style.display = 'none', 300);
    }
};

/* ==========================================================================
   MÓDULO DEVOCIONAL DINÁMICO (MOTIVADOR Y COMPACTO)
   ========================================================================== */
const Devocional = {
    temas: [
        {
            palabras: ['paz', 'descanso', 'tranquilo', 'tormenta'],
            titulo: "Paz en la Tormenta",
            explicacion: "La paz de Dios no es la ausencia de problemas, sino la presencia de Su Espíritu en medio de ellos. Él tiene el control absoluto de los vientos que hoy te rodean.",
            aplicacion: "Respira profundo. Entrega esa preocupación que te quita el sueño y permite que Su calma guarde tu corazón durante toda esta jornada."
        },
        {
            palabras: ['fuerza', 'poder', 'valiente', 'esfuerzo'],
            titulo: "Tu Fortaleza es Divina",
            explicacion: "No estás solo en esta batalla. Cuando tus fuerzas se agotan, es ahí donde el poder de Dios se perfecciona en tu debilidad para hacer lo imposible.",
            aplicacion: "¡Levántate con fe! Hoy no caminas por lo que ves, sino por la fuerza del Todopoderoso que ha prometido estar contigo dondequiera que vayas."
        },
        {
            palabras: ['amor', 'misericordia', 'gracia', 'perdon'],
            titulo: "Gracia que Restaura",
            explicacion: "El amor de Dios es el ancla de nuestra alma. Su gracia es un regalo inmerecido que borra tu pasado y te otorga un presente lleno de propósito.",
            aplicacion: "Camina con la frente en alto. Eres amado, perdonado y aceptado. Deja que ese mismo amor fluya a través de ti hacia los que te rodean hoy."
        },
        {
            palabras: ['fe', 'creer', 'confianza', 'espera'],
            titulo: "El Poder de la Fe",
            explicacion: "La fe es la llave que abre las puertas del cielo. Confiar en Dios es saber que, aunque no veas el camino, Él ya ha preparado la victoria al final del sendero.",
            aplicacion: "Toma una decisión de confianza hoy: deja de mirar el obstáculo y empieza a mirar al Dios que mueve las montañas por ti."
        }
    ],

    generar: () => {
        const fondos = ['destacado.jpg', 'f1.jpg', 'f2.jpg', 'f3.jpg', 'f4.jpg', 'f5.jpg', 'f6.jpg', 'f7.jpg', 'f8.jpg', 'f9.jpg', 'f10.jpg', 'f11.jpg', 'f12.jpg', 'f13.jpg', 'f14.jpg', 'f15.jpg', 'f16.jpg'];
        const hoy = new Date();
        const seed = hoy.getFullYear() + hoy.getMonth() + hoy.getDate();
        const imagenDelDia = `fondos/${fondos[seed % fondos.length]}`;

        const biblia = BIBLIAS['RV1960']?.data || window.BIBLIAS?.RV1960;
        if (!biblia) return;

        // Selección de Versículo basado en la fecha
        const libros = Object.keys(biblia);
        const libro = libros[seed % libros.length];
        const caps = Object.keys(biblia[libro]);
        const cap = caps[seed % caps.length];
        const vers = Object.keys(biblia[libro][cap]);
        const ver = vers[seed % vers.length];
        const texto = biblia[libro][cap][ver];

        // Lógica de Título y Contenido Motivador
        let tema = {
            titulo: "Propósito para Hoy",
            explicacion: "Dios tiene una palabra específica para tu situación. Su sabiduría es el mapa que necesitas para navegar los desafíos de este día.",
            aplicacion: "Abre tu corazón a la voz del Espíritu Santo. Haz una pausa y permite que esta verdad bíblica guíe cada decisión que tomes hoy."
        };

        const min = texto.toLowerCase();
        for (const t of Devocional.temas) {
            if (t.palabras.some(p => min.includes(p))) { tema = t; break; }
        }

        const html = `
            <div class="dev-card" style="background-image: url('${imagenDelDia}'); background-size: cover; background-position: center; height: 100vh; width: 100%; position: relative; display: flex;">
                <div class="dev-overlay" style="background: linear-gradient(to top, #121212 15%, rgba(18,18,18,0.4) 50%, rgba(18,18,18,0.8)); padding: 20px; width: 100%; color: white; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box;">
                    
                    <h1 style="font-size: 1.7rem; margin: 0 0 12px 0; font-family: 'Cinzel', serif; text-align: center; color: #f1c40f; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${tema.titulo}</h1>
                    
                    <div style="margin-bottom: 15px; border-left: 3px solid #f1c40f; padding: 12px 15px; background: rgba(0,0,0,0.35); border-radius: 0 12px 12px 0; backdrop-filter: blur(2px);">
                        <p style="font-style: italic; font-size: 1rem; line-height: 1.35; margin: 0;">"${texto}"</p>
                        <small style="color: #f1c40f; display: block; margin-top: 6px; text-align: right; font-weight: bold; font-size: 0.85rem;">— ${libro} ${cap}:${ver}</small>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <h3 style="color: #f1c40f; font-size: 0.7rem; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: 1.5px; opacity: 0.9;">💡 Sabiduría</h3>
                        <p style="font-size: 0.85rem; line-height: 1.3; margin: 0; opacity: 0.95;">${tema.explicacion}</p>
                    </div>

                    <div style="background: rgba(46, 204, 113, 0.12); padding: 12px; border-radius: 12px; border: 1px solid rgba(46, 204, 113, 0.3);">
                        <h3 style="color: #2ecc71; font-size: 0.7rem; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: 1.5px;">🚀 Tu Desafío Hoy</h3>
                        <p style="font-size: 0.85rem; line-height: 1.3; margin: 0; font-weight: 500;">${tema.aplicacion}</p>
                    </div>

                    <p style="text-align: center; font-size: 0.6rem; opacity: 0.4; margin-top: 25px; letter-spacing: 3px;">DESLIZA PARA CERRAR</p>
                </div>
            </div>`;

        document.getElementById('contenido-devocional-detalle').innerHTML = html;

        // Miniatura Home (Compacta)
        const contIni = document.getElementById('contenido-devocional');
        if (contIni) {
            contIni.innerHTML = `
                <div class="dev-card" onclick="EditorAutonomo.abrir('${texto.replace(/'/g, "\\'")}', '${libro} ${cap}:${ver}', 'destacado.jpg')" style="background-image: url('${imagenDelDia}'); background-size: cover; background-position: center; border-radius: 20px; height: 165px; width: 100%; position: relative; overflow: hidden; display: flex; align-items: flex-end; box-shadow: 0 8px 15px rgba(0,0,0,0.4);">
                    <div style="background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); padding: 15px; width: 100%; color: white;">
                        <span style="font-size: 0.6rem; color: #f1c40f; letter-spacing: 1px; font-weight: bold;">${tema.titulo}</span>
                        <h2 style="font-size: 1.15rem; margin: 2px 0; font-family: 'Cinzel';">${libro} ${cap}:${ver}</h2>
                    </div>
                </div>`;
        }
    }
};
/* ==========================================================================
   MÓDULO CREADOR PREMIUM (CORREGIDO: CANVAS + GALERÍA PROPIA)
   ========================================================================== */
const EditorAutonomo = {
    canvas: null,
    ctx: null,
    state: {
        // --- Variables de Estado ---
        brightness: 100,
        contrast: 100,
        fontSize: 50,
        vignette: 0.3,
        blur: 0,
        spacing: 0,
        font: 'Cinzel',
        width: 1080,
        height: 1080,
        text: '',
        ref: '',
        img: null, // Aquí se guarda la imagen real
        imgName: 'destacado.jpg'
    },
    fondos: [],

    init: () => {
        // Lista de fondos predeterminados
        EditorAutonomo.fondos = ['destacado.jpg'];
        for (let i = 1; i <= 16; i++) EditorAutonomo.fondos.push(`f${i}.jpg`);
    },

    abrir: (texto, cita, fondoInicial = null) => {
        const s = EditorAutonomo.state;

        // Resetear valores
        s.brightness = 100;
        s.contrast = 100;
        s.blur = 0;
        s.fontSize = 50;

        // Cargar texto
        if (texto) s.text = texto;
        if (cita) s.ref = cita;

        // Fallback
        if (!s.text) {
            s.text = "Jehová es mi pastor; nada me faltará.";
            s.ref = "Salmos 23:1";
        }

        // Sincronizar UI
        const input = document.getElementById('premium-text-input');
        if (input) input.value = s.text;

        // Cargar fondo inicial (Si no hay uno específico, usa uno random)
        EditorAutonomo.cargarFondo(fondoInicial || EditorAutonomo.getRandomFondo());

        const modal = document.getElementById('modal-creador-premium');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }

        // Renderizar la tira de imágenes
        EditorAutonomo.renderGaleria();
    },

    getRandomFondo: () => {
        const rnd = Math.floor(Math.random() * 16) + 1;
        return `f${rnd}.jpg`;
    },

    // Carga fondos desde la carpeta 'fondos/'
    cargarFondo: (nombreArchivo) => {
        EditorAutonomo.state.imgName = nombreArchivo;
        const img = new Image();
        img.src = `fondos/${nombreArchivo}`;
        img.crossOrigin = "Anonymous"; // Ayuda con algunos problemas de cors
        img.onload = () => {
            EditorAutonomo.state.img = img;
            EditorAutonomo.render();
        };
        img.onerror = () => {
            console.warn("Fondo no encontrado, usando backup.");
            if (nombreArchivo !== 'destacado.jpg') EditorAutonomo.cargarFondo('destacado.jpg');
        };
    },

    // --- AQUÍ ESTÁ LA MAGIA CORREGIDA ---
    // Esta función recibe el input, lee la foto y la mete AL CANVAS
    cargarFondoPropio: (input) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();

            reader.onload = function (e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    // Actualizamos el estado del editor con la NUEVA IMAGEN
                    EditorAutonomo.state.img = img;
                    EditorAutonomo.render(); // Redibujamos el canvas
                };
            };

            reader.readAsDataURL(input.files[0]);
        }
    },

    renderGaleria: () => {
        const container = document.getElementById('galeria-fondos-scroll');
        if (!container) return;

        container.innerHTML = ''; // Limpiamos para no duplicar

        // 1. INYECTAR EL BOTÓN DE "SUBIR FOTO" (Vía JS para asegurar que siempre esté)
        const btnUpload = document.createElement('div');
        btnUpload.className = 'thumb-fondo btn-galeria'; // Usamos la clase CSS que creamos
        // Reemplaza la línea del emoji por esto:
        btnUpload.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.9;">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
    <small style="font-size:9px; margin-top: 4px; opacity: 0.8;">Galería</small>
`;
        btnUpload.onclick = () => {
            // Buscamos el input invisible, si no existe lo creamos al vuelo
            let input = document.getElementById('input-fondo-propio');
            if (!input) {
                input = document.createElement('input');
                input.type = 'file';
                input.id = 'input-fondo-propio';
                input.accept = 'image/*';
                input.style.display = 'none';
                input.onchange = function () { EditorAutonomo.cargarFondoPropio(this); };
                document.body.appendChild(input);
            }
            input.click();
        };
        container.appendChild(btnUpload);

        // 2. INYECTAR LOS FONDOS PREDETERMINADOS
        EditorAutonomo.fondos.forEach(f => {
            const div = document.createElement('div');
            div.className = 'thumb-fondo';
            div.style.minWidth = '60px';
            div.style.height = '60px';
            div.style.borderRadius = '10px';
            div.style.backgroundImage = `url("fondos/${f}")`;
            div.style.backgroundSize = 'cover';
            div.style.cursor = 'pointer';
            div.style.border = '2px solid transparent';

            div.onclick = () => {
                // Quitar borde a todos
                Array.from(container.children).forEach(c => c.style.border = '2px solid transparent');
                // Poner borde a este (y al botón galería lo dejamos normal)
                div.style.border = '2px solid #f1c40f';
                EditorAutonomo.cargarFondo(f);
            };
            container.appendChild(div);
        });
    },

    update: (key, val) => {
        if (key === 'text' || key === 'font' || key === 'ref') {
            EditorAutonomo.state[key] = val;
        } else {
            EditorAutonomo.state[key] = parseFloat(val);
        }
        EditorAutonomo.render();
    },

    setFont: (fontName) => { EditorAutonomo.update('font', fontName); },
    setFormato: (w, h) => {
        EditorAutonomo.state.width = w;
        EditorAutonomo.state.height = h;
        EditorAutonomo.render();
    },

    render: () => {
        const canvas = document.getElementById('canvas-premium');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = EditorAutonomo.state;

        canvas.width = s.width;
        canvas.height = s.height;

        // 1. DIBUJAR IMAGEN CON FILTROS
        if (s.img) {
            ctx.save();
            ctx.filter = `brightness(${s.brightness}%) contrast(${s.contrast}%) blur(${s.blur}px)`;

            const ratioCanvas = canvas.width / canvas.height;
            const ratioImg = s.img.width / s.img.height;
            let nw, nh, ox, oy;

            if (ratioImg > ratioCanvas) {
                nh = canvas.height; nw = nh * ratioImg;
                ox = (canvas.width - nw) / 2; oy = 0;
            } else {
                nw = canvas.width; nh = nw / ratioImg;
                ox = 0; oy = (canvas.height - nh) / 2;
            }
            ctx.drawImage(s.img, ox, oy, nw, nh);
            ctx.restore();
        } else {
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 2. VIGNETTE
        if (s.vignette > 0) {
            const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width / 3, canvas.width / 2, canvas.height / 2, canvas.width);
            grad.addColorStop(0, `rgba(0,0,0,0)`);
            grad.addColorStop(1, `rgba(0,0,0,${s.vignette})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 3. TEXTO
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const scaleFactor = canvas.width / 1080;
        const fontSizeFinal = s.fontSize * 1.5 * scaleFactor;

        ctx.font = `bold ${fontSizeFinal}px '${s.font}', serif`;
        ctx.letterSpacing = `${s.spacing}px`;

        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 4;

        // Wrapping
        const words = s.text.split(' ');
        let line = '';
        let lines = [];
        const maxWidth = canvas.width * 0.85;

        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        let lineHeight = fontSizeFinal * 1.3;
        let totalTextHeight = lines.length * lineHeight;
        let startY = (canvas.height / 2) - (totalTextHeight / 2);

        lines.forEach((l, i) => {
            ctx.fillText(l, canvas.width / 2, startY + (i * lineHeight));
        });

        // 4. REFERENCIA
        if (s.ref) {
            ctx.font = `italic ${fontSizeFinal * 0.5}px '${s.font}', serif`;
            ctx.letterSpacing = '0px';
            ctx.fillText(s.ref, canvas.width / 2, startY + totalTextHeight + 40 * scaleFactor);
        }

        // 5. MARCA DE AGUA
        ctx.font = `15px Montserrat, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText("NÔEMA APP", canvas.width / 2, canvas.height - 40);
    },

    guardar: () => {
        const link = document.createElement('a');
        link.download = `Noema_Versiculo_${Date.now()}.jpg`;
        link.href = document.getElementById('canvas-premium').toDataURL('image/jpeg', 0.92);
        link.click();
    },

    compartir: () => {
        const canvas = document.getElementById('canvas-premium');
        canvas.toBlob(blob => {
            if (navigator.share) {
                const file = new File([blob], "noema.jpg", { type: "image/jpeg" });
                navigator.share({ title: 'Nôema', files: [file] }).catch(console.error);
            } else {
                alert("Mantén presionada la imagen para guardarla.");
            }
        }, 'image/jpeg');
    },

    cerrar: () => {
        document.getElementById('modal-creador-premium').classList.add('hidden');
    }
};

// Compatible Alias
const CreadorPremium = EditorAutonomo;

// Auto-Init
EditorAutonomo.init();

/* ==========================================================================
   1. MÓDULO IA (CEREBRO SINCRONIZADO)
   ========================================================================== */
// Ejecutamos la seguridad inmediatamente
(function AsegurarIA() {
    if (typeof window.IA === 'undefined') window.IA = {};

    // Inyectar o reparar funciones
    Object.assign(window.IA, {
        sugerir: function (texto) {
            const input = document.getElementById('input-ia') || document.getElementById('chat-input');
            if (input) { input.value = texto; this.enviar(); }
        },

        enviar: async function () {
            const input = document.getElementById('input-ia') || document.getElementById('chat-input');
            if (!input) return;
            const txt = input.value.trim();
            if (!txt) return;

            input.value = '';
            // 1. Mostrar tu mensaje
            this.agregarBurbujaUI(txt, 'user');

            // 2. Timeout de seguridad (Si ia.js falla, respondemos nosotros)
            const timeoutID = setTimeout(() => {
                this.destrabarYResponder(txt);
            }, 4000);

            // 3. Procesar
            if (typeof this.procesar === 'function') {
                try {
                    await this.procesar(txt);
                    // No cancelamos el timeout inmediatamente aquí, 
                    // dejamos que agregarBurbujaUI lo haga al recibir respuesta
                } catch (e) {
                    // Fallo silencioso, el timeout responderá
                }
            }
        },

        destrabarYResponder: function (txtUsuario) {
            // Borrar burbuja "Escudriñando" si existe
            const mensajes = document.querySelectorAll('.k-chat-msg');
            const ultimo = mensajes[mensajes.length - 1];
            if (ultimo && (ultimo.innerText.includes('Escudriñando') || ultimo.innerText.includes('Pensando'))) {
                ultimo.remove();
            }

            // Verificar si ya respondió la IA real
            const nuevoUltimo = document.querySelectorAll('.k-chat-msg:last-child')[0];
            if (nuevoUltimo && !nuevoUltimo.classList.contains('user') && !nuevoUltimo.innerText.includes('Escudriñando')) {
                // Ya hay respuesta, forzar lectura
                if (typeof VoiceMode !== 'undefined') VoiceMode.leerRespuesta(nuevoUltimo.innerText);
                return;
            }

            // Respuesta de emergencia
            const t = txtUsuario.toLowerCase();
            let r = "Te escucho. Continúa.";
            if (t.includes('hola')) r = "¡Hola! Estoy lista.";
            else if (t.includes('dios')) r = "Dios es fiel.";

            this.agregarBurbujaUI(r, 'bot');
        },

        agregarBurbujaUI: function(txt, tipo) {
        // --- NUEVO: Ocultar sugerencias al instante (Si escribes o tocas un botón) ---
        const sugerencias = document.querySelector('.sugerencias-container');
        if (sugerencias && !sugerencias.classList.contains('oculto')) {
            sugerencias.classList.add('oculto');
            setTimeout(() => sugerencias.style.display = 'none', 300);
        }
        // ----------------------------------------------------------------------------
        
        const h = document.getElementById('chat-historial');
        if (h) {
            // Limpieza
            const loading = document.querySelector('.k-msg-loading');
                if (loading) loading.remove();

                const d = document.createElement('div');
                // CLASES CLARA PARA DIFERENCIAR
                d.className = tipo === 'user' ? 'k-chat-msg k-msg-pastor user' : 'k-chat-msg k-msg-noema bot';
                d.innerHTML = txt.replace(/\n/g, '<br>');
                h.appendChild(d);
                h.scrollTop = h.scrollHeight;

                // --- PUNTO CRÍTICO: LECTURA ---
                // Si es mensaje de la IA (no user), lo leemos DIRECTAMENTE
                if (tipo !== 'user' && typeof VoiceMode !== 'undefined') {
                    // Cancelamos el timeout de seguridad porque ya respondimos
                    // (Esto evita que el respaldo hable encima de la respuesta real)
                    // Nota: No tenemos acceso fácil al ID aquí, pero el respaldo verifica antes de hablar.

                    setTimeout(() => VoiceMode.leerRespuesta(txt), 100);
                }
            }
        }
    });
})();

/* ==========================================================================
   2. EVENTOS FINALES
   ========================================================================== */
window.onload = () => {
    if (typeof App !== 'undefined' && App.init) App.init();
    if (window.history.state === null) history.pushState({ vista: 'vista-inicio' }, "");
};

window.onpopstate = function(event) {
    if (typeof App !== 'undefined' && App.ignoreNextPop) { App.ignoreNextPop = false; return; }
    
    // --- NUEVO: CERRAR ORACIÓN CON BOTÓN ATRÁS ---
    const vistaOracion = document.getElementById('vista-oracion');
    if (vistaOracion && vistaOracion.style.display !== 'none') {
        if (typeof App !== 'undefined') App.cerrarOracion();
        return;
    }
    // ---------------------------------------------
    
    const modales = document.querySelectorAll('.modal-full:not(.hidden), .modal-centro:not(.hidden)');
    let cerrado = false;
    modales.forEach(m => {
        if (window.getComputedStyle(m).display !== 'none') {
            m.classList.add('hidden');
            cerrado = true;
        }
    });
    if (cerrado) return;
    
    const inicio = document.getElementById('vista-inicio');
    if (inicio && !inicio.classList.contains('activa') && typeof App !== 'undefined') {
        App.navegar('vista-inicio');
    }
};

if (typeof App !== 'undefined') {
    const origNav = App.navegar;
    App.navegar = (id) => {
        if (typeof Notas !== 'undefined') { Notas.guardarFinal(true); Notas.cerrar(); }
        if (id !== 'vista-inicio') history.pushState({ vista: id }, "");
        if (origNav) origNav(id);
    };
}

let tX = 0, tY = 0;
document.addEventListener('touchstart', e => { tX = e.changedTouches[0].clientX; tY = e.changedTouches[0].clientY; }, { passive: true });
document.addEventListener('touchend', e => {
    if (document.querySelector('.modal-full:not(.hidden)')) return;
    const dX = e.changedTouches[0].clientX - tX;
    const dY = e.changedTouches[0].clientY - tY;
    const bib = document.getElementById('vista-biblia');
    if (bib && bib.classList.contains('activa') && Math.abs(dX) > 80 && Math.abs(dY) < 100) {
        if (dX < 0) Lectura.capituloSiguiente(); else Lectura.capituloAnterior();
    }
}, { passive: true });

/* ==========================================================================
   3. INTERACCIÓN (SPLIT & GESTOS) - CON CIERRE AUTOMÁTICO INTEGRADO
   ========================================================================== */
const SplitScreen = {
    // Agregamos 'lastP' para recordar la posición, lo demás sigue igual
    activo: false, startY: 0, startHeight: 0, panelSup: null, panelInf: null, resizer: null, isSyncing: false, lastP: 50,

    init: () => {
        SplitScreen.panelSup = document.getElementById('scroll-wrapper-sup');
        SplitScreen.panelInf = document.getElementById('area-lectura-secundaria');
        SplitScreen.resizer = document.getElementById('resizer-split');
        if (SplitScreen.resizer) {
            SplitScreen.resizer.addEventListener('touchstart', SplitScreen.startDrag, { passive: true });
            SplitScreen.resizer.addEventListener('touchmove', SplitScreen.drag, { passive: false });
            SplitScreen.resizer.addEventListener('touchend', SplitScreen.endDrag);
        }
        const sync = (s, t) => {
            if (SplitScreen.isSyncing || !SplitScreen.activo) return;
            SplitScreen.isSyncing = true;
            // Pequeña protección por si la altura es 0
            if (s.scrollHeight - s.clientHeight > 0) {
                t.scrollTop = (s.scrollTop / (s.scrollHeight - s.clientHeight)) * (t.scrollHeight - t.clientHeight);
            }
            setTimeout(() => SplitScreen.isSyncing = false, 50);
        };
        if (SplitScreen.panelSup) SplitScreen.panelSup.addEventListener('scroll', () => sync(SplitScreen.panelSup, SplitScreen.panelInf));
        if (SplitScreen.panelInf) SplitScreen.panelInf.addEventListener('scroll', () => sync(SplitScreen.panelInf, SplitScreen.panelSup));
    },

    toggle: () => SplitScreen.activo ? SplitScreen.cerrar() : SplitScreen.abrir(),

    abrir: () => {
        history.pushState({ modal: 'split' }, ""); SplitScreen.activo = true;
        if (SplitScreen.resizer) SplitScreen.resizer.classList.remove('hidden');
        if (SplitScreen.panelInf) SplitScreen.panelInf.classList.remove('hidden');
        SplitScreen.panelSup.style.flex = "1"; SplitScreen.panelInf.style.flex = "1";
        // Reiniciamos lastP al centro
        SplitScreen.lastP = 50;
        if (typeof State !== 'undefined' && State.versionSec) Lectura.renderSecundario();
    },

    cerrar: () => {
        SplitScreen.activo = false;
        if (SplitScreen.resizer) SplitScreen.resizer.classList.add('hidden');
        if (SplitScreen.panelInf) SplitScreen.panelInf.classList.add('hidden');
        SplitScreen.panelSup.style.flex = "1";
        if (history.state && history.state.modal === 'split') { if (typeof App !== 'undefined') App.ignoreNextPop = true; history.back(); }
    },

    startDrag: (e) => { SplitScreen.startY = e.touches[0].clientY; SplitScreen.startHeight = SplitScreen.panelSup.clientHeight; },

    // --- AQUÍ ESTÁ LA MAGIA INTEGRADA ---
    drag: (e) => {
        if (!SplitScreen.startY) return;
        const h = document.getElementById('contenedor-split').clientHeight;
        const p = ((SplitScreen.startHeight + (e.touches[0].clientY - SplitScreen.startY)) / h) * 100;

        // Guardamos la posición real aunque no movamos visualmente la barra
        SplitScreen.lastP = p;

        // Tu lógica original de restricción visual (5% a 95%) se mantiene
        if (p > 5 && p < 95) {
            SplitScreen.panelSup.style.flex = `0 0 ${p}%`;
            SplitScreen.panelInf.style.flex = "1";
        }
    },

    endDrag: () => {
        // Verificamos si soltaste en los extremos
        if (SplitScreen.lastP < 10 || SplitScreen.lastP > 90) {
            SplitScreen.cerrar();
        }
        SplitScreen.startY = 0;
    }
};

// TU OBJETO GESTOS INTACTO
const Gestos = {
    timer: null,
    distanciaInicial: 0,
    init: () => {
        // Ruedas selectoras
        const v = document.getElementById('btn-selector-version');
        const l = document.getElementById('btn-selector-libro');
        if (v) Gestos.bind(v, () => { if (navigator.vibrate) navigator.vibrate(50); SplitScreen.toggle(); }, () => Selector.abrirVersiones());
        if (l) Gestos.bind(l, () => { if (navigator.vibrate) navigator.vibrate(50); }, () => Selector.abrir());

        // Pinch to Zoom (Lectura)
        const area = document.getElementById('area-lectura');
        if (area) {
            area.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    Gestos.distanciaInicial = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                }
            }, { passive: true });

            area.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2 && Gestos.distanciaInicial > 0) {
                    const dist = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );

                    // Umbral para activar cambio (evita saltos bruscos)
                    if (Math.abs(dist - Gestos.distanciaInicial) > 30) {
                        const delta = dist > Gestos.distanciaInicial ? 5 : -5;
                        Lectura.ajustarFuente(delta);
                        Gestos.distanciaInicial = dist; // Reset relativo para suavidad
                    }
                }
            }, { passive: true });

            area.addEventListener('touchend', (e) => {
                if (e.touches.length < 2) Gestos.distanciaInicial = 0;
            }, { passive: true });
        }

        if (SplitScreen.init) SplitScreen.init();
    },
    bind: (el, long, click) => {
        let l = false, m = false;
        el.addEventListener('touchstart', () => {
            l = false; m = false; el.classList.add('btn-presionado');
            Gestos.timer = setTimeout(() => { if (!m) { l = true; long(); el.classList.remove('btn-presionado'); } }, 500);
        }, { passive: true });
        el.addEventListener('touchmove', () => { m = true; clearTimeout(Gestos.timer); el.classList.remove('btn-presionado'); }, { passive: true });
        el.addEventListener('touchend', () => {
            clearTimeout(Gestos.timer); el.classList.remove('btn-presionado');
            if (!l && !m) click();
        }, { passive: true });
    }
};

/* ==========================================================================
   4. MÓDULO DE VOZ: "TURNOS INTELIGENTES" (WHISPER HYBRID SYSTEM)
   ========================================================================== */

const VoiceMode = {
    // Variables de Control
    recognition: null, // Para el modo nativo (fallback)
    mediaRecorder: null, // Para grabar audio real (Groq)
    audioChunks: [],
    synth: window.speechSynthesis,
    isListening: false,
    modoConversacion: false,
    ultimoTextoLeido: "",
    timerDebounce: null,

    // Configuración de Estrategia
    usarGroqWhisper: true, // Interruptor maestro

    init: () => {
        VoiceMode.inyectarBoton();

        // 1. EL VIGILANTE (OBSERVADOR DE CHAT - Mantiene la lectura de respuestas)
        const chatHistorial = document.getElementById('chat-historial') || document.getElementById('kerygma-chat-history');
        if (chatHistorial) {
            const observer = new MutationObserver((mutations) => {
                const overlay = document.getElementById('vista-voz');
                if (!overlay || overlay.classList.contains('hidden')) return;

                mutations.forEach((mutation) => {
                    let nodo = mutation.type === 'childList' && mutation.addedNodes.length > 0 ? mutation.addedNodes[0] : mutation.target;
                    while (nodo && nodo.nodeType !== 1) nodo = nodo.parentNode;

                    if (nodo && nodo.nodeType === 1) {
                        const esUsuario = nodo.className.includes('user') || nodo.className.includes('pastor');
                        const texto = nodo.innerText;

                        if (!esUsuario && texto.length > 2 && !texto.includes("Escudriñando") && !texto.includes("Pensando")) {
                            if (VoiceMode.timerDebounce) clearTimeout(VoiceMode.timerDebounce);
                            VoiceMode.timerDebounce = setTimeout(() => {
                                if (texto !== VoiceMode.ultimoTextoLeido) {
                                    VoiceMode.leerRespuesta(texto);
                                }
                            }, 800);
                        }
                    }
                });
            });
            observer.observe(chatHistorial, { childList: true, subtree: true, characterData: true });
        }

        // 2. PREPARAR EL FALLBACK (Reconocimiento Nativo del Teléfono)
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            VoiceMode.recognition = new SR();
            VoiceMode.recognition.lang = 'es-ES';
            VoiceMode.recognition.continuous = false;
            VoiceMode.recognition.interimResults = false;

            VoiceMode.recognition.onresult = (e) => {
                // Si llegamos aquí, es porque estamos usando el modo nativo
                const transcript = e.results[0][0].transcript;
                VoiceMode.enviarTextoAlChat(transcript);
            };

            VoiceMode.recognition.onerror = (e) => {
                console.warn("Error voz nativa:", e.error);
                if (VoiceMode.modoConversacion && !VoiceMode.synth.speaking) {
                    VoiceMode.actualizarUI("No te entendí...", false);
                    setTimeout(() => VoiceMode.escuchar(), 1500);
                }
            };

            VoiceMode.recognition.onend = () => {
                VoiceMode.isListening = false;
            };
        }
    },

    inyectarBoton: () => {
        const inp = document.getElementById('input-ia');
        if (inp && !document.getElementById('btn-mic-chat')) {
            const i = document.createElement('img');
            i.src = 'icon-mic.png'; i.id = 'btn-mic-chat';
            i.onclick = VoiceMode.iniciarSesionVoz;
            i.setAttribute('style', 'width:45px; height:45px; padding:8px; cursor:pointer; margin-left:5px; vertical-align:middle;');
            inp.parentNode.insertBefore(i, inp.nextSibling);
        }
    },

// --- INICIO DEL FLUJO DE CONVERSACIÓN ---
iniciarSesionVoz: () => {
    const vista = document.getElementById('vista-voz');
    if (vista) vista.classList.remove('hidden');
    
    // --- NUEVO: Ocultar sugerencias inmediatamente al tocar el micro ---
    const sugerencias = document.querySelector('.sugerencias-container');
    if (sugerencias && !sugerencias.classList.contains('oculto')) {
        sugerencias.classList.add('oculto');
        setTimeout(() => sugerencias.style.display = 'none', 300);
    }
    // ------------------------------------------------------------------
    
    VoiceMode.modoConversacion = true;
    VoiceMode.ultimoTextoLeido = "";
    
    // Iniciamos la escucha
    VoiceMode.escuchar();
},

    // DECISIÓN INTELIGENTE: ¿GROQ O TELÉFONO?
    escuchar: async () => {
        if (!VoiceMode.modoConversacion) return;

        // Detenemos a Nôema si estaba hablando
        if (VoiceMode.synth.speaking) VoiceMode.synth.cancel();

        VoiceMode.actualizarUI("Te escucho...", true);
        VoiceMode.isListening = true;

        // INTENTO A: USAR GROQ (GRABACIÓN DE AUDIO)
        if (VoiceMode.usarGroqWhisper && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                VoiceMode.mediaRecorder = new MediaRecorder(stream);
                VoiceMode.audioChunks = [];

                VoiceMode.mediaRecorder.ondataavailable = (event) => {
                    VoiceMode.audioChunks.push(event.data);
                };

                VoiceMode.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(VoiceMode.audioChunks, { type: 'audio/webm' });
                    VoiceMode.procesarAudioGroq(audioBlob);

                    // Apagar el micro físico
                    stream.getTracks().forEach(track => track.stop());
                };

                // GRABAR: Usamos detección de silencio simulada (o tiempo límite de 6s para comandos cortos)
                VoiceMode.mediaRecorder.start();

                // DETECCIÓN DE SILENCIO SIMPLE: 
                // En una app web real es complejo detectar silencio exacto sin librerías pesadas.
                // Aquí usaremos un temporizador de seguridad de 5 segundos O un botón manual si quisieras.
                // Para mantener la fluidez "mágica", cortamos a los 5 segundos automáticamente.
                setTimeout(() => {
                    if (VoiceMode.mediaRecorder && VoiceMode.mediaRecorder.state === "recording") {
                        VoiceMode.mediaRecorder.stop();
                    }
                }, 5000);

            } catch (err) {
                console.error("No se pudo acceder al micrófono para Groq:", err);
                // Si falla el micro, usamos el nativo
                VoiceMode.usarNativo();
            }
        } else {
            // Si no hay soporte o está desactivado, usamos Nativo
            VoiceMode.usarNativo();
        }
    },

    usarNativo: () => {
        console.log("🔄 Usando Voz Nativa (Fallback)");
        try { VoiceMode.recognition.start(); } catch (e) { }
    },

    // --- CEREBRO 1: PROCESAR CON GROQ WHISPER ---
    procesarAudioGroq: async (audioBlob) => {
        VoiceMode.actualizarUI("Procesando audio...", true);

        // Convertir a Base64 para enviar a Vercel
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];

            try {
                const response = await fetch('/api/whisper', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ audio: base64Audio })
                });

                if (!response.ok) throw new Error("Error API Whisper");

                const data = await response.json();

                if (data.text && data.text.trim().length > 0) {
                    VoiceMode.enviarTextoAlChat(data.text);
                } else {
                    // Si Groq no escuchó nada, reintentamos
                    VoiceMode.actualizarUI("No escuché nada...", false);
                    setTimeout(() => VoiceMode.escuchar(), 1000);
                }

            } catch (error) {
                console.error("Fallo Groq, cambiando a nativo:", error);
                // Si falla la API, desactivamos Groq temporalmente y usamos el teléfono
                VoiceMode.usarGroqWhisper = false;
                VoiceMode.usarNativo();
            }
        };
    },

    // --- CEREBRO 2: ENVIAR TEXTO FINAL AL CHAT ---
    enviarTextoAlChat: (texto) => {
        if (!texto.trim()) return;

        VoiceMode.actualizarUI(`"${texto}"`, false);
        VoiceMode.isListening = false;

        // Inyectar en el chat
        const input = document.getElementById('input-ia');
        if (input) {
            input.value = texto;

            // Disparar envío
            const btn = input.parentNode.querySelector('button') || input.nextElementSibling;
            if (btn) btn.click();
            else if (window.IA && window.IA.enviar) window.IA.enviar();
        }

        VoiceMode.actualizarUI("Pensando...", true);
    },

    // --- FASE DE RESPUESTA (Igual que antes, funciona perfecto) ---
    leerRespuesta: (texto) => {
        if (document.getElementById('vista-voz').classList.contains('hidden')) return;

        VoiceMode.ultimoTextoLeido = texto;
        const limpio = texto.replace(/[*_#]/g, '').replace(/\n/g, '. ').trim();
        if (!limpio) return;

        let preguntaCierre = "¿Algo más?";
        if (limpio.length > 50) preguntaCierre = "¿Qué más deseas saber?";

        VoiceMode.hablar(limpio, preguntaCierre);
    },

    hablar: (textoPrincipal, preguntaFinal) => {
        window.speechSynthesis.cancel();

        const u = new SpeechSynthesisUtterance(textoPrincipal);
        u.lang = 'es-ES';
        u.rate = 1.0;

        const v = VoiceMode.synth.getVoices().find(v => v.name.includes("Google") && v.lang.includes("es"));
        if (v) u.voice = v;

        u.onstart = () => VoiceMode.actualizarUI("Nôema responde...", true);

        u.onend = () => {
            if (!VoiceMode.modoConversacion) return;

            // Pequeña pausa antes de reactivar el micro
            setTimeout(() => {
                const q = new SpeechSynthesisUtterance(preguntaFinal);
                q.lang = 'es-ES';
                if (v) q.voice = v;

                q.onend = () => {
                    // AQUÍ OCURRE EL "TURNO": Nôema calla, tú hablas
                    VoiceMode.escuchar();
                };

                window.speechSynthesis.speak(q);
            }, 300);
        };

        window.speechSynthesis.speak(u);
    },

    cerrar: () => {
        VoiceMode.modoConversacion = false;
        VoiceMode.isListening = false;
        window.speechSynthesis.cancel();

        // Detener ambos motores
        try { VoiceMode.recognition.stop(); } catch (e) { }
        try {
            if (VoiceMode.mediaRecorder && VoiceMode.mediaRecorder.state === "recording")
                VoiceMode.mediaRecorder.stop();
        } catch (e) { }

        const v = document.getElementById('vista-voz');
        if (v) v.classList.add('hidden');
    },

    actualizarUI: (texto, animar) => {
        const h2 = document.getElementById('estado-voz');
        if (h2) h2.innerText = texto;
        const orbe = document.querySelector('.orbe-animado');
        if (orbe) {
            if (animar) orbe.classList.add('hablando');
            else orbe.classList.remove('hablando');
        }
    }
};

// AUTO-ARRANQUE
setTimeout(() => {
    try { VoiceMode.init(); } catch (e) { }
    const s = document.createElement('style');
    s.innerHTML = `.vista-biblia button:not(.versiculo button):not(#header-biblia button), .boton-flotante-ia { display: none !important; }`;
    document.head.appendChild(s);
}, 2500);

/* ==========================================================================
   MÓDULO PWA (INSTALACIÓN INTELIGENTE - VERSIÓN FINAL)
   ========================================================================== */
const PWA = {
    deferredPrompt: null,

    init: () => {
        // 1. Escuchar evento de instalación (Solo si no está instalada)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); // Evitar banner nativo de Chrome
            PWA.deferredPrompt = e;

            // Mostrar botón en el menú
            const btn = document.getElementById('btn-install-smart');
            if (btn) btn.classList.remove('hidden');
        });

        // 2. Si el usuario instala la app, ocultar botón
        window.addEventListener('appinstalled', () => {
            const btn = document.getElementById('btn-install-smart');
            if (btn) btn.classList.add('hidden');
            PWA.deferredPrompt = null;
        });
    },

    instalar: async () => {
        if (!PWA.deferredPrompt) return;

        // Mostrar prompt nativo
        PWA.deferredPrompt.prompt();

        // Esperar decisión (no bloqueante)
        const { outcome } = await PWA.deferredPrompt.userChoice;

        // Limpiar
        PWA.deferredPrompt = null;
        document.getElementById('btn-install-smart').classList.add('hidden');
    }
};

// AUTO-INICIAR
setTimeout(() => {
    try { PWA.init(); } catch (e) { }
}, 1000);

/* ==========================================================
   GESTO DE DESLIZAR PARA CERRAR (CORREGIDO)
   ========================================================== */
setTimeout(() => {
    const barra = document.getElementById('barra-acciones');
    if (!barra) return;

    let touchStartY = 0;

    barra.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    barra.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const diff = touchY - touchStartY;
        if (diff > 0) {
            barra.style.transform = `translate(-50%, ${diff}px)`;
        }
    }, { passive: true });

    barra.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchEndY - touchStartY;

        if (diff > 60) {
            Lectura.cerrarSeleccion();
            // Eliminamos la manipulación de historial agresiva
            setTimeout(() => { barra.style.transform = ''; }, 300);
        } else {
            barra.style.transition = 'transform 0.3s ease-out';
            barra.style.transform = 'translate(-50%, 0)';
            setTimeout(() => { barra.style.transition = ''; }, 300);
        }
    });
}, 2000);