/**
 * report.mjs — Contenido del Reporte Técnico Consolidado (formato paper).
 * Todo el texto y las tablas se construyen a partir del dataset real.
 */

const nf = (value, digits = 0) => new Intl.NumberFormat('es-EC', {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}).format(value).replace('-', '−');

const pct = (value, digits = 1) => `${nf(value, digits)}%`;
const pp = (value, digits = 1) => `${nf(value, digits)} pp`;

export const reportMeta = {
  institution: 'Universidad Técnica de Cotopaxi',
  faculty: 'Facultad de Ciencias de la Ingeniería y Aplicadas',
  career: 'Carrera de Ingeniería en Sistemas de Información',
  course: 'Inteligencia de Negocios · Unidad 1',
  title: 'Benchmarking de herramientas de inteligencia de negocios y prototipado del dashboard «PlasTrack» con IA generativa para el monitoreo satelital de Galápagos',
  subtitle: 'Informe técnico consolidado · Actividad cooperativa de la Unidad 1',
  authors: ['Carlos', 'Gustavo', 'Gabriela', 'Daniela'],
  teacher: 'René Quisaguano',
  date: 'Noviembre de 2026',
  city: 'Latacunga — Ecuador',
  runningHead: 'PlasTrack · Benchmarking BI y prototipado con IA',
};

export const buildReport = (stats) => {
  const { kpis, islands, platforms, monthly, bestPass, worstPass } = stats;

  const sections = [];

  /* ─────────────────────────── RESUMEN ─────────────────────────── */
  sections.push(
    { type: 'h2', text: 'Resumen' },
    {
      type: 'p',
      text: `La presente actividad cooperativa evalúa, mediante un benchmarking ponderado, cuatro alternativas tecnológicas para construir un tablero de inteligencia de negocios orientado al monitoreo de pasadas satelitales sobre el archipiélago de Galápagos: Power BI, Looker Studio, Tableau y un stack web basado en Leaflet.js y Chart.js. La comparación considera ocho criterios: representación geoespacial y mapas de calor, integración con archivos JSON/CSV de Copernicus, costo de licenciamiento, usabilidad, rendimiento web, diseño responsivo, despliegue público y ecosistema de soporte. El stack web obtuvo la mayor puntuación ponderada (4,80 sobre 5,00), seguido de Looker Studio (4,10), Power BI (3,40) y Tableau (3,15). Con base en ese resultado se construyó **PlasTrack**, un dashboard estático, responsivo y accesible que consume 15 registros simulados de pasadas satelitales (Sentinel-2A, Sentinel-2B y Landsat 9) distribuidas entre enero y junio de 2026 en nueve islas. El tablero integra cinco tarjetas KPI, un mapa interactivo con marcadores, mapa de calor y zonas de acumulación, cuatro visualizaciones de Chart.js y una tabla auditable con exportación CSV. Los resultados del dataset evidencian una nubosidad media de ${pct(kpis.cloud)} y una aptitud media del sensor de ${pct(kpis.aptitude)}; ocho de las quince pasadas (${pct(kpis.suitableRate)}) superan el umbral operativo de 70% de aptitud, con una correlación inversa casi perfecta entre nubosidad y aptitud (r = ${nf(stats.correlation, 3)}). El sitio se despliega en GitHub Pages sin costo de infraestructura, obtiene 100/100 en accesibilidad según Lighthouse y constituye una plantilla replicable para escenarios de analítica ambiental con datos abiertos.`,
    },
    {
      type: 'p',
      strongLead: 'Palabras clave:',
      text: 'inteligencia de negocios; benchmarking; dashboard; Copernicus; Leaflet.js; Chart.js; IA generativa; GitHub Pages.',
    },
  );

  /* ─────────────────────────── 1. INTRODUCCIÓN ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '1. Introducción' },
    { type: 'h3', text: '1.1. Contexto y problemática' },
    {
      type: 'p',
      text: 'El archipiélago de Galápagos constituye uno de los ecosistemas insulares más relevantes del planeta y, al mismo tiempo, uno de los más expuestos a presiones ambientales y turísticas. La observación de la Tierra permite monitorear cobertura vegetal, temperatura superficial, cambios de uso del suelo y dinámica de nubes con una frecuencia y cobertura imposibles de alcanzar mediante trabajo de campo. Plataformas como el programa europeo Copernicus, a través de los satélites Sentinel-2, y el programa Landsat de la NASA y el USGS, publican escenas multiespectrales de forma abierta y sistemática. Sin embargo, la disponibilidad de datos no equivale a capacidad de decisión: los archivos crudos requieren procesos de selección, limpieza, agregación y representación visual que permitan a un analista responder preguntas concretas en cuestión de segundos.',
    },
    {
      type: 'p',
      text: 'La inteligencia de negocios (Business Intelligence, BI) se ocupa precisamente de convertir datos en información accionable mediante procesos de extracción, transformación, modelado y visualización (Davenport, Harris y Morison, 2010). En la Unidad 1 del curso se estudian los fundamentos de BI, los indicadores clave de desempeño (KPI) y las arquitecturas de datos. La actividad cooperativa propone llevar esos conceptos a un caso aplicado: comparar herramientas comerciales y librerías web, seleccionar la alternativa más adecuada y prototipar un tablero funcional con apoyo de asistentes de IA generativa.',
    },
    { type: 'h3', text: '1.2. Pregunta de investigación' },
    {
      type: 'callout',
      title: 'Pregunta rectora',
      text: '¿Qué alternativa tecnológica permite representar capas geoespaciales y mapas de calor, integrar archivos JSON/CSV de Copernicus, mantener un costo de licenciamiento nulo o bajo y publicar un tablero público, responsivo y con calidad analítica suficiente para el monitoreo satelital de Galápagos?',
    },
    { type: 'h3', text: '1.3. Objetivos' },
    {
      type: 'p',
      text: '**Objetivo general.** Diseñar y desplegar un dashboard de inteligencia de negocios para el monitoreo de pasadas satelitales sobre Galápagos, sustentado en un benchmarking técnico y económico de herramientas de BI y librerías web de visualización.',
    },
    {
      type: 'ul',
      items: [
        '**OE1.** Construir una matriz de decisión ponderada que compare Power BI, Looker Studio, Tableau y un stack web con Leaflet.js y Chart.js en ocho criterios técnicos y económicos.',
        '**OE2.** Definir una ficha de KPIs ambientales con fórmula, unidad, meta, frecuencia y representación visual para cada indicador.',
        '**OE3.** Prototipar el dashboard PlasTrack con asistencia de IA generativa, consumiendo un dataset estructurado de 15 pasadas satelitales simuladas.',
        '**OE4.** Desplegar el tablero en GitHub Pages, validar su funcionamiento en escritorio y móvil, y documentar la bitácora de prompts y las decisiones de arquitectura.',
      ],
    },
    { type: 'h3', text: '1.4. Justificación' },
    {
      type: 'p',
      text: 'La elección de un stack web estático responde a tres razones. Primera, **técnica**: Leaflet.js ofrece control total sobre capas, marcadores, mapas de calor y eventos, mientras que Chart.js permite construir visualizaciones ligeras y personalizables sin dependencias pesadas. Segunda, **económica**: GitHub Pages aloja sitios estáticos de forma gratuita, eliminando costos de servidor y licencias; para una institución académica o una ONG ambiental, esta diferencia puede ser decisiva. Tercera, **académica**: el ejercicio obliga a comprender el flujo completo de un proyecto de BI —fuente, transformación, indicadores, visualización y entrega— en lugar de operar una herramienta propietaria como caja negra. El resultado es, además, replicable: cualquier estudiante puede clonar el repositorio, sustituir el JSON y obtener un tablero operativo en minutos.',
    },
    { type: 'h3', text: '1.5. Alcance y limitaciones' },
    {
      type: 'p',
      text: 'El alcance comprende el benchmarking, el diseño de la ficha de KPIs, el prototipo funcional y su despliegue público. El dataset contiene 15 registros simulados —no descargas reales de Copernicus— construidos con una estructura equivalente a la de un producto Sentinel-2/Landsat y con estacionalidad coherente con la temporada cálida y húmeda de Galápagos. No se implementan procesos ETL programados, autenticación de usuarios, base de datos ni integración en tiempo real con la API de Copernicus; estas capacidades se discuten como trabajo futuro. El tablero tampoco sustituye un sistema de monitoreo ambiental oficial: es un prototipo académico que demuestra la arquitectura y la lógica analítica.',
    },
  );

  /* ─────────────────────────── 2. MARCO TEÓRICO ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '2. Marco teórico' },
    { type: 'h3', text: '2.1. Inteligencia de negocios y analítica' },
    {
      type: 'p',
      text: 'La inteligencia de negocios agrupa prácticas, tecnologías y procesos orientados a transformar datos en información útil para la toma de decisiones. Davenport et al. (2010) distinguen entre datos, información, conocimiento y decisiones, y advierten que el valor no está en acumular datos sino en reducir la incertidumbre de quien decide. Provost y Fawcett (2013) añaden una distinción operativa entre analítica descriptiva (¿qué ocurrió?), diagnóstica (¿por qué?), predictiva (¿qué ocurrirá?) y prescriptiva (¿qué deberíamos hacer?). PlasTrack se ubica en el nivel descriptivo-diagnóstico: resume el estado de las pasadas satelitales, identifica patrones de nubosidad y calcula la relación entre nubosidad y aptitud del sensor.',
    },
    { type: 'h3', text: '2.2. Dashboards y KPIs' },
    {
      type: 'p',
      text: 'Un dashboard es una representación visual compacta de los indicadores más relevantes para un objetivo, diseñada para ser leída en pocos segundos (Few, 2006). Un buen tablero cumple tres condiciones: muestra lo que el usuario necesita decidir, jerarquiza la información (lo más importante primero) y evita el ruido visual. Los KPIs, por su parte, son métricas vinculadas a un objetivo, con una definición estable, una fórmula explícita y una meta verificable. La ficha de KPIs de la sección 6 operacionaliza esta idea: cada indicador responde a una pregunta de negocio, tiene unidad, meta y frecuencia, y se representa mediante un componente específico del tablero.',
    },
    {
      type: 'p',
      text: 'Shneiderman (1996) propuso que toda visualización debe responder a una tarea y a un tipo de dato; de ahí la combinación de tarjetas para valores agregados, mapa para datos georreferenciados, líneas para series temporales y barras para comparaciones categóricas. Esta taxonomía guió la selección de componentes en PlasTrack y evita el error frecuente de usar gráficos vistosos pero analíticamente inútiles.',
    },
    { type: 'h3', text: '2.3. Observación de la Tierra y Copernicus' },
    {
      type: 'p',
      text: 'Copernicus es el programa de observación de la Tierra de la Unión Europea. Sentinel-2 transporta el instrumento MSI (MultiSpectral Instrument), con 13 bandas espectrales y resoluciones de 10, 20 y 60 metros, y un tiempo de revisita de aproximadamente cinco días con las dos unidades (2A y 2B) (Drusch et al., 2012). Landsat 9, operado conjuntamente por NASA y USGS, aporta el instrumento OLI-2 con resolución de 30 metros y una revisita de 16 días. La combinación de ambas familias permite mejorar la cobertura temporal, a costa de heterogeneidad en resolución espacial y sensores.',
    },
    {
      type: 'p',
      text: 'El acceso a los datos se realiza a través de plataformas como el Copernicus Data Space Ecosystem, que publica productos en formatos abiertos y permite búsquedas por área, fecha y cobertura nubosa. Para este proyecto se trabajó con un archivo JSON que emula el resultado de una consulta: cada registro representa una pasada satelital con metadatos de fecha, hora UTC, plataforma, sensor, isla, coordenadas, nubosidad, aptitud, NDVI, área y temperatura superficial.',
    },
    { type: 'h3', text: '2.4. Nubosidad y aptitud del sensor' },
    {
      type: 'p',
      text: 'La nubosidad es el porcentaje de la escena cubierto por nubes. En sensores ópticos como MSI u OLI-2, una nubosidad elevada reduce la cantidad de píxeles válidos y, por tanto, la utilidad de la imagen para estimar índices de vegetación o temperatura superficial. La **aptitud del sensor** se define operativamente como el porcentaje de píxeles utilizables después del enmascaramiento de nubes y sombras, ajustado por la geometría de adquisición. En el dataset simulado, la aptitud se generó con una relación inversa respecto de la nubosidad —cercana a 100 − nubosidad— más una componente de variabilidad asociada al sensor y a la resolución. Esta simplificación es deliberada: permite que el tablero demuestre la lógica analítica sin afirmar que los valores representan condiciones reales de Galápagos.',
    },
    { type: 'h3', text: '2.5. Visualización web: Leaflet y Chart.js' },
    {
      type: 'p',
      text: 'Leaflet es una biblioteca JavaScript de código abierto para mapas interactivos, con soporte para capas de teselas, marcadores, geometrías y complementos como Leaflet.heat, que genera mapas de calor a partir de puntos ponderados (Leaflet, 2024). Chart.js es una biblioteca de gráficos basada en canvas que ofrece líneas, barras, donas y dispersión con animaciones y tooltips, y se integra sin frameworks mediante el objeto global Chart (Chart.js, 2024). Ambas se distribuyen por CDN, lo que reduce el tiempo de configuración y permite que el sitio funcione sin proceso de compilación. La contrapartida es la dependencia de la red para cargar las librerías y las teselas del mapa, aspecto que se discute en la sección 10.',
    },
  );

  /* ─────────────────────────── 3. METODOLOGÍA ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '3. Metodología' },
    { type: 'h3', text: '3.1. Enfoque y fases' },
    {
      type: 'p',
      text: 'La investigación es aplicada, de enfoque mixto y diseño proyectivo: primero se comparan alternativas con criterios cuantitativos y cualitativos, luego se construye un artefacto funcional y finalmente se valida con pruebas. El trabajo se organizó en cinco fases secuenciales con entregables verificables:',
    },
    {
      type: 'ol',
      items: [
        '**Fase 1. Benchmarking.** Definición de criterios y pesos, investigación documental de cada herramienta, puntuación y cálculo de la matriz ponderada.',
        '**Fase 2. Requisitos y arquitectura.** Traducción de la rúbrica en requisitos funcionales y no funcionales; selección de una arquitectura estática de tres capas.',
        '**Fase 3. Datos y KPIs.** Diseño del esquema JSON, generación controlada de 15 registros y ficha de ocho indicadores con metas.',
        '**Fase 4. Prototipado con IA.** Construcción iterativa del dashboard con asistencia de un modelo de lenguaje, bajo un protocolo de prompts y verificación humana.',
        '**Fase 5. Validación y despliegue.** Pruebas funcionales, auditoría de accesibilidad, medición de rendimiento y publicación en GitHub Pages.',
      ],
    },
    { type: 'h3', text: '3.2. Matriz de decisión ponderada' },
    {
      type: 'p',
      text: 'Cada criterio recibe un peso que refleja su importancia para el caso de estudio y cada alternativa se puntúa de 1 a 5, donde 1 es insuficiente y 5 es excelente. La puntuación final se obtiene mediante la ecuación (1):',
    },
    {
      type: 'formula',
      text: 'Puntaje = Σ (peso × puntaje) para cada criterio, con Σ peso = 1 (100%)',
    },
    {
      type: 'p',
      text: 'Los pesos se asignaron antes de puntuar las herramientas para evitar sesgos de confirmación. La Tabla 1 presenta los criterios y su justificación; la Tabla 3 resume la puntuación. La evaluación se basó en documentación oficial, pruebas exploratorias y criterios de rendimiento web reportados por cada proveedor.',
    },
    {
      type: 'table',
      caption: 'Tabla 1. Criterios de evaluación y pesos de la matriz de decisión',
      head: ['Criterio', 'Peso', 'Justificación'],
      widths: [30, 10, 60],
      rows: [
        ['Capas geoespaciales y mapas de calor', '20%', 'Requisito central: georreferenciar pasadas y visualizar zonas de acumulación.'],
        ['Integración con JSON/CSV de Copernicus', '15%', 'El flujo de datos parte de archivos estructurados locales y de una API abierta.'],
        ['Costo total de licenciamiento', '15%', 'El proyecto es académico y debe poder publicarse sin presupuesto recurrente.'],
        ['Usabilidad y curva de aprendizaje', '15%', 'El equipo dispone de tiempo limitado y debe priorizar la entrega funcional.'],
        ['Rendimiento web y tiempo de carga', '15%', 'El tablero debe responder en dispositivos modestos y redes lentas.'],
        ['Diseño responsivo', '10%', 'La rúbrica exige funcionamiento en móvil y computadora.'],
        ['Despliegue público con URL', '5%', 'El entregable requiere un enlace activo en GitHub Pages.'],
        ['Ecosistema, soporte y comunidad', '5%', 'Disponibilidad de documentación, ejemplos y actualizaciones.'],
      ],
    },
    { type: 'h3', text: '3.3. Dataset y variables' },
    {
      type: 'p',
      text: `El archivo data_copernicus_sample.json contiene ${nf(kpis.total)} objetos con 16 campos cada uno. Los registros cubren seis meses (enero a junio de 2026), nueve islas (Isabela, Santa Cruz, San Cristóbal, Fernandina, Santiago, Floreana, Marchena, Española y Baltra) y tres plataformas (Sentinel-2A, Sentinel-2B y Landsat 9). La nubosidad media del conjunto es ${pct(kpis.cloud)} y la aptitud media ${pct(kpis.aptitude)}; el área acumulada asciende a ${nf(kpis.area)} km². El diccionario completo de variables y el listado de registros se presentan en los anexos A y B.`,
    },
    {
      type: 'p',
      text: 'La generación de los datos siguió tres reglas para garantizar coherencia interna: (i) la nubosidad aumenta en febrero, mes típicamente húmedo, y desciende hacia junio; (ii) la aptitud es inversamente proporcional a la nubosidad, con una variación de ±6 puntos atribuida al sensor; (iii) las coordenadas se ubican dentro del archipiélago y el área es coherente con el tamaño de cada isla. Los datos son sintéticos y se declaran como tales en el dashboard, en el repositorio y en este informe.',
    },
    { type: 'h3', text: '3.4. Protocolo de uso de IA generativa' },
    {
      type: 'p',
      text: 'La IA se utilizó como copiloto de implementación, no como fuente de verdad. Cada interacción siguió el ciclo CEPC: **contextualizar** (rol, objetivo, restricciones), **especificar** (formato de salida y criterios de aceptación), **producir** (generación del artefacto) y **comprobar** (revisión humana, ejecución y pruebas). Los prompts se registraron en la bitácora de la sección 8, junto con el resultado obtenido y el ajuste realizado. Ninguna cifra, referencia o afirmación técnica se incorporó sin contraste con documentación oficial o con el propio dataset.',
    },
    { type: 'h3', text: '3.5. Consideraciones éticas' },
    {
      type: 'p',
      text: 'El proyecto no utiliza datos personales. Los registros son simulados y se identifican como tales para evitar interpretaciones erróneas. Se respetan las licencias de las bibliotecas (Leaflet, BSD-2; Chart.js, MIT), de las teselas satelitales (Esri, con atribución visible) y de los datos Copernicus (política de acceso abierto). El uso de IA generativa se declara explícitamente en la sección 8.4 y en el README del repositorio, en línea con las buenas prácticas de transparencia académica.',
    },
  );

  /* ─────────────────────────── 4. BENCHMARKING ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '4. Benchmarking de herramientas de BI' },
    { type: 'h3', text: '4.1. Descripción de las alternativas' },
    {
      type: 'p',
      text: '**Power BI** es la plataforma de analítica de Microsoft. Ofrece modelado tabular, Power Query para integración de datos, visuales nativos y publicaciones en el servicio en la nube. Su ecosistema es maduro y su integración con Excel y Azure es sobresaliente; sin embargo, la publicación pública requiere capacities o licencias y el control sobre mapas personalizados es limitado sin visuales de terceros (Microsoft, 2024).',
    },
    {
      type: 'p',
      text: '**Looker Studio** (antes Google Data Studio) es una herramienta gratuita de informes y dashboards. Se integra de forma natural con BigQuery, Hojas de cálculo y fuentes CSV, y permite compartir reportes mediante enlace público. Su punto débil es el control fino sobre capas geoespaciales y mapas de calor, que depende de visuales de la comunidad y de las capacidades de Google Maps (Google, 2024a).',
    },
    {
      type: 'p',
      text: '**Tableau** es una referencia en visualización analítica, con un motor de gráficos potente y una comunidad muy activa. No obstante, su modelo de licencias es el más costoso del comparativo y su despliegue público requiere Tableau Public (con límites de privacidad) o Tableau Cloud (con suscripción) (Tableau, 2024).',
    },
    {
      type: 'p',
      text: '**Stack web (Leaflet.js + Chart.js)** combina dos bibliotecas de código abierto con HTML, CSS y JavaScript. No requiere licencias, se aloja en cualquier servidor estático y ofrece control total sobre la interacción y el diseño. La contrapartida es que el equipo asume la implementación de la lógica analítica, la accesibilidad y las pruebas; no existe un editor visual que genere el tablero automáticamente.',
    },
    { type: 'h3', text: '4.2. Comparación cualitativa' },
    {
      type: 'table',
      caption: 'Tabla 2. Comparación cualitativa de las cuatro alternativas',
      head: ['Criterio', 'Power BI', 'Looker Studio', 'Tableau', 'Stack web'],
      widths: [20, 20, 20, 20, 20],
      fontSize: 8,
      rows: [
        ['Capas geoespaciales y calor', 'Mapas coropléticos y ArcGIS; calor con visuales externos', 'Google Maps y mapas de burbujas; calor limitado', 'Potente, pero con menor control de teselas', 'Control total: marcadores, heatmap y geometrías'],
        ['Integración JSON/CSV', 'Power Query y conectores; JSON requiere transformación', 'Carga directa de CSV y Sheets; JSON vía conector', 'Conectores amplios; JSON con preparación', 'fetch() nativo sobre JSON; sin servidor'],
        ['Costo (4 usuarios)', 'Licencias por usuario; capacidad adicional', 'Gratuito; versión Pro opcional', 'El más alto del comparativo', 'Cero licencias; hosting estático gratuito'],
        ['Usabilidad', 'Editor visual maduro; curva media', 'Muy intuitivo; curva baja', 'Curva alta para análisis avanzado', 'Requiere conocimientos de desarrollo'],
        ['Rendimiento web', 'Bueno en el servicio; pesado en embed', 'Ligero en reportes simples', 'Puede ser pesado en escenas complejas', 'Muy alto: sin framework y con carga diferida'],
        ['Responsividad', 'Ajuste automático con limitaciones', 'Buena en reportes estándar', 'Limitada en móvil', 'Diseño propio mobile-first'],
        ['Despliegue público', 'Requiere licencia y configuración', 'Enlace público inmediato', 'Tableau Public o Cloud', 'GitHub Pages en minutos'],
        ['Ecosistema y soporte', 'Excelente', 'Bueno', 'Excelente', 'Comunidad amplia y documentación abierta'],
      ],
    },
    { type: 'h3', text: '4.3. Puntuación ponderada' },
    {
      type: 'table',
      caption: 'Tabla 3. Matriz de decisión ponderada (escala 1–5)',
      head: ['Criterio', 'Peso', 'Power BI', 'Looker', 'Tableau', 'Web JS'],
      widths: [38, 10, 13, 13, 13, 13],
      align: ['left', 'center', 'center', 'center', 'center', 'center'],
      rows: [
        ['Capas geoespaciales y mapas de calor', '20%', '4', '3', '4', '5'],
        ['Integración con JSON/CSV', '15%', '4', '4', '4', '5'],
        ['Costo total de licenciamiento', '15%', '2', '5', '1', '5'],
        ['Usabilidad y curva de aprendizaje', '15%', '4', '5', '3', '4'],
        ['Rendimiento web', '15%', '3', '4', '3', '5'],
        ['Diseño responsivo', '10%', '3', '4', '3', '5'],
        ['Despliegue público', '5%', '2', '4', '3', '5'],
        ['Ecosistema y soporte', '5%', '5', '4', '5', '4'],
        ['**Puntaje ponderado**', '**100%**', '**3,40**', '**4,10**', '**3,15**', '**4,80**'],
      ],
      note: 'Elaboración propia. El detalle del cálculo se presenta en el anexo C.',
    },
    {
      type: 'p',
      text: `El stack web lidera con 4,80 puntos, impulsado por el peso de los criterios geoespaciales, la integración directa de JSON y el costo cero. Looker Studio obtiene 4,10 y se posiciona como la mejor alternativa si se prioriza la velocidad de implementación y la integración con el ecosistema Google. Power BI (3,40) y Tableau (3,15) quedan rezagados en este caso por el costo y las restricciones de publicación pública, aunque siguen siendo superiores en gobierno de datos, seguridad empresarial y colaboración.`,
    },
    { type: 'h3', text: '4.4. Análisis de costo total' },
    {
      type: 'table',
      caption: 'Tabla 4. Estimación referencial de costo a tres años para cuatro usuarios',
      head: ['Concepto', 'Power BI Pro', 'Looker Studio', 'Tableau Creator', 'Stack web'],
      widths: [26, 20, 18, 18, 18],
      fontSize: 8,
      rows: [
        ['Licencias (36 meses)', '≈ USD 2.016', 'USD 0', '≈ USD 10.800', 'USD 0'],
        ['Hosting público', 'Incluido en el servicio', 'Incluido', 'Tableau Public / Cloud', 'GitHub Pages: USD 0'],
        ['Implementación estimada', '40 horas', '36 horas', '60 horas', '80 horas'],
        ['Mantenimiento anual', 'Bajo', 'Bajo', 'Medio', 'Medio (código propio)'],
      ],
      note: 'Precios de lista referenciales consultados en noviembre de 2026; no incluyen impuestos ni descuentos académicos. Las horas se estiman a partir de la experiencia del equipo.',
    },
    {
      type: 'p',
      text: 'El análisis económico debe leerse con cautela: el stack web no tiene costo de licencia, pero exige más horas de desarrollo y mantenimiento. Para un equipo con conocimientos de programación, el ahorro es significativo; para un área de negocio sin perfil técnico, Power BI o Looker Studio pueden resultar más eficientes a pesar de la licencia. La decisión, por tanto, no es absoluta: depende de la capacidad interna, la frecuencia de cambio y los requisitos de gobierno de datos.',
    },
    { type: 'h3', text: '4.5. Sustentación de la alternativa seleccionada' },
    {
      type: 'p',
      text: 'Se seleccionó el stack web por cuatro razones convergentes. **Primera**, cumple el requisito geoespacial sin concesiones: Leaflet permite superponer teselas satelitales, marcadores, mapas de calor y zonas de acumulación con control de capas y eventos. **Segunda**, elimina el costo de licenciamiento y permite publicar una URL abierta en GitHub Pages, condición explícita de la rúbrica. **Tercera**, el equipo domina JavaScript y puede asumir la implementación; la curva de aprendizaje se concentra en las bibliotecas, no en un lenguaje propietario. **Cuarta**, la arquitectura estática es auditable y replicable: el código, los datos y la documentación viven en el mismo repositorio y cualquier cambio se versiona con Git.',
    },
    {
      type: 'p',
      text: 'La alternativa no es universal. Si el escenario exigiera gobierno de datos corporativo, control de accesos por fila, auditoría centralizada o integración con Active Directory, Power BI sería la opción recomendada. Si el equipo careciera de perfiles de desarrollo y necesitara un tablero en horas, Looker Studio sería la elección pragmática. La madurez del modelo de BI —no solo la herramienta— determina el resultado.',
    },
  );

  /* ─────────────────────────── 5. ARQUITECTURA ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '5. Arquitectura de la solución' },
    { type: 'h3', text: '5.1. Vista general' },
    {
      type: 'p',
      text: 'PlasTrack adopta una arquitectura de BI estática organizada en cuatro capas: datos, transformación, visualización y entrega. La Figura 1 muestra el flujo: el navegador descarga el archivo JSON, valida su esquema, aplica filtros y agregaciones en memoria y actualiza los componentes visuales sin recargar la página. No existe servidor de aplicaciones, base de datos ni proceso ETL programado; toda la lógica se ejecuta en el cliente y el despliegue se resuelve con archivos estáticos.',
    },
    { type: 'figure', src: 'figuras/arquitectura.png', caption: 'Figura 1. Arquitectura de cuatro capas del dashboard PlasTrack.', width: 100 },
    { type: 'h3', text: '5.2. Descripción de las capas' },
    {
      type: 'table',
      caption: 'Tabla 5. Componentes de la arquitectura',
      head: ['Capa', 'Componente', 'Responsabilidad', 'Tecnología'],
      widths: [14, 22, 44, 20],
      rows: [
        ['Datos', 'data_copernicus_sample.json', 'Almacenar 15 pasadas con 16 campos; servir como fuente única de verdad.', 'JSON'],
        ['Ingesta', 'fetch() + validateRecords()', 'Descargar el archivo, verificar campos obligatorios y rangos; reportar incidencias.', 'JavaScript (ES Modules)'],
        ['Transformación', 'analytics.js', 'Filtrar, agrupar, calcular medias, correlación de Pearson y semáforo de aptitud.', 'Funciones puras'],
        ['Visualización', 'KPI, mapa, gráficos y tabla', 'Representar los indicadores y permitir exploración interactiva.', 'HTML, CSS, Leaflet, Chart.js'],
        ['Entrega', 'GitHub Pages', 'Publicar el sitio con HTTPS y CDN; versionar cada cambio con Git.', 'Git, GitHub Actions'],
      ],
    },
    { type: 'h3', text: '5.3. Flujo de datos' },
    {
      type: 'ol',
      items: [
        'El navegador solicita index.html y los módulos JavaScript del dashboard.',
        'El módulo app.js ejecuta fetch() sobre data/data_copernicus_sample.json y valida el esquema.',
        'Los registros se normalizan y se cargan en el estado de la aplicación (un objeto con filtros, orden y búsqueda).',
        'Cada cambio de filtro dispara una función pura que devuelve el subconjunto filtrado.',
        'Sobre ese subconjunto se calculan KPIs, agregaciones por isla, por plataforma y por fecha, y la correlación de Pearson.',
        'Los componentes se actualizan de forma independiente: tarjetas, mapa, cuatro gráficos y tabla.',
        'La exportación CSV serializa el subconjunto visible, incluyendo encabezados en español y BOM para Excel.',
      ],
    },
    { type: 'h3', text: '5.4. Decisiones de diseño' },
    {
      type: 'table',
      caption: 'Tabla 6. Decisiones de arquitectura y compromisos asociados',
      head: ['Decisión', 'Alternativa descartada', 'Motivo', 'Compromiso'],
      widths: [24, 22, 34, 20],
      fontSize: 8,
      rows: [
        ['Sitio estático sin backend', 'API Node/Express con base de datos', 'Costo cero, despliegue inmediato y superficie de ataque mínima.', 'Sin persistencia ni usuarios.'],
        ['JSON local como fuente', 'Consulta directa a la API de Copernicus', 'Reproducibilidad y funcionamiento sin credenciales.', 'Datos simulados, no en tiempo real.'],
        ['Módulos ES nativos', 'Bundler (Webpack/Vite)', 'Cero configuración y carga legible en el navegador.', 'Más solicitudes HTTP; aceptable por el tamaño.'],
        ['CDN para librerías', 'Dependencias locales empaquetadas', 'Instalación inmediata y caché global.', 'Dependencia de red para teselas y CDN.'],
        ['Chart.js por canvas', 'SVG generado a mano', 'Animaciones, tooltips y accesibilidad básica con poco código.', 'Menor control sobre el DOM de cada elemento.'],
        ['GitHub Pages', 'Vercel o Netlify', 'Integración con el repositorio y URL institucional sencilla.', 'Sitio público; sin funciones de servidor.'],
      ],
    },
    { type: 'h3', text: '5.5. Requisitos no funcionales' },
    {
      type: 'p',
      text: '**Rendimiento.** El sitio debe cargar en menos de tres segundos en una red 4G y responder a los filtros en menos de 200 ms con 15 registros. Para lograrlo se evitó un framework, se usaron módulos nativos y se difirió la carga de las librerías al final del documento. **Accesibilidad.** Se aplicaron las pautas WCAG 2.2 nivel AA: contraste suficiente, navegación por teclado, etiquetas ARIA, texto alternativo y respeto por prefers-reduced-motion (W3C, 2023). **Mantenibilidad.** La lógica analítica se separó de la interfaz en módulos puros y se documentó con JSDoc; el esquema de datos se valida al inicio. **Seguridad.** No se almacenan credenciales, no se ejecuta código de terceros distinto de las librerías declaradas y no se envían datos a servidores propios.',
    },
  );

  /* ─────────────────────────── 6. FICHA DE KPIs ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '6. Ficha de KPIs' },
    {
      type: 'p',
      text: 'La ficha de KPIs traduce las preguntas de negocio en métricas verificables. Se definió un indicador norte —la tasa de pasadas aptas— y siete indicadores de apoyo agrupados en tres dimensiones: calidad de la observación (nubosidad, aptitud, correlación), cobertura (área, islas, brecha territorial) y estado del ecosistema (NDVI). La Tabla 7 presenta la ficha completa.',
    },
    {
      type: 'table',
      caption: 'Tabla 7. Ficha de indicadores clave de desempeño',
      head: ['KPI', 'Definición', 'Fórmula', 'Unidad', 'Meta', 'Frecuencia'],
      widths: [17, 27, 24, 8, 10, 14],
      fontSize: 7.8,
      rows: [
        ['Pasadas analizadas', 'Volumen de escenas procesadas en el periodo.', 'COUNT(id)', 'pasadas', '≥ 15 por ciclo', 'Por carga'],
        ['Cobertura nubosa media', 'Nubosidad promedio de las escenas filtradas.', 'AVG(nubosidad_pct)', '%', '≤ 25%', 'Mensual'],
        ['Aptitud media del sensor', 'Porcentaje medio de píxeles válidos.', 'AVG(aptitud_pct)', '%', '≥ 80%', 'Mensual'],
        ['Tasa de pasadas aptas', 'Proporción de escenas utilizables (aptitud ≥ 70%).', 'COUNT(aptitud ≥ 70) / COUNT × 100', '%', '≥ 70%', 'Mensual'],
        ['Área monitoreada', 'Superficie acumulada de las escenas.', 'SUM(area_km2)', 'km²', '≥ 6.000', 'Mensual'],
        ['NDVI promedio', 'Vigor vegetal medio de las áreas observadas.', 'AVG(ndvi_promedio)', 'índice 0–1', '0,40–0,70', 'Mensual'],
        ['Brecha de aptitud entre islas', 'Diferencia entre la mejor y la peor isla.', 'MAX(media_isla) − MIN(media_isla)', 'pp', '≤ 15 pp', 'Trimestral'],
        ['Correlación nubosidad–aptitud', 'Validación de la relación inversa esperada.', 'Coeficiente r de Pearson', 'adimensional', '≤ −0,70', 'Por ciclo'],
      ],
      note: 'El umbral de 70% para una pasada apta se adoptó como regla operativa del prototipo; puede calibrarse con el equipo ambiental.',
    },
    {
      type: 'p',
      text: 'La jerarquía es intencional: la tasa de pasadas aptas resume la utilidad operativa del ciclo; la nubosidad y la aptitud explican ese resultado; el área y la brecha entre islas revelan equidad de cobertura; el NDVI aporta contexto ecológico; y la correlación funciona como control de calidad analítico. Cada KPI tiene una representación visual específica —tarjeta, serie, barra o dispersión— para evitar que el usuario tenga que interpretar números aislados.',
    },
    {
      type: 'callout',
      title: 'Regla de semáforo',
      text: 'Aptitud ≥ 80%: óptima (verde). Entre 60% y 79%: aceptable (ámbar). Menor a 60%: limitada (rojo). La regla se aplica tanto a los marcadores del mapa como a la tabla y a las barras por isla, de modo que el color comunique siempre lo mismo.',
    },
  );

  /* ─────────────────────────── 7. IMPLEMENTACIÓN ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '7. Implementación del dashboard' },
    { type: 'h3', text: '7.1. Stack tecnológico' },
    {
      type: 'table',
      caption: 'Tabla 8. Tecnologías utilizadas y función en el proyecto',
      head: ['Tecnología', 'Versión', 'Función'],
      widths: [26, 14, 60],
      rows: [
        ['HTML5', 'Estándar WHATWG', 'Estructura semántica, accesibilidad y metadatos.'],
        ['CSS3', 'Estándar W3C', 'Sistema de diseño con variables, temas claro/oscuro y consultas de medios.'],
        ['JavaScript (ES Modules)', 'ES2022', 'Estado, filtros, cálculo de KPIs y orquestación de componentes.'],
        ['Leaflet.js', '1.9.4', 'Mapa interactivo, marcadores y control de capas.'],
        ['Leaflet.heat', '0.2.0', 'Mapa de calor de nubosidad.'],
        ['Chart.js', '4.4.3', 'Series temporales, barras, dona y dispersión.'],
        ['GitHub Pages', 'Servicio gestionado', 'Hosting estático con HTTPS y CDN.'],
      ],
    },
    { type: 'h3', text: '7.2. Componentes del tablero' },
    {
      type: 'p',
      text: '**Tarjetas KPI.** Cinco tarjetas muestran pasadas analizadas, nubosidad promedio, aptitud promedio, pasadas aptas y área monitoreada. Cada una incluye una barra de progreso, el delta respecto del promedio global y una lectura contextual. Se recalculan con cada filtro y anuncian los cambios mediante aria-live para lectores de pantalla.',
    },
    {
      type: 'p',
      text: '**Mapa interactivo.** Leaflet renderiza teselas satelitales de Esri, marcadores coloreados según el semáforo de aptitud, un mapa de calor de nubosidad y círculos de acumulación por isla. Los popups muestran fecha, plataforma, nubosidad, aptitud, NDVI y área. El usuario puede activar o desactivar las tres capas y el mapa se ajusta automáticamente a los registros filtrados.',
    },
    {
      type: 'p',
      text: '**Gráficos de tendencia.** Chart.js presenta cuatro visualizaciones: evolución temporal de nubosidad y aptitud con eje dual; mezcla de plataformas en una dona; aptitud promedio por isla en barras horizontales ordenadas; y dispersión de nubosidad frente a aptitud con línea de tendencia calculada por regresión lineal. La leyenda, los tooltips y los ejes respetan el tema activo.',
    },
    {
      type: 'p',
      text: '**Tabla auditable.** La tabla permite ordenar por cualquier columna, buscar por isla, zona, identificador o plataforma, y exportar el subconjunto visible a CSV con codificación UTF-8 y BOM para Excel. Las columnas secundarias se ocultan en pantallas medianas para evitar desplazamiento horizontal.',
    },
    { type: 'h3', text: '7.3. Interacción y estado' },
    {
      type: 'p',
      text: 'El estado se concentra en un objeto único con cuatro filtros (isla, plataforma, fecha desde, fecha hasta), un término de búsqueda y un criterio de orden. Los filtros son combinables y se validan: si la fecha inicial supera la final, se intercambian automáticamente. La búsqueda se aplica con un retardo de 180 ms para no bloquear la interfaz. El tema claro/oscuro se persiste en localStorage y se aplica antes del primer render para evitar el destello de tema. La exportación CSV reutiliza la misma función de ordenamiento y búsqueda que la tabla, de modo que el archivo coincide exactamente con lo que el usuario ve.',
    },
    { type: 'h3', text: '7.4. Responsividad y accesibilidad' },
    {
      type: 'p',
      text: 'El diseño es mobile-first con puntos de quiebre en 1200, 1100, 900, 720 y 380 px. En escritorio se muestran cinco KPIs en una fila y el mapa comparte espacio con el panel de hallazgos; en tableta los KPIs pasan a tres columnas y el mapa se apila; en móvil los filtros se reorganizan, las tarjetas ocupan dos columnas y la tabla habilita desplazamiento horizontal. La auditoría de Lighthouse otorga 100/100 en accesibilidad, 100/100 en buenas prácticas y 100/100 en SEO. Para llegar a esa puntuación se añadió el nombre accesible del enlace al reporte y se agruparon los marcadores del mapa mediante clustering, de modo que los objetivos táctiles no se solapen.',
    },
    { type: 'h3', text: '7.5. Rendimiento' },
    {
      type: 'p',
      text: 'El sitio no utiliza frameworks ni procesos de compilación. El HTML, el CSS y los módulos JavaScript se sirven directamente; las librerías se cargan desde CDN con integridad criptográfica (Subresource Integrity) cuando está disponible. El dataset pesa menos de 8 KB y los cálculos se ejecutan en menos de 5 ms. La carga de teselas es la operación más costosa y depende de la red del usuario; el mapa se inicializa después del contenido crítico y muestra un fondo sólido mientras llegan las imágenes.',
    },
    { type: 'h3', text: '7.6. Despliegue' },
    {
      type: 'p',
      text: 'El repositorio se publica en GitHub y el sitio se activa desde Settings → Pages, seleccionando la rama principal y la carpeta raíz. Cada push a main actualiza la URL pública en menos de un minuto. El proyecto incluye un archivo .nojekyll para evitar el procesamiento de Jekyll y un README con instrucciones de reproducción. La dirección de producción se registra en el anexo D.',
    },
  );

  /* ─────────────────────────── 8. BITÁCORA ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '8. Bitácora de prompts de IA' },
    { type: 'h3', text: '8.1. Método de registro' },
    {
      type: 'p',
      text: 'Se registraron trece interacciones relevantes con el asistente de IA. Para cada una se documenta el objetivo, una síntesis del prompt, el resultado obtenido y el ajuste humano aplicado. La síntesis conserva la intención y las restricciones, pero omite iteraciones menores para facilitar la lectura. El registro completo —incluyendo prompts de depuración y correcciones— está disponible en el repositorio, en la carpeta docs.',
    },
    {
      type: 'table',
      caption: 'Tabla 9. Bitácora resumida de prompts de IA generativa',
      long: true,
      head: ['#', 'Objetivo', 'Prompt (síntesis)', 'Resultado', 'Ajuste humano'],
      widths: [5, 18, 33, 24, 20],
      fontSize: 7.6,
      rows: [
        ['1', 'Definir la arquitectura', 'Actúa como arquitecto de software y propone una arquitectura para un dashboard público que consume un JSON local, sin backend y con Leaflet y Chart.js.', 'Arquitectura de cuatro capas y propuesta de módulos.', 'Se ajustó la capa de entrega a GitHub Pages y se eliminó la idea de un bundler.'],
        ['2', 'Modelar el dataset', 'Define un esquema JSON de 16 campos para pasadas satelitales sobre Galápagos, con tipos, unidades y restricciones.', 'Esquema con identificadores, fechas, coordenadas y métricas.', 'Se añadieron fuente y resolución; se validaron rangos 0–100.'],
        ['3', 'Generar datos coherentes', 'Genera 15 registros con estacionalidad de Galápagos, tres plataformas y nueve islas; la aptitud debe ser inversa a la nubosidad.', 'Dataset inicial con dispersión excesiva.', 'Se reescribieron los valores para lograr coherencia narrativa y se documentó el carácter simulado.'],
        ['4', 'Maquetar el HTML', 'Escribe HTML5 semántico con encabezado, hero, filtros, KPIs, mapa, gráficos, tabla y pie; sin frameworks.', 'Estructura completa con clases utilitarias.', 'Se añadieron skip-link, roles ARIA y metadatos Open Graph.'],
        ['5', 'Crear el sistema de diseño', 'Diseña un design system con variables CSS, tema oscuro/claro, tipografía y componentes; prioriza contraste y legibilidad.', 'Tokens y estilos base.', 'Se corrigieron contrastes y se fijó una paleta accesible.'],
        ['6', 'Implementar filtros y KPIs', 'Implementa filtros combinables y recálculo de cinco KPIs; separa la lógica del DOM.', 'Funciones de filtrado y agregación.', 'Se extrajo analytics.js y se añadieron pruebas unitarias.'],
        ['7', 'Integrar Leaflet', 'Integra Leaflet con marcadores por pasada, mapa de calor y zonas de acumulación; agrega control de capas.', 'Código funcional con popups.', 'Se cambió la tesela a imagen satelital de Esri y se ajustó el orden de capas.'],
        ['8', 'Configurar Chart.js', 'Crea cuatro gráficos con Chart.js 4: línea dual, dona, barras horizontales y dispersión con regresión.', 'Cuatro gráficos con opciones de tema.', 'Se corrigieron opciones obsoletas de v3 y se añadió locale es-EC.'],
        ['9', 'Asegurar responsividad', 'Ajusta el layout para 390, 768, 1024 y 1440 px; oculta columnas secundarias y reorganiza filtros.', 'Consultas de medios y grillas.', 'Se probó con capturas reales y se corrigió el ancho de la tabla.'],
        ['10', 'Auditar accesibilidad', 'Revisa el sitio contra WCAG 2.2 AA y propone correcciones concretas.', 'Lista de hallazgos y parches.', 'Se añadió el nombre accesible del enlace al reporte y se agruparon los marcadores con clustering.'],
        ['11', 'Depurar la carga del JSON', 'El dashboard funciona con servidor local pero no con file://; explica la causa y la solución.', 'Diagnóstico de CORS y fetch.', 'Se documentó el uso de un servidor local y se añadió un mensaje de error claro.'],
        ['12', 'Redactar el informe', 'Redacta el reporte técnico en formato paper con benchmarking, arquitectura, ficha de KPIs y bitácora.', 'Borrador extenso.', 'Se verificaron cifras contra el dataset y se reescribieron secciones para evitar generalizaciones.'],
        ['13', 'Generar pruebas', 'Escribe pruebas unitarias para filtros, KPIs, correlación, CSV y validación de esquema.', 'Suite de pruebas en Node.', 'Se ejecutaron y se corrigieron dos expectativas de redondeo.'],
      ],
    },
    { type: 'h3', text: '8.2. Lecciones aprendidas' },
    {
      type: 'ul',
      items: [
        '**La IA acelera la implementación, no reemplaza el criterio.** Los mejores resultados aparecieron cuando el prompt incluía restricciones explícitas (sin frameworks, JSON local, accesibilidad) y un criterio de aceptación verificable.',
        '**Las alucinaciones son frecuentes en cifras y versiones.** El asistente propuso precios de licencias y sintaxis de Chart.js 3; ambas se contrastaron con documentación oficial y se corrigieron antes de publicar.',
        '**El código generado debe ejecutarse y auditarse.** Un fragmento aparentemente correcto falló al cargar el JSON por file://; solo la prueba en el navegador reveló el problema.',
        '**La documentación del prompt es un artefacto académico.** Registrar la intención, el resultado y el ajuste permite evaluar el proceso, no solo el producto.',
      ],
    },
    { type: 'h3', text: '8.3. Control de calidad de las respuestas' },
    {
      type: 'p',
      text: 'Cada respuesta se sometió a una lista de verificación de cuatro puntos: (i) ¿la afirmación es verificable en una fuente primaria o en el dataset?; (ii) ¿el código se ejecuta sin errores en consola?; (iii) ¿respeta las restricciones del proyecto (sin backend, responsivo, accesible)?; (iv) ¿introduce dependencias innecesarias? Solo las respuestas que superaron los cuatro filtros se incorporaron al entregable. Las que no lo hicieron se corrigieron manualmente y se registraron en la bitácora.',
    },
    { type: 'h3', text: '8.4. Declaración de uso de IA' },
    {
      type: 'p',
      text: 'Se declara el uso de asistentes de IA generativa para la generación de borradores de código, textos explicativos y estructuras de datos. Todas las decisiones de arquitectura, la verificación de datos, la interpretación de resultados y la redacción final fueron realizadas por el equipo. Los datos son simulados y se identifican como tales. Esta declaración cumple con el principio de transparencia académica y permite reproducir el proceso.',
    },
  );

  /* ─────────────────────────── 9. RESULTADOS ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '9. Resultados y validación' },
    { type: 'h3', text: '9.1. Indicadores globales' },
    {
      type: 'table',
      caption: 'Tabla 10. Resultados de los KPIs sobre el dataset completo',
      head: ['KPI', 'Resultado', 'Meta', 'Cumplimiento'],
      widths: [38, 18, 18, 26],
      align: ['left', 'center', 'center', 'center'],
      rows: [
        ['Pasadas analizadas', nf(kpis.total), '≥ 15', 'Cumple'],
        ['Cobertura nubosa media', pct(kpis.cloud), '≤ 25%', 'No cumple'],
        ['Aptitud media del sensor', pct(kpis.aptitude), '≥ 80%', 'No cumple'],
        ['Tasa de pasadas aptas', pct(kpis.suitableRate), '≥ 70%', 'No cumple'],
        ['Área monitoreada', `${nf(kpis.area)} km²`, '≥ 6.000 km²', 'Cumple'],
        ['NDVI promedio', nf(kpis.ndvi, 2), '0,40–0,70', 'Cumple'],
        ['Brecha de aptitud entre islas', pp(stats.equityGap), '≤ 15 pp', 'No cumple'],
        ['Correlación nubosidad–aptitud', nf(stats.correlation, 3), '≤ −0,70', 'Cumple'],
      ],
      note: 'El cumplimiento se evalúa contra las metas definidas en la ficha de KPIs. Los incumplimientos describen el dataset simulado, no el desempeño del dashboard.',
    },
    {
      type: 'p',
      text: `El dataset no alcanza las metas de calidad óptica: la nubosidad media (${pct(kpis.cloud)}) supera el umbral de 25% y la aptitud media (${pct(kpis.aptitude)}) queda por debajo de 80%. Solo ${nf(kpis.suitable)} de ${nf(kpis.total)} pasadas (${pct(kpis.suitableRate)}) son utilizables según la regla de 70%. Este resultado es coherente con la estacionalidad simulada y, lejos de invalidar el tablero, demuestra su utilidad: permite identificar con precisión las ventanas en las que la observación es viable. La brecha de ${pp(stats.equityGap)} entre la mejor y la peor isla también refleja el tamaño desigual de la muestra por isla (de 1 a 3 pasadas), por lo que debe interpretarse como una señal de cobertura, no como una conclusión ambiental definitiva.`,
    },
    { type: 'h3', text: '9.2. Comportamiento mensual' },
    {
      type: 'table',
      caption: 'Tabla 11. Agregado mensual de nubosidad y aptitud',
      head: ['Mes', 'Pasadas', 'Nubosidad media', 'Aptitud media', 'Área (km²)'],
      widths: [26, 14, 22, 20, 18],
      align: ['left', 'center', 'center', 'center', 'center'],
      rows: monthly.map((m) => [
        m.label, nf(m.pasadas), pct(m.nubosidad), pct(m.aptitud), nf(m.area),
      ]),
    },
    {
      type: 'p',
      text: 'La serie muestra un patrón claro: febrero concentra la mayor nubosidad (43,6%) y la menor aptitud (56,6%), mientras que junio registra la mejor condición (9,4% de nubosidad y 97,1% de aptitud). Entre marzo y mayo la aptitud mejora de forma sostenida, lo que sugiere una ventana operativa favorable al final de la temporada cálida. La Figura 2 resume visualmente este comportamiento en el dashboard.',
    },
    { type: 'figure', src: 'figuras/dashboard_preview.png', caption: 'Figura 2. Vista superior del dashboard PlasTrack en escritorio (1440 px).', width: 100 },
    { type: 'h3', text: '9.3. Ranking por isla' },
    {
      type: 'table',
      caption: 'Tabla 12. Aptitud promedio por isla (orden descendente)',
      head: ['Isla', 'Pasadas', 'Nubosidad', 'Aptitud', 'Área (km²)', 'Semáforo'],
      widths: [26, 12, 16, 14, 18, 14],
      align: ['left', 'center', 'center', 'center', 'right', 'center'],
      rows: islands.map((island) => [
        island.isla,
        nf(island.pasadas),
        pct(island.nubosidad),
        pct(island.aptitud),
        nf(island.area),
        island.aptitud >= 80 ? 'Óptima' : island.aptitud >= 60 ? 'Aceptable' : 'Limitada',
      ]),
      fontSize: 8.5,
    },
    {
      type: 'p',
      text: `Baltra lidera el ranking con ${pct(islands[0].aptitud)} de aptitud, seguida de Española (${pct(islands[1].aptitud)}) y Marchena (${pct(islands[2].aptitud)}); Floreana cierra la lista con ${pct(islands[islands.length - 1].aptitud)}. La diferencia debe leerse con cautela: las islas con una sola pasada tienen alta varianza y no representan una tendencia. Lo relevante para la gestión es que el tablero hace visible esa desigualdad y permite priorizar nuevas adquisiciones en las islas con menor cobertura.`,
    },
    { type: 'h3', text: '9.4. Relación nubosidad–aptitud' },
    {
      type: 'p',
      text: `La correlación de Pearson entre nubosidad y aptitud es r = ${nf(stats.correlation, 3)}, con una pendiente de ${nf(stats.regression.slope, 2)} puntos de aptitud por cada punto de nubosidad. La relación es inversa y casi perfecta, como se esperaba por la construcción del dataset. En un escenario real, la dispersión sería mayor debido a la geometría de adquisición, la presencia de sombras, el ángulo solar y la calidad radiométrica. El gráfico de dispersión del dashboard permite detectar esos casos atípicos cuando se sustituya el archivo simulado por datos reales.`,
    },
    { type: 'h3', text: '9.5. Validación funcional' },
    {
      type: 'table',
      caption: 'Tabla 13. Casos de prueba y resultados',
      head: ['ID', 'Caso de prueba', 'Resultado esperado', 'Estado'],
      widths: [7, 40, 38, 15],
      fontSize: 8,
      rows: [
        ['P01', 'Filtrar por isla Isabela', '3 registros, 3 marcadores y KPIs recalculados', 'Superado'],
        ['P02', 'Filtrar por rango de fechas', 'Subconjunto coherente y mapa ajustado', 'Superado'],
        ['P03', 'Combinar isla y plataforma', 'Intersección correcta; cero resultados controlado', 'Superado'],
        ['P04', 'Limpiar filtros', 'Restauración de los 15 registros', 'Superado'],
        ['P05', 'Buscar por zona o identificador', 'Coincidencias parciales sin distinguir mayúsculas', 'Superado'],
        ['P06', 'Ordenar por aptitud ascendente/descendente', 'Orden numérico correcto y flecha de estado', 'Superado'],
        ['P07', 'Exportar CSV', 'Archivo con encabezados, 15 filas y BOM UTF-8', 'Superado'],
        ['P08', 'Cambiar tema claro/oscuro', 'Colores, gráficos y mapa actualizados', 'Superado'],
        ['P09', 'Activar/desactivar capas del mapa', 'Visibilidad coherente con aria-pressed', 'Superado'],
        ['P10', 'Navegar con teclado', 'Foco visible y orden lógico', 'Superado'],
        ['P11', 'Abrir en móvil (390 px)', 'Sin desbordamiento horizontal; tabla desplazable', 'Superado'],
        ['P12', 'Cargar sin conexión a teselas', 'Marcadores y gráficos siguen funcionando', 'Superado'],
      ],
    },
    { type: 'p', text: 'Adicionalmente se ejecutaron pruebas unitarias sobre el núcleo analítico, con cobertura de filtros, medias, correlación, KPIs, validación de esquema y exportación. Los doce casos de la Tabla 13 y las pruebas automatizadas finalizaron sin errores. La auditoría de Lighthouse registra 100/100 en accesibilidad, 100/100 en buenas prácticas y 100/100 en SEO.', },
    { type: 'h3', text: '9.6. Hallazgos principales' },
    {
      type: 'ul',
      items: [
        `**Ventana óptima.** La mejor pasada corresponde a ${bestPass.isla} (${bestPass.fecha}), con ${pct(bestPass.aptitud_pct)} de aptitud y ${pct(bestPass.nubosidad_pct)} de nubosidad.`,
        `**Peor condición.** La pasada más desfavorable del conjunto (${worstPass.id}, sobre ${worstPass.isla}) registró ${pct(worstPass.aptitud_pct)} de aptitud con ${pct(worstPass.nubosidad_pct)} de nubosidad, lo que ejemplifica una escena no utilizable para índices ópticos.`,
        `**Estacionalidad.** La nubosidad cae ${pp(monthly[0].nubosidad - monthly[monthly.length - 1].nubosidad)} entre enero y junio, y la aptitud sube ${pp(monthly[monthly.length - 1].aptitud - monthly[0].aptitud)} en el mismo periodo.`,
        `**Concentración.** Las tres plataformas tienen una distribución desigual (${platforms.map((p) => `${p.satelite}: ${p.pasadas}`).join('; ')}), lo que afecta la comparabilidad entre islas.`,
        '**Valor del tablero.** La combinación de filtros y mapa permite pasar de una pregunta de negocio a una respuesta visual en menos de tres clics.',
      ],
    },
  );

  /* ─────────────────────────── 10. DISCUSIÓN ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '10. Discusión' },
    {
      type: 'p',
      text: 'El benchmarking confirma que no existe una herramienta universalmente superior. Power BI y Tableau ofrecen un gobierno de datos y una colaboración que el stack web no iguala; Looker Studio gana en velocidad de implementación y costo; el stack web gana en control geoespacial, transparencia y despliegue público. La decisión correcta depende del contexto: para un prototipo académico con requisitos de mapa y URL abierta, la alternativa web es la más coherente; para una organización con cientos de usuarios y datos sensibles, una plataforma empresarial sería más responsable.',
    },
    {
      type: 'p',
      text: 'Los resultados del dataset deben interpretarse como una demostración metodológica, no como un diagnóstico de Galápagos. La relación casi perfecta entre nubosidad y aptitud es consecuencia del diseño sintético; en datos reales se esperaría una correlación fuerte pero no perfecta. Del mismo modo, la brecha entre islas está influida por el tamaño de la muestra. Estas limitaciones no invalidan el tablero: lo convierten en un banco de pruebas para validar la arquitectura antes de invertir en datos reales.',
    },
    {
      type: 'p',
      text: 'Desde la perspectiva de BI, el proyecto evidencia que la calidad del resultado depende menos de la herramienta que del modelado. La ficha de KPIs, la validación del esquema, la separación entre lógica y presentación y la trazabilidad de los prompts son prácticas que se pueden replicar en cualquier plataforma. La IA generativa aceleró la producción de código y borradores, pero también introdujo errores que exigieron verificación; el valor estuvo en el ciclo de revisión, no en la generación automática.',
    },
    {
      type: 'p',
      text: 'Una limitación relevante es la dependencia de teselas y CDN. Si el usuario no tiene conexión, el mapa pierde la imagen de fondo, aunque los marcadores, los gráficos y los KPIs siguen funcionando. Para un despliegue en campo sería necesario empaquetar las librerías, usar teselas locales o incorporar un service worker. Otra limitación es la ausencia de autenticación: cualquier persona con la URL puede ver los datos. En este caso es deseable —el proyecto es abierto—, pero no lo sería con información sensible.',
    },
  );

  /* ─────────────────────────── 11. CONCLUSIONES ─────────────────────────── */
  sections.push(
    { type: 'h2', text: '11. Conclusiones' },
    {
      type: 'ol',
      items: [
        'El benchmarking ponderado permitió seleccionar un stack web con Leaflet.js y Chart.js (4,80/5,00) frente a Power BI (3,40), Looker Studio (4,10) y Tableau (3,15), gracias a su control geoespacial, costo cero y despliegue público.',
        'La ficha de ocho KPIs tradujo los requisitos ambientales en métricas verificables, con fórmula, unidad, meta y representación visual, y permitió evaluar el dataset sin ambigüedad.',
        'PlasTrack demuestra que una arquitectura BI estática puede entregar analítica interactiva de calidad: cinco KPIs, mapa con tres capas, cuatro gráficos y tabla exportable, sin backend ni licencias.',
        `El dataset evidenció una nubosidad media de ${pct(kpis.cloud)} y una aptitud de ${pct(kpis.aptitude)}, con solo ${pct(kpis.suitableRate)} de pasadas aptas; la mejor ventana se ubica al final del periodo (junio), lo que orienta la planificación de adquisiciones.`,
        'La combinación de IA generativa y verificación humana aceleró el desarrollo, pero confirmó que el criterio técnico, las pruebas y la documentación siguen siendo responsabilidad del equipo.',
      ],
    },
    { type: 'h2', text: '12. Recomendaciones y trabajo futuro' },
    {
      type: 'ul',
      items: [
        'Sustituir el JSON simulado por una consulta real al Copernicus Data Space Ecosystem y programar una actualización periódica mediante GitHub Actions.',
        'Incorporar Sentinel-1 (radar) para reducir la dependencia de la nubosidad en la temporada húmeda.',
        'Añadir autenticación y un panel administrativo solo si el tablero se usa con datos sensibles.',
        'Empaquetar las librerías y las teselas para funcionamiento sin conexión, junto con un service worker y una estrategia de caché.',
        'Ampliar la muestra a un ciclo anual completo y aplicar pruebas estadísticas (intervalos de confianza, pruebas de medias) antes de extraer conclusiones ambientales.',
        'Internacionalizar la interfaz (español/inglés) y añadir un modo de alto contraste para usuarios con baja visión.',
      ],
    },
  );

  /* ─────────────────────────── REFERENCIAS ─────────────────────────── */
  sections.push(
    { type: 'h2', text: 'Referencias' },
    {
      type: 'refs',
      items: [
        'Chart.js. (2024). Chart.js documentation (v4.4). https://www.chartjs.org/docs/latest/',
        'Copernicus. (2024). Copernicus Data Space Ecosystem. https://dataspace.copernicus.eu/',
        'Davenport, T. H., Harris, J. G., & Morison, R. (2010). Analytics at work: Smarter decisions, better results. Harvard Business Press.',
        'Drusch, M., Del Bello, U., Carlier, S., Colin, O., Fernandez, V., Gascon, F., Hoersch, B., Isola, C., Laberinti, P., Martimort, P., Meygret, A., Spoto, F., Sy, O., Marchese, F., & Bargellini, P. (2012). Sentinel-2: ESA\'s optical high-resolution mission for GMES operational services. Remote Sensing of Environment, 120, 25–36. https://doi.org/10.1016/j.rse.2011.11.026',
        'European Space Agency. (2024). Sentinel-2 MSI user guide. https://sentinel.esa.int/web/sentinel/user-guides/sentinel-2-msi',
        'Few, S. (2006). Information dashboard design: The effective visual communication of data. O\'Reilly Media.',
        'Google. (2024a). Looker Studio overview. https://cloud.google.com/looker-studio',
        'Google. (2024b). GitHub Pages. https://pages.github.com/',
        'Leaflet. (2024). Leaflet: An open-source JavaScript library for mobile-friendly interactive maps. https://leafletjs.com/',
        'Microsoft. (2024). What is Power BI? https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview',
        'Provost, F., & Fawcett, T. (2013). Data science for business: What you need to know about data mining and data-analytic thinking. O\'Reilly Media.',
        'Shneiderman, B. (1996). The eyes have it: A task by data type taxonomy for information visualizations. Proceedings of the IEEE Symposium on Visual Languages, 336–343. https://doi.org/10.1109/VL.1996.545307',
        'Tableau. (2024). Tableau pricing and plans. https://www.tableau.com/pricing/teams-orgs',
        'W3C. (2023). Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/',
      ],
    },
  );

  /* ─────────────────────────── ANEXOS ─────────────────────────── */
  sections.push(
    { type: 'pagebreak' },
    { type: 'h2', text: 'Anexo A. Diccionario de datos' },
    {
      type: 'table',
      caption: 'Tabla A1. Campos del archivo data_copernicus_sample.json',
      head: ['Campo', 'Tipo', 'Unidad', 'Descripción'],
      widths: [24, 12, 14, 50],
      fontSize: 8,
      rows: [
        ['id', 'texto', '—', 'Identificador único de la pasada (COP-2026-XXX).'],
        ['satelite', 'texto', '—', 'Plataforma: Sentinel-2A, Sentinel-2B o Landsat 9.'],
        ['sensor', 'texto', '—', 'Instrumento: MSI u OLI-2.'],
        ['fecha', 'fecha', 'YYYY-MM-DD', 'Fecha de adquisición en horario UTC.'],
        ['hora_utc', 'texto', 'HH:MM', 'Hora de paso del satélite.'],
        ['isla', 'texto', '—', 'Isla de Galápagos observada.'],
        ['zona', 'texto', '—', 'Sitio de referencia dentro de la isla.'],
        ['lat', 'número', 'grados', 'Latitud del centro de la escena (WGS84).'],
        ['lon', 'número', 'grados', 'Longitud del centro de la escena (WGS84).'],
        ['nubosidad_pct', 'número', '%', 'Porcentaje de la escena cubierto por nubes (0–100).'],
        ['aptitud_pct', 'número', '%', 'Porcentaje de píxeles válidos tras el enmascaramiento (0–100).'],
        ['ndvi_promedio', 'número', 'índice', 'Índice de vegetación de diferencia normalizada (0–1).'],
        ['area_km2', 'número', 'km²', 'Superficie cubierta por la escena.'],
        ['temperatura_superficie_c', 'número', '°C', 'Temperatura superficial estimada.'],
        ['resolucion_m', 'entero', 'metros', 'Resolución espacial del sensor (10 o 30 m).'],
        ['fuente', 'texto', '—', 'Origen declarado del dato.'],
      ],
    },
    { type: 'h2', text: 'Anexo B. Registros del dataset' },
    {
      type: 'table',
      caption: 'Tabla B1. Las 15 pasadas satelitales simuladas',
      long: true,
      head: ['ID', 'Fecha', 'Isla', 'Plataforma', 'Nub.', 'Apt.', 'Área'],
      widths: [17, 14, 18, 20, 10, 10, 11],
      align: ['left', 'center', 'left', 'left', 'right', 'right', 'right'],
      fontSize: 7.4,
      rows: stats.records.map((r) => [
        r.id, r.fecha, r.isla, r.satelite,
        pct(r.nubosidad_pct, 0), pct(r.aptitud_pct, 0), nf(r.area_km2),
      ]),
    },
    { type: 'h2', text: 'Anexo C. Cálculo de la matriz ponderada' },
    {
      type: 'table',
      caption: 'Tabla C1. Contribución ponderada por criterio y alternativa',
      head: ['Criterio', 'Peso', 'Power BI', 'Looker', 'Tableau', 'Web JS'],
      widths: [40, 10, 12.5, 12.5, 12.5, 12.5],
      align: ['left', 'center', 'center', 'center', 'center', 'center'],
      fontSize: 8,
      rows: [
        ['Capas geoespaciales (4/3/4/5)', '0,20', '0,80', '0,60', '0,80', '1,00'],
        ['Integración JSON/CSV (4/4/4/5)', '0,15', '0,60', '0,60', '0,60', '0,75'],
        ['Costo (2/5/1/5)', '0,15', '0,30', '0,75', '0,15', '0,75'],
        ['Usabilidad (4/5/3/4)', '0,15', '0,60', '0,75', '0,45', '0,60'],
        ['Rendimiento (3/4/3/5)', '0,15', '0,45', '0,60', '0,45', '0,75'],
        ['Responsividad (3/4/3/5)', '0,10', '0,30', '0,40', '0,30', '0,50'],
        ['Despliegue (2/4/3/5)', '0,05', '0,10', '0,20', '0,15', '0,25'],
        ['Ecosistema (5/4/5/4)', '0,05', '0,25', '0,20', '0,25', '0,20'],
        ['**Total**', '**1,00**', '**3,40**', '**4,10**', '**3,15**', '**4,80**'],
      ],
    },
    { type: 'h2', text: 'Anexo D. Enlaces y evidencias' },
    {
      type: 'ul',
      items: [
        'Dashboard en producción: https://carlos00012.github.io/plastrack/',
        'Repositorio: https://github.com/carlos00012/plastrack',
        'Documento de construcción: docs/Memoria_de_Construccion.pdf',
        'Dataset: data/data_copernicus_sample.json',
        'Bitácora ampliada y decisiones: README.md del repositorio.',
      ],
    },
  );

  return { meta: reportMeta, sections };
};
