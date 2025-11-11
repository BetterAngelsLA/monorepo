import React from 'react';
import { Link } from 'react-router-dom';
import type { Shelter } from './Dashboard';

type TShelterCard = {
  shelter: Shelter;
};

export function ShelterCard({
  shelter: { name, image, address, capacity },
}: TShelterCard) {
  return (
    <div className="flex flex-col border border-gray-200 rounded-xl p-6 bg-gray-50 shadow-sm gap-2 w-full">
      <div className="bg-gray-100 rounded-lg h-32 overflow-hidden">
        <img
          src={
            image?.file.url ??
            'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png'
          }
          alt={image?.file.name ?? name}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      <h3 className="text-lg font-semibold m-0">{name}</h3>
      <p className="text-sm text-gray-600 m-0">{address}</p>

      <p className="text-sm text-gray-700 m-0">
        Beds Available:{' '}
        {capacity !== null && capacity !== undefined
          ? capacity
          : 'Data Not Available'}
      </p>

      <Link to="/operator/dashboard/#" className="mt-2">
        <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition">
          See More
        </button>
      </Link>
    </div>
  );
}
