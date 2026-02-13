# SubtleAI - Plan de Implementación

## 🎯 Objetivo
Arreglar problemas críticos de seguridad, UX y estabilidad, seguido de mejoras de calidad.

---

## 🔴 FASE 1: CRÍTICOS (Seguridad & Funcionalidad)

### 1.1 🔒 [CRÍTICA] Corregir mensaje de límite de archivo (DropZone.jsx)
- **Problema**: Dice "Maximum is 250MB" pero límite es 10GB
- **Archivos**: `client/src/components/DropZone.jsx:14`
- **Solución**: Cambiar mensaje a "Maximum is 10GB"
- **Prioridad**: BLOQUEANTE
- **Estimado**: 2 minutos

### 1.2 🌐 [CRÍTICA] CORS configuración para producción (index.js)
- **Problema**: `origin: 'http://localhost:5173'` hardcodeado
- **Archivos**: `server/src/index.js:13`
- **Solución**:
  - Usar variable de entorno `CORS_ORIGIN`
  - Valor por defecto para desarrollo: `http://localhost:5173`
  - En producción: leer de `.env`
- **Prioridad**: BLOQUEANTE para producción
- **Estimado**: 5 minutos

### 1.3 🔐 [CRÍTICA] API Key en localStorage vulnerable
- **Problema**: Clave de API en localStorage sin protección (vulnerable a XSS)
- **Archivos**: `client/src/App.jsx:16-17`, `client/src/components/ApiKeyInput.jsx`
- **Solución**:
  - Guardar en sessionStorage (no persiste entre sesiones)
  - Usar memory storage como fallback (se pierde al recargar)
  - Advertencia UI clara sobre riesgos
- **Prioridad**: CRÍTICA
- **Estimado**: 10 minutos

### 1.4 🛡️ [CRÍTICA] Path traversal en descarga de archivos
- **Problema**: `filename` no sanitizado en `download.js:25`
- **Archivos**: `server/src/routes/download.js:20-26`
- **Solución**:
  - Usar `path.basename()` para sanitizar filename
  - Validar que jobId sea UUID válido (ya está, mejorar)
  - Usar `encodeURIComponent()` para header
- **Prioridad**: CRÍTICA
- **Estimado**: 5 minutos

### 1.5 📋 [CRÍTICA] Validación de idiomas débil
- **Problema**: Acepta cualquier valor en sourceLanguage/outputLanguage
- **Archivos**: `server/src/routes/transcribe.js:40-95`
- **Solución**:
  - Crear whitelist de idiomas soportados
  - Validar antes de procesar
  - Retornar error 400 si inválido
- **Prioridad**: ALTA
- **Estimado**: 10 minutos

### 1.6 🗑️ [CRÍTICA] Eliminar archivo temporal después de procesar
- **Problema**: Archivo original subido nunca se elimina
- **Archivos**: `server/src/routes/transcribe.js` (finalmente)
- **Solución**:
  - Usar `finally { fs.unlink(file.path) }` para limpiar
  - Aplicar en toda la ruta
- **Prioridad**: ALTA
- **Estimado**: 5 minutos

---

## 🟠 FASE 2: IMPORTANTES (Calidad & Logging)

### 2.1 📝 [IMPORTANTE] Validación de variables de entorno
- **Problema**: No se validan vars requeridas al iniciar
- **Archivos**: `server/src/index.js` (antes de app.listen)
- **Solución**:
  - Verificar GROQ_API_KEY existe al iniciar
  - Validar PORT es número válido
  - Fallar rápido si config inválida
- **Prioridad**: ALTA
- **Estimado**: 10 minutos

### 2.2 🔍 [IMPORTANTE] Logger estructurado (reemplazar console.log)
- **Problema**: Logging manual con `console.log`
- **Archivos**: Todos en `server/src/**/*.js`
- **Solución**:
  - Crear `server/src/utils/logger.js` simple
  - Reemplazar `console.log/error` con logger
  - Incluir timestamps y niveles (info, warn, error)
- **Prioridad**: MEDIA
- **Estimado**: 20 minutos

### 2.3 🤐 [IMPORTANTE] Eliminar try-catch vacíos
- **Problema**: `catch {}` silencia excepciones
- **Archivos**: `server/src/services/storageManager.js:38,48,54`
- **Solución**:
  - Añadir logging de excepciones
  - Comentar por qué es safe silenciarlas
- **Prioridad**: MEDIA
- **Estimado**: 10 minutos

### 2.4 ⏱️ [IMPORTANTE] Timeout en fetch client
- **Problema**: Fetch sin timeout puede colgar
- **Archivos**: `client/src/services/api.js:14`
- **Solución**:
  - Usar AbortController con timeout de 30min (máx upload)
  - Mostrar error si timeout
- **Prioridad**: MEDIA
- **Estimado**: 15 minutos

### 2.5 💾 [IMPORTANTE] Persistencia de jobs en localStorage
- **Problema**: Reload = pérdida de datos
- **Archivos**: `client/src/hooks/useJobQueue.js`
- **Solución**:
  - Guardar jobs en localStorage cuando cambian
  - Recuperar al montar el hook
  - Limpiar cuando completen
- **Prioridad**: MEDIA
- **Estimado**: 15 minutos

---

## 🟡 FASE 3: MEJORAS (Calidad & A11y)

### 3.1 ♿ [MEJORA] Accessibility mejorada
- **Problema**: Faltan labels ARIA, keyboard navigation
- **Archivos**: Múltiples componentes
- **Solución**:
  - Añadir `aria-label` en botones sin texto
  - `role` explícitos donde sea necesario
  - Mejorar focus visibility
- **Prioridad**: BAJA
- **Estimado**: 30 minutos

### 3.2 🧪 [MEJORA] Tests básicos
- **Problema**: Sin tests
- **Solución**:
  - Setup Jest + React Testing Library
  - Tests para hooks principales
  - Tests para rutas críticas (descarga)
- **Prioridad**: BAJA
- **Estimado**: 60 minutos (opcional)

### 3.3 🎯 [MEJORA] Error boundaries en React
- **Problema**: Sin manejo de errores en UI
- **Solución**:
  - Crear ErrorBoundary.jsx
  - Envolver App con error boundary
- **Prioridad**: BAJA
- **Estimado**: 20 minutos

---

## 🔄 FASE 4: RENOMBRAMIENTO A "SubtleAI"

### 4.1 📦 Cambiar nombre del proyecto
- `package.json` (raíz): `"name": "subtleai"`
- `client/package.json`: `"name": "@subtleai/client"`
- `server/package.json`: `"name": "@subtleai/server"`
- `README.md`: Actualizar título y referencias
- Comentarios que mencionen "srt-generator"

**Estimado**: 10 minutos

---

## 📊 RESUMEN

| Fase | Prioridad | Tiempo | Estado |
|------|-----------|--------|--------|
| **Fase 1: Críticos** | 🔴 | 40 min | ⏳ TODO |
| **Fase 2: Importantes** | 🟠 | 70 min | ⏳ TODO |
| **Fase 3: Mejoras** | 🟡 | 110 min | ⏳ TODO |
| **Fase 4: Renombrar** | 🔵 | 10 min | ⏳ TODO |
| **TOTAL** | - | ~230 min | ⏳ TODO |

---

## 🎬 Orden de Implementación

1. ✅ Corregir mensaje DropZone (1.1)
2. ✅ CORS config (1.2)
3. ✅ API Key storage (1.3)
4. ✅ Path traversal fix (1.4)
5. ✅ Validación idiomas (1.5)
6. ✅ Limpiar archivos temporales (1.6)
7. ✅ Env validation (2.1)
8. ✅ Logger estructurado (2.2)
9. ✅ Eliminar try-catch vacíos (2.3)
10. ✅ Timeout fetch (2.4)
11. ✅ Persistencia jobs (2.5)
12. ⏭️ A11y improvements (3.1)
13. ⏭️ Tests (3.2)
14. ⏭️ Error boundaries (3.3)
15. ⏭️ Renombrar a SubtleAI (4.1)

---

## ✨ Notas

- Mantener backward compatibility donde sea posible
- Actualizar README con cambios
- Probar en desarrollo antes de producción
- Los cambios críticos no rompen funcionalidad actual
