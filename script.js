document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    //  !!! URL CSV DE GOOGLE SHEETS !!! (Misma para todos los widgets)
    // =========================================================================
    const GSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwdRuKh0Ic1sb2axxFE1HKUFvCYDpRgI8vP_kzlNwgkK8A5uqLeQeVbolCeYhyAyHzqMSzcMQOUInm/pub?gid=0&single=true&output=csv";
    // =========================================================================

    // 1. Elementos del DOM
    const countdownTitle = document.getElementById('countdown-title');
    const countdownDays = document.getElementById('countdown-days');
    
    const DEFAULT_TITLE = "Cargando...";
    const DEFAULT_DATE = new Date().toISOString().split('T')[0];
    
    // 2. Obtener la fila (ROW) de la URL
    const params = new URLSearchParams(window.location.search);
    // Extrae el parámetro 'row'. Si no existe, usa la Fila 2 por defecto.
    const TARGET_ROW = parseInt(params.get('row')) || 2; 

    // 3. Lógica de Lectura (Fetch CSV y Fila Fija)
    async function loadConfig() {
        const targetRowIndex = TARGET_ROW;
        
        try {
            const response = await fetch(GSHEET_CSV_URL);
            
            if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);

            const csvData = await response.text();
            const lines = csvData.trim().split('\n');
            
            // La fila CSV es el índice 'targetRowIndex - 1' (ej: Fila 2 -> índice 1)
            const dataRow = lines[targetRowIndex - 1]; 
            
            if (!dataRow) throw new Error(`Fila ${targetRowIndex} no encontrada en la Hoja.`);

            // Asumimos Título en Columna A (índice 0) y Fecha en Columna B (índice 1)
            const [title, date] = dataRow.split(',').map(item => item.trim().replace(/"/g, '')); 
            
            return { title: title || "Título Vacío", date: date || DEFAULT_DATE };

        } catch (error) {
            console.error(`Error al obtener datos (Fila ${TARGET_ROW}):`, error);
            return { title: `ERROR: Fila ${TARGET_ROW} Desconocida`, date: "2099-12-31" };
        }
    }

    // 4. Lógica del Contador
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
    
    // 5. Inicialización
    updateCountdown();
    // La actualización se hace cada 5 minutos
    setInterval(updateCountdown, 1000 * 60 * 5); 
});
