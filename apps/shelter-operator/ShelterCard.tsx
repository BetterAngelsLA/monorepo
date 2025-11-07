export type Shelter = {
  id: string;
  name: string;
  address?: string;
  image?: { file: { url: string; name: string } };
  bedsAvailiable: number;
};

type TShelterCard = {
  shelter: Shelter;
};

export function ShelterCard({
  shelter: { name, image, address, bedsAvailiable },
}: TShelterCard) {
  return (
    <div className="bg-white text-black rounded-2xl shadow-md p-4 hover:shadow-lg transition">
      {image ? (
        <img
          src={image.file.url}
          alt={image.file.name}
          className="w-full h-48 object-cover rounded-xl mb-4"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded-xl mb-4 flex items-center justify-center text-gray-500">
          No Image Available
        </div>
      )}

      <h1 className="text-xl font-semibold">{name}</h1>
      {address && <h2 className="text-gray-700">{address}</h2>}
      <p className="mt-2 text-gray-800">
        Beds Available:{' '}
        <span className="font-semibold text-green-700">{bedsAvailiable}</span>
      </p>
    </div>
  );
}
