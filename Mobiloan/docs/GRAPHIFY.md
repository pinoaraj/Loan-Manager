# Graphify en Mobiloan

Mobiloan mantiene su salida de Graphify separada de la app desktop.

## Carpeta dedicada

- `C:\Users\JP\Desktop\LoanManager\Mobiloan\graphify-out`

## Flujo recomendado

Ejecutar desde `Mobiloan/`:

```bash
graphify update .
graphify query "How does offline sync flow from outbox to API?"
graphify explain syncService
```

## Cuando actualizar

- despues de cambios importantes en sync,
- despues de agregar nuevas pantallas clave,
- antes de cerrar hitos relevantes del producto mobile.

## Ultima actualizacion verificada

- `graphify update .` corrio correctamente el `2026-06-11`.
- El grafo ya refleja el deep-link desde cola de cobranza y reconciliacion hacia `app/(app)/loans/[id].tsx`.
- El grafo ahora tambien muestra el rol central de `AppProviders` en sesion restaurada, estado offline y auto-sync.
- La salida actual tambien incorpora la nueva ruta de datos para `pending-outbox` entre hooks, SQLite local y la cartera principal.
- La corrida mas reciente ya incluye la deteccion de `MobileApiError` y el flujo de `needsReauth` hacia las pantallas operativas.
- La ultima pasada ya incorpora `src/lib/contact.ts` y sus enlaces hacia las pantallas de cliente y prestamo.
- La ultima corrida tambien muestra `getRelativeDueLabel()` y las nuevas acciones de contacto dentro de la cola principal de cobranza.
