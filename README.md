# JARVIS

JARVIS es un asistente personal modular desarrollado completamente con **JavaScript vanilla**, sin una IA generativa. El backend usa Node.js y Fastify; el frontend es HTML, CSS y JavaScript nativo servido por el mismo backend. No usa TypeScript, React ni Next.js.

## Características

Incluye una API REST, interfaz responsive con estética de centro de control, búsqueda web determinista, memoria con Firestore opcional, fallback de `sessionStorage` para la sesión del navegador, herramientas extensibles, validación con Zod, logging de Fastify, health checks, sandbox de archivos y endpoints preparados para voz, visión, tareas y autenticación futura.

## Inicio local

Requiere Node.js 20 o superior.

```bash
npm install
cp .env.example .env
npm test
npm start
```

Abre `http://localhost:3000`. Si Firebase no está configurado o no conecta, la aplicación arranca igualmente y la interfaz indica que usa `sessionStorage`.

## Configuración

`.env.example` es la plantilla segura. No contiene claves reales y está incluido para mostrar exactamente cómo crear `.env`. JARVIS no usa una API de IA: primero busca coincidencias en su memoria y, si no las encuentra, consulta DuckDuckGo HTML mediante `fetch`. Nunca subas `.env`.

Para Firestore configura `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`; la clave privada debe usar `\\n` escapados. Firebase es opcional: si no conecta, no se usa memoria temporal del servidor.

Los recuerdos se serializan, comprimen con gzip y cifran con AES-256-GCM antes de guardarse en Firestore. Firestore conserva solamente metadatos mínimos y el sobre cifrado; el contenido no queda legible directamente en la consola. `MEMORY_ENCRYPTION_KEY` es imprescindible en producción: si se pierde, los recuerdos no pueden descifrarse. La compresión reduce el tamaño, pero el cifrado por sí solo no hace los datos más livianos. Cuando Firebase no está disponible, el navegador guarda las respuestas de búsquedas en `sessionStorage` durante la sesión actual y las elimina al limpiar la sesión.

## API

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/health` | Estado, versión, Firebase, IA y uptime |
| GET | `/api/status` | Estado público de configuración |
| POST | `/api/chat` | Conversación con memoria de contexto |
| POST/GET/DELETE | `/api/memory` | Crear, buscar y eliminar recuerdos |
| GET | `/api/history` | Historial reciente |
| GET/POST | `/api/tasks` | Base para tareas |
| GET | `/api/tools` | Herramientas disponibles |
| POST | `/api/tools/:tool_name` | Ejecutar una herramienta permitida |
| POST | `/api/voice/transcribe` | Preparado; devuelve no disponible |
| POST | `/api/voice/speak` | Preparado; devuelve no disponible |
| POST | `/api/vision/analyze` | Preparado; devuelve no disponible |

## Arquitectura

`src/app.js` registra rutas y plugins. `src/memory.js` separa memoria de Firestore y el fallback de sesión. `src/firebase.js` inicializa Firestore solo si existen credenciales. `src/tools.js` registra skills seguras. `public/` contiene la aplicación web.

La calculadora usa una lista blanca estricta de caracteres. Las operaciones de archivos solo pueden actuar dentro de `storage/sandbox`; no existe un endpoint para ejecutar comandos arbitrarios del sistema. La búsqueda web guarda las fuentes en Firestore cifrado cuando está disponible, o en `sessionStorage` solamente durante la sesión actual cuando Firebase no conecta.

## Render

El archivo `render.yaml` define un Web Service Node con `npm install`, `npm start` y `/health` como health check. En el panel de Render agrega las variables secretas como Environment Variables. Render proporciona `PORT`; el servidor escucha en `0.0.0.0`.

## Android y futuro

La interfaz está preparada para WebView y botones táctiles, pero una página web no garantiza ejecución permanente en segundo plano. Para una aplicación Android persistente se necesitará un Foreground Service oficial, notificación persistente y permisos de micrófono/cámara/notificaciones según corresponda. El backend no intenta solicitar permisos ni evadir restricciones del sistema.

## Seguridad y próximos pasos

El modo actual `AUTH_MODE=development` usa el usuario por defecto para facilitar pruebas. Antes de exponerlo públicamente debe añadirse Firebase Auth o JWT y autorización por usuario a cada endpoint sensible. También deben conectarse proveedores reales de búsqueda web, voz y visión mediante adaptadores explícitos.

Licencia: MIT.
