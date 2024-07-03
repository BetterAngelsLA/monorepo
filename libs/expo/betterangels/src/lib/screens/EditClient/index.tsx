import ClientForm from '../ClientForm';

export default function EditClient({ id }: { id: string }) {
  return <ClientForm id={id} />;
}
