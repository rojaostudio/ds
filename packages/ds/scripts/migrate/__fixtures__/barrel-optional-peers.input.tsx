import { Button, PhoneInput, ImageUpload, type PhoneInputProps } from '@rojaostudio/ds/components';

export function Contact(props: PhoneInputProps) {
  return (
    <form>
      <PhoneInput {...props} />
      <ImageUpload value="" onChange={() => {}} />
      <Button type="submit">Enviar</Button>
    </form>
  );
}
