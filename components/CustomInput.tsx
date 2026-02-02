import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Control, Controller, FieldPath } from "react-hook-form";
import z from "zod";
import { authFormSchema } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = authFormSchema('sign-up')

interface CustomInputProps {
  control: Control<z.infer<typeof formSchema>>,
  name: FieldPath<z.infer<typeof formSchema>>,
  label: string,
  placeholder: string
}

function CustomInput({
  control,
  name,
  label,
  placeholder,
}: CustomInputProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            {...field}
            id={name}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            type={name === "password" ? "password" : "text"}
          />
          {fieldState.invalid && (
            <FieldError errors={[fieldState.error!]} className="form-message" />
          )}
        </Field>
      )}
    />
  );
}

export default CustomInput;
