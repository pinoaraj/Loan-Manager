# Mobiloan GitHub Checklist

## Antes de publicar cambios importantes

- Actualizar `docs/MAP.md`
- Actualizar `docs/UPDATE_LOG.md`
- Actualizar `github/RELEASE_NOTES.md`
- Actualizar `graphify-out/README.md`
- Ejecutar `npm run typecheck`
- Validar login local
- Validar sync `bootstrap`
- Validar registro offline en outbox
- Validar `sync/push` y `sync/changes`
- Validar que `deletedIds` elimine clientes y cuotas obsoletas en SQLite local
- Validar reconciliacion de mutaciones rechazadas
- Validar bloqueo local de sobrepago y cuotas cerradas
- Validar `docs/ANDROID_SETUP.md` sobre dispositivo real
- Ejecutar `docs/SYNC_SMOKE.md` sobre entorno de prueba
- Validar filtros `vencidas`, `hoy` y `proximas` sobre base local
- Validar carril `android/` o `eas.json` segun entorno disponible
- Confirmar instalacion del `app-release.apk` en un telefono Android arm64
- Ejecutar `npm run android:release` y confirmar que el APK incluye `assets/index.android.bundle`
- Publicar el `sha256` del APK junto al artefacto de la beta
- Verificar que el APK release abre y opera en modo local con el PC apagado
- Confirmar que el APK debug no se entrega como artefacto de beta

## Criterio actual del proyecto

Mobiloan se publica y documenta como pista separada de desktop aunque comparta repo.
