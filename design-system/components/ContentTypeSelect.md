# ContentTypeSelect

## Propósito
Selector de un tipo de contenido con descripción por opción, compacto, pensado para el
`PromptComposer`. El listbox se abre sobre el disparador.

## API
`value`, `onChange`, `options { value, label, description }`, `label`, `disabled`.

## Accesibilidad
Flechas mueven la opción activa; Inicio/Fin saltan; Intro o Espacio selecciona; Escape cierra
y devuelve el foco; Tab cierra.

## Estilo Paper
Disparador y opciones con radio 8px, listbox con radio 12px sobre `surface-overlay`. El borde
del disparador en hover/abierto pasa a `border-strong` y el fondo usa `control-hover`.
El estado deshabilitado usa `text-disabled`.
