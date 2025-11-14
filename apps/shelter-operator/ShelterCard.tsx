import { Link } from 'react-router-dom';
import type { Shelter } from './Dashboard';

type TShelterCard = {
  shelter: Shelter;
};

export function ShelterCard({
  shelter: { name, image, address, capacity },}: TShelterCard) {
  return (

   <div className="bg-white text-black rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
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
        {capacity ? (
        <span className="font-semibold">{capacity}</span>
      ) : (
        <span className="font-semibold">No Data Found</span>
      )}
      </p>
      <Link to="/operator/dashboard/#"><button >See More</button></Link>
    </div>
  );
}
