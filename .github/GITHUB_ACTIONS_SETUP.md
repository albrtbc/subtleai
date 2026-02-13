# GitHub Actions & CodeRabbit Setup Guide

## 📋 Overview

Este proyecto incluye dos workflows de GitHub Actions:

1. **PR Review** (`pr-review.yml`) - Se ejecuta en Pull Requests a `main`
2. **Main Branch Checks** (`main-checks.yml`) - Se ejecuta en pushes a `main`

---

## 🤖 CodeRabbit Setup

### Requisito: Token de CodeRabbit

Para que CodeRabbit funcione, necesitas un token API:

1. Ve a [CodeRabbit](https://coderabbit.ai)
2. Inicia sesión con tu cuenta de GitHub
3. Ve a **Settings** → **API Keys**
4. Copia tu API key

### Configurar el Secret en GitHub

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click en **"New repository secret"**
4. **Name**: `CODERABBIT_API_KEY`
5. **Value**: Pega tu API key de CodeRabbit
6. Click **"Add secret"**

### Alternativa: CodeRabbit GitHub App

Si prefieres una integración más fácil:

1. Ve a [CodeRabbit GitHub App](https://github.com/apps/coderabbit-ai)
2. Click **"Install"**
3. Selecciona tu repositorio
4. Autoriza los permisos

**Ventaja**: No necesitas configurar secrets manualmente.

---

## 🔧 Workflows Incluidos

### 1. PR Review (`pr-review.yml`)

**Trigger**: Pull Request a `main`

**Jobs**:

| Job | Descripción | Estado |
|-----|-------------|--------|
| **coderabbit** | Review automático con IA | ✅ Habilitado |
| **test** | Ejecuta tests | ⏳ Preparado (sin tests aún) |
| **lint** | Validación de código | ⏳ Preparado |
| **build** | Compila el proyecto | ✅ Habilitado |
| **security** | Audita dependencias | ✅ Habilitado |
| **pr-summary** | Resumen de estados | ✅ Habilitado |

**Características**:
- ✅ Node.js 18.x y 20.x
- ✅ Caché de dependencias
- ✅ Chequeo automático de secretos (Gitleaks)
- ✅ Resumen en la UI de GitHub

### 2. Main Branch Checks (`main-checks.yml`)

**Trigger**: Push/PR a `main`

**Jobs**:

| Job | Descripción | Estado |
|-----|-------------|--------|
| **main-test-suite** | Suite completa de tests | ✅ Habilitado |
| **main-build** | Build con reporte de tamaño | ✅ Habilitado |
| **env-validation** | Valida configuración | ✅ Habilitado |
| **notification** | Resumen de estado | ✅ Habilitado |

**Características**:
- ✅ Build artifacts preservation (5 días)
- ✅ Reporte de tamaño de bundle
- ✅ Validación de variables de entorno
- ✅ Detección de secretos filtrados

---

## 📝 Agregar Tests Propios

Cuando estés listo para agregar tests:

### Client (React)

```bash
npm -w client install --save-dev vitest @vitest/ui react-testing-library
```

Crea `client/package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### Server (Node.js)

```bash
npm -w server install --save-dev jest supertest
```

Crea `server/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}
```

El workflow automáticamente detectará y ejecutará los tests.

---

## 🎯 Cómo Funcionan los Workflows

### En un Pull Request:

```
1. Usuario crea PR a main
   ↓
2. GitHub Actions se dispara automáticamente
   ├─ CodeRabbit analiza los cambios
   ├─ Ejecuta tests (si existen)
   ├─ Valida linting
   ├─ Compila la aplicación
   ├─ Audita seguridad
   └─ Crea resumen
   ↓
3. CodeRabbit agrega comentarios en el PR
4. Los checks aparecen en la UI de GitHub
5. Se requieren todos los checks verdes para merge (opcional)
```

### Al Mergear a Main:

```
1. PR se merge a main
   ↓
2. Workflow de main-checks se ejecuta
   ├─ Ejecuta suite completa de tests
   ├─ Genera build final
   ├─ Crea artifacts para descarga
   ├─ Valida configuración
   └─ Crea reporte
   ↓
3. Build artifacts disponibles por 5 días
4. Puedes descargarlos en Actions tab
```

---

## ⚙️ Configuración Avanzada

### Proteger la rama main

En **Settings** → **Branches** → **Add rule**:

1. **Branch name pattern**: `main`
2. **Require status checks to pass before merging**: ✅
3. Selecciona:
   - ✅ CodeRabbit Review
   - ✅ Build Check
   - ✅ Lint Check
   - ✅ (Agregar Test cuando existan)

### Requerir reviews

1. **Require pull request reviews before merging**: ✅
2. **Require code reviews before merging**: 1

### Auto-merge

**Dismiss stale PR approvals when new commits are pushed**: ✅

---

## 🐛 Troubleshooting

### CodeRabbit no comenta en PRs

**Solución**:
1. Verifica que el CODERABBIT_API_KEY esté configurado
2. Comprueba permisos: Settings → Actions → General
3. Asegúrate que el token no ha expirado

### Tests no se ejecutan

**Solución**:
1. Agrega script `"test"` en `package.json`
2. Verifica que existe `npm test`
3. Revisa los logs en GitHub Actions

### Build falla

**Solución**:
1. Ejecuta `npm install` localmente
2. Intenta `npm -w client run build`
3. Comprueba que no hay errores de TypeScript (si usas TS)

---

## 📊 Monitorear Workflows

1. Ve a tu repositorio
2. Click en **Actions** tab
3. Selecciona un workflow
4. Haz click en un run para ver detalles
5. Expande los jobs para ver logs

---

## 🚀 Mejor Práctica

```yaml
# Recomendado para producción:

1. ✅ Requerir PR reviews
2. ✅ Requerir todos los status checks
3. ✅ Proteger rama main
4. ✅ Agregar tests
5. ✅ Usar CodeRabbit para reviews
6. ✅ Monitorear security checks
```

---

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [CodeRabbit Docs](https://docs.coderabbit.ai)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
- [Node.js Testing](https://nodejs.org/en/docs/guides/testing/)

---

**Última actualización**: 2026-02-13
**Workflows**: 2
**Status**: ✅ Listo para usar
