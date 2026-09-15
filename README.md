# JARVIS

JARVIS es un asistente personal escrito en **JavaScript vanilla** con un cerebro local que funciona desde el primer arranque. No utiliza APIs de inteligencia artificial ni Python/PyTorch para operar.

## Cerebro local

El cerebro está en `brain/weights.json` y `brain/knowledge.json`. `weights.json` contiene pesos numéricos versionados, vocabulario, sesgos y matrices de clasificación. `src/neural-engine.js` transforma el lenguaje en vectores, calcula similitud, aplica softmax y clasifica dominio e intención. `src/embedded-brain.js` convierte esas señales en respuestas naturales usando el conocimiento, el contexto, la memoria y las fuentes web disponibles.

Esta es una IA local híbrida: tiene un componente neuronal con pesos y un componente simbólico de conocimiento y generación. No es un modelo lingüístico gigante tipo ChatGPT; para eso se necesitarían miles de millones de parámetros y un corpus enorme. Pero es un cerebro funcional, auditable, ampliable y ejecutable en Node.js sin servicios externos.

## Capacidades actuales

JARVIS entiende contexto de conversación, recupera mensajes relevantes por similitud vectorial, identifica programación, física, física cuántica y temas generales, detecta intenciones de saludo, generación de código, profundización y comparación, y crea respuestas en lenguaje natural. El conocimiento incluye JavaScript, Node.js, Python, HTML, CSS, APIs, validación, módulos, Git, Newton, energía, relatividad, qubits, superposición, entrelazamiento e incertidumbre.

## Archivos principales

| Archivo | Propósito |
|---|---|
| `brain/weights.json` | Pesos neuronales locales versionados |
| `brain/knowledge.json` | Conocimientos, hechos y ejemplos de código |
| `src/neural-engine.js` | Tokenización, vectores, softmax, similitud y clasificación |
| `src/embedded-brain.js` | Generación de respuesta y composición contextual |
| `src/local-brain.js` | Fachada usada por el backend |
| `scripts/inspect-brain.js` | Inspección de pesos y vocabulario |
| `scripts/test-brain.js` | Prueba directa del cerebro |

## Ejecutar

```bash
npm install
npm run check
npm run brain:inspect
npm run brain:test
npm test
npm start
```

Abre `http://localhost:3000`. No hay que descargar un modelo, entrenar un checkpoint ni configurar una API de IA.

## Contexto y memoria

El frontend conserva los últimos mensajes de la sesión y los envía en cada consulta. El motor vectoriza el mensaje actual y ordena el historial y las memorias por similitud. Firebase almacena memorias cifradas y comprimidas si está disponible; de lo contrario, el navegador utiliza `sessionStorage`. La búsqueda web solamente aporta fuentes y no reemplaza al cerebro local.

## Ampliar el cerebro

Para incorporar más conocimientos, agrega dominios, conceptos, hechos, ejemplos y palabras al archivo `brain/knowledge.json`. Para modificar el comportamiento neuronal, ajusta los vocabularios y matrices de `brain/weights.json`. Después ejecuta:

```bash
npm run brain:inspect
npm run brain:test
npm test
```

Los pesos incluidos son pesos iniciales diseñados y versionados para las capacidades actuales; no son un archivo ficticio ni una conexión a otro modelo. Si en el futuro se necesita un modelo neuronal generativo de gran escala, habrá que implementar un entrenamiento real con un corpus legal y grande, pero eso sería una ampliación distinta del cerebro actual.

## API

`POST /api/chat` recibe `message`, `user_id` e `history`, y devuelve `response`, `used_tools`, `storage` y el identificador de conversación. `GET /health` indica que el cerebro neuronal JavaScript está activo y muestra la ruta lógica de sus pesos. `GET /api/status` expone únicamente estado no sensible.

## Seguridad

El cerebro no ejecuta comandos arbitrarios generados por texto. Las herramientas tienen validaciones y el sandbox de archivos limita sus rutas. No guardes claves, datos privados, corpus sensibles ni secretos dentro de `brain/`.

## Render

Render puede servir la aplicación porque el runtime de producción es únicamente Node.js. La búsqueda web y Firebase son integraciones opcionales; el cerebro responde sin ellas.
