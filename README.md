# Software de Cálculo y Dimensionamiento de Anclajes de Trepantes

Aplicación web de ingeniería estructural desarrollada para el dimensionamiento, cálculo y verificación de anclajes de trepantes embebidos en hormigón (sistemas **M24 / DW15** y **M36 / DW26,5**), conforme a normativa **ACI 318** y **Eurocódigo 2 (EN 1992-4)**.

Permite sustituir íntegramente la herramienta anterior basada en Excel con Macros (`Software Anclajes v.1.0.xlsm`) por una interfaz moderna, interactiva y de alta precisión con generación automática de informes técnicos oficiales en formato Word (`.docx`).

---

## Características Principales

1. **Diagrama 3D Interactivo de Hormigón**:
   - Visualización del bloque de hormigón en 3D con cotas perimetrales ($c_{a,l}, c_{a,r}, c_{a,u}, c_{a,d}, h_a$) y flechas de carga ($N_{sk}$ axil de tracción, $V_{sk}$ cortante).
   - Edición bidireccional en tiempo real directamente sobre el diagrama o en el panel de entrada.
2. **Sistemas de Anclaje Homologados**:
   - **M36 / DW26,5 (Sistema T1C)**: Longitudes $L \in [240, 300, 350, 400, 450, 500]\text{ mm}$.
   - **M24 / DW15 (Sistema 240)**: Longitudes $L \in [113, 213]\text{ mm}$.
   - Validación automática de espesor de muro ($L \le h_a$).
   - Opción "Afectado por hueco inferior" con modal de ayuda gráfica explicativa.
   - Ajuste de resistencia del hormigón $f'_c \in [8, 30]\text{ MPa}$ con selector y deslizador.
3. **Diagrama de Interacción Dinámico Axil - Cortante**:
   - Gráfico interactivo en Canvas de alta resolución (DPI escalado).
   - Dibuja la curva teórica elíptica de capacidad:
     $$\left(\frac{N_{sd}}{N_{Rd}}\right)^{5/3} + \left(\frac{V_{sd}}{V_{Rd}}\right)^{5/3} \le 1.0$$
   - Posiciona el punto de trabajo del anclaje $(V_{sd}, N_{sd})$ con código de colores verde/rojo.
4. **Verificación de 6 Modos de Fallo con Ilustraciones Oficiales**:
   - Tornillo axial
   - Barra DW axial
   - Cono hormigón axial
   - Cono hormigón cortante (según presencia de hueco)
   - Cabeceo cortante (pryout)
   - Cono metálico cortante
5. **Memoria de Cálculo Técnica Completa**:
   - Acordeón desplegable con los parámetros de cálculo detallados ($h'_{ef}, A_{NC}, A_{NC0}, \Psi_{ed,N}, N_b, N_{cb}, c'_{a2,\inf}, A_{VC}, V_b, V_{cb}, V_{cp}$, etc.).
6. **Generador de Informes Oficiales en Word (.docx)**:
   - Selección automática entre las 4 plantillas oficiales según el sistema y hueco (`Informe 240 con hueco.docx`, `Informe 240 sin hueco.docx`, `Informe T1C con hueco.docx`, `Informe T1C sin hueco.docx`).
   - Relleno de las 70 variables y marcadores respetando el formato corporativo exacto.
   - Descarga instantánea con metadatos del proyecto (Obra, Cliente, Referencia, Autor, Fecha).
7. **Exportación a PDF / Impresión**:
   - Estilos CSS optimizados para impresión técnica limpia y directa desde el navegador.

---

## Estructura del Proyecto

```
calculo-de-anclajes/
├── index.html                   # Página principal de la aplicación
├── server.js                    # Servidor local ultra-ligero en Node.js
├── package.json                 # Configuración del paquete y dependencias
├── css/
│   ├── main.css                 # Estilos principales, layout, diseño y animaciones
│   └── diagram.css              # Estilos del bloque 3D interactivo e inputs
├── js/
│   ├── app.js                   # Controlador principal y gestión de eventos
│   ├── engine/
│   │   └── anchorEngine.js      # Motor matemático con 100% paridad con Excel
│   ├── ui/
│   │   ├── diagramView.js       # Componente del bloque 3D y anotaciones
│   │   └── interactionChart.js  # Renderizador del gráfico de interacción en Canvas
│   └── report/
│       ├── docxGenerator.js     # Generador de documentos Word (.docx)
│       └── embeddedTemplates.js # Plantillas Word integradas en base64 para uso offline
└── assets/
    ├── images/                  # Gráficos e ilustraciones oficiales de modos de fallo
    └── templates/               # Las 4 plantillas originales de Word (.docx)
```

---

## Cómo Ejecutar la Aplicación Localmente

### Opción 1: Con el servidor Node.js incluido (Recomendado)
```bash
node server.js
```
Abre tu navegador en: [http://localhost:3000/](http://localhost:3000/)

### Opción 2: Ejecutar los tests de paridad de cálculo
```bash
node test_engine.js
```
