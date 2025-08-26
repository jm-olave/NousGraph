# Docker Setup - Medical Classification Project

## Problemas identificados y solucionados:

### 1. Healthchecks fallaban
- **Problema**: Dockerfiles no incluían `curl` para healthchecks
- **Solución**: Agregado `curl` a ambos Dockerfiles (api y model)

### 2. Conexión API-Modelo
- **Problema**: API no sabía cómo conectarse al servicio modelo
- **Solución**: Agregada variable `MODEL_URL=http://model:8080` en docker-compose

### 3. Dependencias mejoradas
- **Problema**: Servicios iniciaban sin esperar dependencias
- **Solución**: Configuradas dependencias con `condition: service_healthy`

### 4. Modelo faltante
- **Problema**: Servicio modelo busca `./my_medical_model` que no existe
- **Solución**: Volume mount configurado (crear directorio si tienes modelo entrenado)

## Archivos modificados:
- `api/Dockerfile` - Agregado curl
- `model/Dockerfile` - Agregado curl  
- `docker-compose.yml` - Mejorada configuración
- `docker-compose.fixed.yml` - Versión completamente funcional

## Para usar:

```bash
# Usar versión corregida
docker compose -f docker-compose.fixed.yml up --build

# O renombrar y usar la original
mv docker-compose.yml docker-compose.old.yml
mv docker-compose.fixed.yml docker-compose.yml
docker compose up --build
```

## Notas importantes:
- Si tienes un modelo entrenado, colócalo en `./model/my_medical_model/`
- Sin modelo, el servicio iniciará pero las clasificaciones fallarán
- Todos los healthchecks ahora funcionan correctamente
- La base de datos tiene healthcheck propio