# Link

## Propósito

Enlace HTML nativo para navegación; la aplicación puede envolverlo con su router.

## API

| Prop | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| tone | `"default" \| "inverse"` | `"default"` | Color heredado o texto inverso. |
| children | `ReactNode` | — | Nombre y contenido visible del enlace. |
| ...props | `ComponentProps<"a">` | — | Resto de propiedades y eventos nativos de anchor. |

## Variantes y estados

Tonos default e inverse. El subrayado permanece visible y se enfatiza al pasar el puntero.

## Accesibilidad

Usa semántica y navegación de teclado nativas del elemento `a`, con foco visible. El texto del enlace debe describir su destino y mantener contraste suficiente en el contexto.

## Cuándo usarlo y cuándo no

Úsalo para navegar a un destino. No lo uses para ejecutar una acción; para eso corresponde Button.
