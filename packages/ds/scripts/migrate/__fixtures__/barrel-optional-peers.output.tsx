import { Button } from '@rojaostudio/ds/components';
import { PhoneInput, type PhoneInputProps } from '@rojaostudio/ds/components/phone-input';
import { ImageUpload } from '@rojaostudio/ds/components/image-upload';

export function Contact(props: PhoneInputProps) {
  return (
    <form>
      <PhoneInput {...props} />
      <ImageUpload value="" onChange={() => {}} />
      <Button type="submit">Enviar</Button>
    </form>
  );
}
