"use client";

import { useState } from "react";
import { Button } from "../../ui/primitives/Button";
import { Checkbox } from "../../ui/primitives/Checkbox";
import { Dialog } from "../../ui/primitives/Dialog";
import { Field } from "../../ui/primitives/Field";
import { Input } from "../../ui/primitives/Input";
import { Select } from "../../ui/primitives/Select";
import { Switch } from "../../ui/primitives/Switch";
import { Textarea } from "../../ui/primitives/Textarea";
import type { CatalogSectionProps } from "../types";
import styles from "./FormsSection.module.css";

const copy = {
  es: {
    input: "Campo de texto",
    placeholder: "Escribe tu nombre",
    value: "Ana García",
    disabled: "Deshabilitado",
    invalid: "Revisa este dato",
    label: "Correo electrónico",
    description: "Usaremos este correo para enviarte actualizaciones.",
    error: "Introduce un correo válido.",
    emailInvalid: "Introduce un correo válido.",
    textareaError: "El texto es demasiado corto",
    selectError: "Elige una opción",
    emailPlaceholder: "nombre@ejemplo.com",
    invalidEmail: "correo-inválido",
    textareaValue: "Contenido no válido",
    textarea: "Área de texto",
    message: "Cuéntanos un poco más",
    long:
      "Este texto de ejemplo demuestra cómo se adapta el contenido largo en un área de texto. " +
      "Puedes seguir escribiendo para observar el comportamiento del control.",
    none: "Sin cambio de tamaño",
    vertical: "Cambio vertical",
    select: "Selecciona una opción",
    option: "Opción",
    choice: "Preferencia",
    checkbox: "Acepto recibir novedades y comunicaciones ocasionales sobre el producto.",
    checked: "Selección marcada",
    switchOff: "Desactivado",
    switchOn: "Activado",
    switchDisabled: "Desactivado y bloqueado",
    switchOnDisabled: "Activado y bloqueado",
    switchInteractive: "Notificaciones por correo",
    dialog: "Diálogo",
    open: "Abrir diálogo",
    title: "Preferencias de cuenta",
    paragraph: "Actualiza el correo asociado a tu cuenta.",
    save: "Guardar",
    cancel: "Cancelar",
    instructions: "Prueba Tab, Mayús+Tab, Escape y haz clic fuera del diálogo.",
    hover: "Los estados hover y foco se aprecian al interactuar con los controles.",
    selectHeading: "Selección",
    checkboxHeading: "Casillas",
    switchHeading: "Interruptores",
    checkboxEnabled: "Acepto recibir novedades.",
    checkboxDisabled: "Opción deshabilitada",
    checkboxDisabledChecked: "Opción marcada y deshabilitada",
    checkboxInteractive: "Recibir novedades del producto",
  },
  en: {
    input: "Text input",
    placeholder: "Enter your name",
    value: "Ana Garcia",
    disabled: "Disabled",
    invalid: "Check this value",
    label: "Email address",
    description: "We will use this email to send you updates.",
    error: "Enter a valid email address.",
    emailInvalid: "Enter a valid email address.",
    textareaError: "The text is too short",
    selectError: "Choose an option",
    emailPlaceholder: "name@example.com",
    invalidEmail: "invalid-email",
    textareaValue: "Invalid content",
    textarea: "Textarea",
    message: "Tell us a little more",
    long:
      "This sample demonstrates how long content adapts inside a text area. " +
      "Keep typing to observe how the control behaves.",
    none: "No resizing",
    vertical: "Vertical resizing",
    select: "Choose an option",
    option: "Option",
    choice: "Preference",
    checkbox: "I agree to receive occasional product news and communications.",
    checked: "Checked selection",
    switchOff: "Off",
    switchOn: "On",
    switchDisabled: "Off and disabled",
    switchOnDisabled: "On and disabled",
    switchInteractive: "Email notifications",
    dialog: "Dialog",
    open: "Open dialog",
    title: "Account preferences",
    paragraph: "Update the email associated with your account.",
    save: "Save",
    cancel: "Cancel",
    instructions: "Try Tab, Shift+Tab, Escape, and clicking outside the dialog.",
    hover: "Hover and focus states are visible when interacting with the controls.",
    selectHeading: "Select",
    checkboxHeading: "Checkbox",
    switchHeading: "Switch",
    checkboxEnabled: "I agree to receive product news.",
    checkboxDisabled: "Disabled option",
    checkboxDisabledChecked: "Checked and disabled option",
    checkboxInteractive: "Receive product news",
  },
};

export function FormsSection({ locale }: CatalogSectionProps) {
  const text = copy[locale];
  const [checked, setChecked] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <div className={styles.group}>
        <h3 className="ds-type-title">{text.input}</h3>
        <div className={styles.grid}>
          <Input placeholder={text.placeholder} aria-label={text.placeholder} />
          <Input defaultValue={text.value} aria-label={text.value} />
          <Input disabled placeholder={text.disabled} aria-label={text.disabled} />
          <Field label={text.invalid} error={text.error}>
            <Input aria-invalid="true" defaultValue={text.invalidEmail} />
          </Field>
          <Field label={text.label} description={text.description}>
            <Input type="email" placeholder={text.emailPlaceholder} />
          </Field>
          <Field label={text.label} error={text.emailInvalid}>
            <Input type="email" aria-invalid="true" defaultValue={text.invalidEmail} />
          </Field>
        </div>
      </div>
      <div className={styles.group}>
        <h3 className="ds-type-title">{text.textarea}</h3>
        <div className={styles.grid}>
          <Textarea placeholder={text.message} aria-label={text.message} />
          <Textarea defaultValue={text.long} aria-label={text.long} />
          <Textarea resize="none" placeholder={text.none} aria-label={text.none} />
          <Textarea resize="vertical" placeholder={text.vertical} aria-label={text.vertical} />
          <Field label={text.invalid} error={text.textareaError}>
            <Textarea aria-invalid="true" defaultValue={text.textareaValue} />
          </Field>
        </div>
      </div>
      <div className={styles.group}>
        <h3 className="ds-type-title">{text.selectHeading}</h3>
        <div className={styles.grid}>
          <Field label={text.choice}>
            <Select defaultValue="">
              <option value="">{text.select}</option>
              <option>{text.option} 1</option>
              <option>{text.option} 2</option>
              <option>{text.option} 3</option>
              <option>{text.option} 4</option>
            </Select>
          </Field>
          <Field label={text.choice}>
            <Select disabled defaultValue="">
              <option value="">{text.disabled}</option>
              <option>{text.option} 1</option>
              <option>{text.option} 2</option>
              <option>{text.option} 3</option>
              <option>{text.option} 4</option>
            </Select>
          </Field>
          <Field label={text.choice} error={text.selectError}>
            <Select aria-invalid="true" defaultValue="">
              <option value="">{text.select}</option>
              <option>{text.option} 1</option>
              <option>{text.option} 2</option>
              <option>{text.option} 3</option>
              <option>{text.option} 4</option>
            </Select>
          </Field>
        </div>
      </div>
      <div className={styles.group}>
        <h3 className="ds-type-title">{text.checkboxHeading}</h3>
        <div className={styles.options}>
          <Checkbox>{text.checkboxEnabled}</Checkbox>
          <Checkbox defaultChecked>{text.checked}</Checkbox>
          <Checkbox disabled>{text.checkboxDisabled}</Checkbox>
          <Checkbox disabled defaultChecked>{text.checkboxDisabledChecked}</Checkbox>
          <Checkbox checked={checked} onChange={(event) => setChecked(event.currentTarget.checked)}>
            {text.checkboxInteractive}
          </Checkbox>
        </div>
      </div>
      <div className={styles.group}>
        <h3 className="ds-type-title">{text.switchHeading}</h3>
        <div className={styles.options}>
          <Switch>{text.switchOff}</Switch>
          <Switch defaultChecked>{text.switchOn}</Switch>
          <Switch disabled>{text.switchDisabled}</Switch>
          <Switch disabled defaultChecked>{text.switchOnDisabled}</Switch>
          <Switch checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)}>
            {text.switchInteractive}
          </Switch>
        </div>
      </div>
      <div className={styles.group}>
        <h3 className="ds-type-title">{text.dialog}</h3>
        <Button
          className={styles.dialogButton}
          variant="outline"
          onClick={() => setDialogOpen(true)}
        >
          {text.open}
        </Button>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={text.title}
          footer={
            <>
              <Button variant="accent" onClick={() => setDialogOpen(false)}>
                {text.save}
              </Button>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                {text.cancel}
              </Button>
            </>
          }
        >
          <p className="ds-type-body">{text.paragraph}</p>
          <Field label={text.label}>
            <Input type="email" placeholder={text.emailPlaceholder} />
          </Field>
        </Dialog>
        <p className="ds-type-caption-medium">{text.instructions}</p>
      </div>
      <p className="ds-type-caption-medium">{text.hover}</p>
    </div>
  );
}
