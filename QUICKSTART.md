# 🚀 INICIO RÁPIDO: Compartir Publicaciones

## ⚡ 3 Pasos Rápidos

### 1️⃣ Verificar Play Store URL

Abre: `services/shareService.ts`

Busca (línea ~45):
```typescript
const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.informatica.app';
```

✅ Verifica que sea tu URL correcta en Play Store

---

### 2️⃣ Build la App

```bash
npm run reset-project
npm run android
```

⏱️ Espera 5-10 minutos

---

### 3️⃣ Prueba

1. Abre la app
2. Navega a una publicación
3. Toca el botón 🔗 (compartir) en la esquina superior derecha
4. Selecciona WhatsApp
5. El mensaje debe incluir: `informatica://publicacion/...`
6. ✅ ¡Listo!

---

## 📱 Qué Esperar

### Con la app instalada

- Toca el link
- Se abre automáticamente en la publicación

### Sin la app instalada

- Toca el link
- Se abre una página HTML bonita
- Opción: "Descargar app desde Play Store"

---

## 🎨 Personalización (Opcional)

### Cambiar dominio web

Abre: `services/shareService.ts`

Busca (línea ~20):
```typescript
export const obtenerEnlaceWebPublicacion = (publicacionId: string): string => {
  return `https://informatica.app/publicacion/${publicacionId}`;
};
```

Cambia `informatica.app` por tu dominio

---

### Cambiar mensaje

Abre: `services/shareService.ts`

Busca (línea ~50):
```typescript
const crearMensajeCompartir = (...)
```

Personaliza el mensaje

---

## 🐛 Si algo falla

### El botón no aparece
```bash
npm run reset-project
npm run android
```

### El deep link no abre la app
Verifica en `app.json`:
```json
{
  "expo": {
    "scheme": "informatica",
    "android": {
      "package": "com.informatica.app",
      "intentFilters": [...]
    }
  }
}
```

### Otros problemas
Ver: `DEEP_LINKING_GUIDE.md` → Sección Troubleshooting

---

## ✅ Checklist

- [ ] Verificaste Play Store URL
- [ ] Hiciste npm run android
- [ ] Probaste el botón compartir
- [ ] Probaste en WhatsApp
- [ ] Probaste en otro dispositivo sin la app

---

## 📚 Documentación Completa

- **Guía técnica**: `DEEP_LINKING_GUIDE.md`
- **Resumen**: `SHARE_SYSTEM_SUMMARY.md`
- **Checklist detallado**: `CHECKLIST.md`
- **Arquitectura**: `ARCHITECTURE.md`
- **Entrega**: `DELIVERY_SUMMARY.md`

---

## 🎯 Próximos Pasos (Después de Probar)

1. [ ] Verificar en Play Store Console
2. [ ] Actualizar descripción de la app
3. [ ] Publicar nueva versión
4. [ ] Anunciar a usuarios
5. [ ] Monitorear uso de compartir

---

**¡Listo! Solo necesitas testear y publicar.** 🚀
