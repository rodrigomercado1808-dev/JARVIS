# JARVIS

JARVIS es un asistente personal cuyo motor de lenguaje se entrena **desde cero**, sin conexión a APIs externas de inteligencia artificial. El backend y el frontend están escritos en JavaScript vanilla. El modelo propio se implementa en Python/PyTorch únicamente para preparación, entrenamiento e inferencia local.

## Qué significa esta arquitectura

No se utiliza OpenAI, Groq, OpenRouter, Gemini, Claude ni otro proveedor remoto de IA. La aplicación puede consultar Internet para obtener fuentes, pero esa búsqueda no genera la respuesta: el modelo local recibe la pregunta, el contexto, la memoria y las fuentes disponibles.

El modelo que viene en el repositorio es una arquitectura Transformer pequeña y no viene entrenado porque los pesos generados serían grandes y dependen del corpus del propietario. El archivo `brain/corpus.txt` es solo una muestra para comprobar el pipeline. Un modelo que responda de forma amplia sobre programación, física y física cuántica requiere un corpus grande, legal y curado, además de hardware de entrenamiento suficiente.

## Archivos del cerebro

| Archivo | Propósito |
|---|---|
| `brain/tokenizer.py` | Tokenizador de caracteres propio |
| `brain/model.py` | Transformer causal con PyTorch |
| `brain/prepare.py` | Convierte un corpus a datos de entrenamiento |
| `brain/train.py` | Entrena el modelo y guarda sus pesos |
| `brain/infer.py` | Genera texto usando los pesos locales |
| `src/local-brain.js` | Puente entre Node.js y la inferencia local |

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

Cuando exista `brain/checkpoints/jarvis.pt` y `brain/tokenizer.json`, el servidor Node lo detecta automáticamente y usa el modelo local para contestar. Si todavía no existe, usa la búsqueda web como fallback informativo y lo indica en `/health`; no se conecta a ninguna API de IA.

## Contexto y memoria

El navegador mantiene los últimos 20 mensajes de la sesión y los envía al cerebro local. Las memorias de Firebase se cifran con AES-256-GCM y se comprimen antes de guardarse. Si Firebase no conecta, las respuestas de búsqueda se mantienen solo en `sessionStorage`. El modelo recibe historial, memorias relevantes y fuentes web como texto de contexto.

## API y ejecución

```bash
npm test
npm start
```

La interfaz se sirve en `http://localhost:3000`. `/health` informa si el modelo local está entrenado. `POST /api/chat` recibe `message`, `user_id` e `history` y devuelve la respuesta y las herramientas utilizadas.

## Render

Render puede servir el backend, pero el plan gratuito no es adecuado para entrenar ni alojar un Transformer con pesos grandes. El despliegue debe utilizar una máquina con almacenamiento persistente, memoria suficiente y, para entrenamiento práctico, GPU. No se incluyen pesos ni secretos en GitHub.

## Seguridad

No existe ejecución arbitraria de comandos solicitados por el modelo. La inferencia local se invoca únicamente con rutas configuradas y argumentos controlados. Nunca subas `.env`, credenciales de Firebase, corpus privados ni checkpoints que contengan datos sensibles.
