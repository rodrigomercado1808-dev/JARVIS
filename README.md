# JARVIS

JARVIS es un asistente personal con un **cerebro embebido en el código fuente**, sin conexión a APIs externas de inteligencia artificial. El backend y el frontend están escritos en JavaScript vanilla. El sistema incluye conocimiento estructurado, detección de temas, memoria de sesión, recuperación de contexto y generadores seguros de respuestas de programación. El Transformer en Python/PyTorch queda como una vía opcional de investigación, no como requisito para iniciar JARVIS.

## Qué significa esta arquitectura

No se utiliza OpenAI, Groq, OpenRouter, Gemini, Claude ni otro proveedor remoto de IA. La aplicación puede consultar Internet para obtener fuentes, pero esa búsqueda no genera la respuesta: el modelo local recibe la pregunta, el contexto, la memoria y las fuentes disponibles.

El cerebro que viene en el repositorio funciona desde el primer arranque. `brain/knowledge.json` contiene conceptos de programación, física y física cuántica; `src/embedded-brain.js` interpreta contexto, detecta intención y compone respuestas. No muestra “modelo no entrenado”. Un Transformer neuronal amplio sigue requiriendo corpus y hardware, por eso se conserva como módulo opcional y no bloquea el funcionamiento.

## Archivos del cerebro

| Archivo | Propósito |
|---|---|
| `brain/tokenizer.py` | Tokenizador de caracteres propio |
| `brain/model.py` | Transformer causal con PyTorch |
| `brain/prepare.py` | Convierte un corpus a datos de entrenamiento |
| `brain/train.py` | Entrena el modelo y guarda sus pesos |
| `brain/infer.py` | Genera texto usando los pesos locales |
| `brain/knowledge.json` | Cerebro de conocimiento incluido en el repositorio |
| `src/embedded-brain.js` | Motor de contexto, temas, intenciones y respuestas |
| `src/local-brain.js` | Fachada del cerebro usada por Node.js |

## Preparar y entrenar

Requiere Python 3.11+, PyTorch y una máquina con suficiente RAM/CPU o GPU.

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r brain/requirements.txt
npm install
npm run brain:prepare
npm run brain:train -- --steps 5000
npm run brain:infer
```

Antes de entrenar seriamente, reemplaza `brain/corpus.txt` por un corpus amplio y propio. El corpus debe tener licencia compatible, eliminar información personal y separar correctamente documentos, conversaciones y ejemplos de código. Para un modelo útil conviene ampliar después el tokenizador a subpalabras y añadir evaluación, checkpoints, reanudación, validación y un conjunto de pruebas separado.

El servidor Node utiliza siempre el cerebro embebido. Si existe un Transformer entrenado, puede añadirse como experimento posterior, pero su ausencia no afecta al funcionamiento ni aparece como error.

## Contexto y memoria

El navegador mantiene los últimos 20 mensajes de la sesión y los envía al cerebro local. Las memorias de Firebase se cifran con AES-256-GCM y se comprimen antes de guardarse. Si Firebase no conecta, las respuestas de búsqueda se mantienen solo en `sessionStorage`. El modelo recibe historial, memorias relevantes y fuentes web como texto de contexto.

## API y ejecución

```bash
npm test
npm start
```

La interfaz se sirve en `http://localhost:3000`. `/health` informa que el cerebro embebido está activo. `POST /api/chat` recibe `message`, `user_id` e `history` y devuelve la respuesta, el dominio detectado y las herramientas utilizadas.

## Render

Render puede servir el backend, pero el plan gratuito no es adecuado para entrenar ni alojar un Transformer con pesos grandes. El despliegue debe utilizar una máquina con almacenamiento persistente, memoria suficiente y, para entrenamiento práctico, GPU. No se incluyen pesos ni secretos en GitHub.

## Seguridad

No existe ejecución arbitraria de comandos solicitados por el modelo. La inferencia local se invoca únicamente con rutas configuradas y argumentos controlados. Nunca subas `.env`, credenciales de Firebase, corpus privados ni checkpoints que contengan datos sensibles.
