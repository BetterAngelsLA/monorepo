export type Shelter = {
  id: string;
  name: string;
  address?: string;
  image?: { file: { url: string; name: string } };
};

type TShelterCard = {
  shelter: Shelter;
};

export function ShelterCard({
  shelter: { name, image, address },
}: TShelterCard) {
  return (
    <div className="bg-white text-black rounded-2xl shadow-md p-4 hover:shadow-lg transition">
      {image ? (
        <img
          src={image.file.url}
          alt={name}
          className="w-full h-48 object-cover rounded-xl mb-4"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded-xl mb-4 flex items-center justify-center text-gray-500">
          No Image Available
        </div>
      )}

      <h2 className="text-xl font-semibold">{name}</h2>
    </div>
  );
}
