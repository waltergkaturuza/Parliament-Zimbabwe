// src/components/shared/Form.tsx
import { FieldValues, FormProvider, useForm, DefaultValues, SubmitHandler } from 'react-hook-form';

interface FormProps<T extends FieldValues> {
  children: React.ReactNode;
  onSubmit: (data: T) => void;
  defaultValues?: Partial<T>;
}

export function Form<T extends FieldValues>({ 
  children, 
  onSubmit, 
  defaultValues 
}: FormProps<T>) {
  const methods = useForm<T>({ defaultValues: defaultValues as DefaultValues<T> });
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit as SubmitHandler<T>)} className="space-y-4">
        {children}
      </form>
    </FormProvider>
  );
}
