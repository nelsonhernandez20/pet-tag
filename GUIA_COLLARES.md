# Guía: Creación de Collares con Códigos QR

## Proceso Completo para Crear Collares

### 1. Generar los Códigos QR

1. Ve a la página `/generate-qr` en tu aplicación
2. Especifica cuántos códigos QR necesitas (puedes generar hasta 100 a la vez)
3. Haz clic en "Generar Códigos QR"
4. El sistema creará:
   - Códigos únicos en la base de datos
   - Visualización de cada QR
   - Información del código y URL

### 2. Descargar los Códigos QR

Para cada código QR tienes dos opciones de descarga:

#### Opción A: PNG (Alta Resolución)
- **Cuándo usar:** Para impresión directa o cuando necesitas una imagen ráster
- **Ventajas:** 
  - Alta resolución (2000x2000 píxeles)
  - Listo para imprimir
  - Compatible con cualquier impresora
- **Mejor para:** Impresión en etiquetas adhesivas, láminas, o collares simples

#### Opción B: SVG (Vectorial)
- **Cuándo usar:** Para diseño profesional o cuando necesitas escalar sin pérdida de calidad
- **Ventajas:**
  - Escalable sin pérdida de calidad
  - Mejor para diseño gráfico
  - Más pequeño en tamaño de archivo
- **Mejor para:** Diseños profesionales, integración en software de diseño (Illustrator, CorelDraw)

### 3. Proceso de Impresión

#### Opciones de Impresión:

**Opción 1: Etiquetas Adhesivas**
- Imprime los QRs en etiquetas adhesivas resistentes al agua
- Adhiere las etiquetas a collares existentes
- Tamaño recomendado: 2-3 cm x 2-3 cm

**Opción 2: Grabado/Láser**
- Usa un láser para grabar el QR directamente en la placa del collar
- Duradero y profesional
- Mejor para collares de metal

**Opción 3: Impresión Directa en Collar**
- Imprime el QR directamente en el material del collar
- Requiere equipo especializado
- Ideal para producción en masa

**Opción 4: Placas de Identificación**
- Crea placas pequeñas con el QR
- Atacha la placa al collar
- Opción más profesional y duradera

### 4. Especificaciones Técnicas Recomendadas

**Tamaño del QR:**
- Mínimo: 2 cm x 2 cm (para que sea escaneable)
- Óptimo: 3-4 cm x 3-4 cm
- Máximo: No hay límite, pero 5 cm es suficiente

**Nivel de Corrección de Errores:**
- Los QRs se generan con nivel H (alto) - pueden tener hasta 30% de daño y seguir funcionando
- Esto es importante porque los collares pueden sufrir desgaste

**Resolución de Impresión:**
- Mínimo: 300 DPI
- Recomendado: 600 DPI o superior
- Para grabado láser: El archivo SVG es ideal

### 5. Distribución a Veterinarias

1. **Prepara los collares:**
   - Cada collar debe tener un código QR único
   - Organiza los collares por lote o código

2. **Registra los códigos (opcional):**
   - Puedes mantener un registro de qué códigos enviaste a cada veterinaria
   - Esto te ayudará con el seguimiento

3. **Entrega a veterinarias:**
   - Entrega los collares físicos con los QRs ya impresos
   - Las veterinarias pueden venderlos directamente
   - No necesitan acceso a la aplicación para venderlos

### 6. Flujo del Cliente

Cuando un cliente compra un collar:

1. **Compra el collar** en la veterinaria (con QR ya impreso)
2. **Escanea el QR** con su teléfono (o va directamente a la URL)
3. **Ve la página del QR** que indica que no está asociado
4. **Se registra o inicia sesión** en la aplicación
5. **Asocia el QR a su cuenta** seleccionando o creando una mascota
6. **Completa el perfil** de su mascota y configuración de privacidad
7. **¡Listo!** El QR queda asociado permanentemente

### 7. Ventajas de este Sistema

✅ **Sin registro previo:** Los collares pueden venderse sin que el cliente tenga cuenta
✅ **Flexibilidad:** Cada collar puede asociarse a cualquier cuenta
✅ **Producción masiva:** Puedes generar cientos de QRs de una vez
✅ **Trazabilidad:** Cada QR está registrado en la base de datos
✅ **Durabilidad:** Los QRs con nivel H de corrección son muy resistentes

### 8. Consejos para Producción

1. **Genera lotes grandes:** Genera 50-100 QRs a la vez para economizar tiempo
2. **Usa nombres de archivo consistentes:** El sistema genera nombres como `qr-CODIGO.png`
3. **Organiza por lotes:** Guarda los archivos en carpetas por fecha o lote
4. **Verifica antes de imprimir:** Escanea algunos QRs de prueba antes de imprimir todos
5. **Mantén un backup:** Guarda los archivos originales antes de enviarlos a impresión

### 9. Resolución de Problemas

**Problema:** El QR no se escanea bien
- **Solución:** Verifica que la resolución sea alta (mínimo 300 DPI) y el tamaño mínimo de 2cm

**Problema:** El QR está dañado en el collar
- **Solución:** Con nivel H de corrección, el QR puede funcionar hasta con 30% de daño. Si está más dañado, puede que necesites reimprimirlo.

**Problema:** El cliente no puede asociar el QR
- **Solución:** Verifica que el código QR esté en la base de datos. Si no está, necesita ser generado nuevamente.

### 10. Herramientas Recomendadas

**Para Diseño:**
- Adobe Illustrator (para trabajar con SVG)
- CorelDraw
- Inkscape (gratis, para SVG)

**Para Impresión:**
- Impresoras de etiquetas (Brother, Zebra, etc.)
- Láseres para grabado (para metal)
- Servicios de impresión profesional

**Para Pruebas:**
- Apps de escaneo QR en móvil
- Herramientas online de validación de QR

---

## Resumen del Flujo

```
1. Generar QRs → 2. Descargar archivos → 3. Imprimir en collares → 
4. Vender en veterinarias → 5. Cliente escanea → 6. Cliente asocia a cuenta → 
7. ¡Funcionando!
```


