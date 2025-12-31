# Configuración de Variables de Entorno

## Desarrollo Local

1. Crea un archivo `.env` en la raíz del proyecto `apieai`
2. Agrega tu API key de OpenAI:

```bash
OPENAI_API_KEY=tu-api-key-de-openai
```

3. El archivo `.env` ya está incluido en `.gitignore` y **nunca** debe subirse al repositorio

## Producción

### Opción 1: Archivo .env en el servidor

1. Conéctate a tu servidor de producción
2. Ve al directorio de la aplicación: `/var/www/apps/api/`
3. Crea el archivo `.env`:
```bash
nano .env
```
4. Agrega la API key:
```bash
OPENAI_API_KEY=tu-api-key-de-produccion
```
5. Guarda y cierra (Ctrl+O, Enter, Ctrl+X)
6. Reinicia la aplicación:
```bash
pm2 restart api
```

### Opción 2: Variables de entorno en PM2

1. Edita tu archivo `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'api',
    script: './src/index.js',
    env: {
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'tu-api-key-de-produccion'
    }
  }]
}
```

2. Reinicia con PM2:
```bash
pm2 restart api
```

## Verificación

Cuando la aplicación inicie correctamente, deberías ver en los logs:
```
Inicializando cliente de OpenAI...
```

Si hay un error, verás:
```
╔═══════════════════════════════════════════════════════════╗
║  ERROR: OPENAI_API_KEY no está configurada correctamente ║
║  Por favor configura la variable de entorno en .env      ║
╚═══════════════════════════════════════════════════════════╝
```

## Seguridad

- ✅ **NUNCA** subas el archivo `.env` al repositorio
- ✅ **NUNCA** hagas commit de API keys en el código
- ✅ Revoca inmediatamente cualquier API key que haya sido expuesta
- ✅ Usa API keys diferentes para desarrollo y producción
- ✅ El archivo `.env.example` solo contiene el template sin valores reales
