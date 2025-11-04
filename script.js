document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    //  !!! URLS CRUCIALES DE GOOGLE SHEETS !!!
    //  Modifica estas URL con las de tu propia hoja de cálculo.
    // =========================================================================
    // URL CSV: Usada para que el widget lea los datos. (Necesita ser el enlace 'publicar en la web' como CSV)
    const GSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwdRuKh0Ic1sb2axxFE1HKUFvCYDpRgI8vP_kzlNwgkK8A5uqLeQeVbolCeYhyAyHzqMSzcMQOUInm/pub?gid=0&single=true&output=csv";
    // URL DE EDICIÓN: Usada para abrir la hoja directamente. (La URL que usas para editar)
    const GSHEET_EDIT_URL = "https://docs.google.com/spreadsheets/d/1vRwdRuKh0Ic1sb2axxFE1HKUFvCYDpRgI8vP_kzlNwgkK8A5uqLeQeVbolCeYhyAyHzqMSzcMQOUInm/edit";
    // =========================================================================

    // 1. Elementos del DOM
    const body = document.body;
    const mainView = document.getElementById('main-view');
    const configView = document.getElementById('config-view');
    const toggleConfigBtn = document.getElementById('toggle-config-btn');
    const countdownTitle = document.getElementById('countdown-title');
    const countdownDays = document.getElementById('countdown-days');
    
    // Elementos de configuración
    const rowSelect = document.getElementById('row-select');
    const saveSelectionBtn = document.getElementById('save-selection-btn');
    const openSheetBtn = document.getElementById('open-sheet-btn');

    // Variables de control
    let isConfigView = false;
    const transitionDuration = 300; 
    const DEFAULT_TITLE = "Cargando...";
    const DEFAULT_DATE = new Date().toISOString().split('T')[0];
    const STORAGE_KEY = 'widgetTargetRow'; // Clave para guardar el número de fila

    // 2. Lógica de Lectura (Fetch CSV y Selección de Fila)
    async function loadConfig() {
        // Lee la fila guardada (ej: '2' para fila B, '3' para fila C). Usa '2' por defecto.
        const targetRowIndex = parseInt(localStorage.getItem(STORAGE_KEY) || '2'); 
        
        try {
            const response = await fetch(GSHEET_CSV_URL);
            
            if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);

            const csvData = await response.text();
            const lines = csvData.trim().split('\n');
            
            // La fila CSV es el índice 'targetRowIndex - 1' (porque la cabecera ocupa la fila 1)
            const dataRow = lines[targetRowIndex - 1]; 
            
            if (!dataRow) throw new Error(`Fila ${targetRowIndex} no encontrada en la Hoja.`);

            // Separa los datos: Asumimos Título en Columna A (índice 0) y Fecha en Columna B (índice 1)
            const [title, date] = dataRow.split(',').map(item => item.trim().replace(/"/g, '')); 
            
            return { title: title || "Título Vacío", date: date || DEFAULT_DATE };

        } catch (error) {
            console.error("Error al obtener datos sincronizados:", error);
            return { title: `Error: Fila ${targetRowIndex} (Ver Consola)`, date: "2099-12-31" };
        }
    }

    // 3. Lógica del Contador
    async function updateCountdown() {
        const { title, date } = await loadConfig();
        countdownTitle.textContent = title;

        const targetDateISO = date;
        const targetDate = new Date(targetDateISO + 'T00:00:00'); 
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const timeDifference = targetDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > 0) {
            countdownDays.textContent = `${daysRemaining} ${daysRemaining === 1 ? 'Día' : 'Días'}`;
        } else if (daysRemaining === 0) {
            countdownDays.textContent = `¡Hoy!`;
        } else {
            const daysSince = Math.abs(daysRemaining);
            countdownDays.textContent = `Pasó hace ${daysSince} ${daysSince === 1 ? 'Día' : 'Días'}`;
        }
    }

    // 4. Gestión de Vistas y Lógica de Guardado
    async function toggleView() {
        isConfigView = !isConfigView;

        if (isConfigView) {
            // Cargar la selección guardada al abrir la configuración
            const savedRow = localStorage.getItem(STORAGE_KEY) || '2';
            rowSelect.value = savedRow;

            // TRANSICIÓN A VISTA DE CONFIGURACIÓN
            body.classList.add('scrollable-config'); 
            configView.style.display = 'block';
            mainView.classList.add('hidden'); 
            
            setTimeout(() => {
                configView.classList.remove('hidden');
            }, 10);
            
            setTimeout(() => {
                mainView.style.display = 'none';
                toggleConfigBtn.textContent = '❌'; 
                toggleConfigBtn.style.fontSize = '1.2em';
                toggleConfigBtn.style.lineHeight = '1';
            }, transitionDuration + 10); 

        } else {
            // TRANSICIÓN A VISTA PRINCIPAL
            body.classList.remove('scrollable-config'); 
            updateCountdown(); // Forzar actualización al salir

            mainView.style.display = 'block';
            configView.classList.add('hidden');
            
            setTimeout(() => {
                mainView.classList.remove('hidden');
            }, 10);
            
            setTimeout(() => {
                configView.style.display = 'none';
                toggleConfigBtn.textContent = '•'; 
                toggleConfigBtn.style.fontSize = '2em';
                toggleConfigBtn.style.lineHeight = '0.5';
            }, transitionDuration + 10); 
        }
    }
    
    // 5. Event Listeners
    toggleConfigBtn.addEventListener('click', toggleView);

    // Botón para guardar la selección de fila
    saveSelectionBtn.addEventListener('click', () => {
        const selectedRow = rowSelect.value;
        localStorage.setItem(STORAGE_KEY, selectedRow);
        alert(`Fila ${selectedRow} guardada. El widget se actualizará.`);
        toggleView();
    });

    // Botón para abrir la hoja
    openSheetBtn.addEventListener('click', () => {
        // Abre la URL de edición directamente en una nueva ventana/pestaña
        window.open(GSHEET_EDIT_URL, '_blank');
    });

    // 6. Inicialización
    updateCountdown();
    // La actualización se hace cada 5 minutos para sincronizar la hoja
    setInterval(updateCountdown, 1000 * 60 * 5); 
    
    mainView.style.display = 'block';
    configView.style.display = 'none';
    mainView.classList.remove('hidden');
    configView.classList.add('hidden');
    body.classList.remove('scrollable-config');
});
