import React from 'react';
import { Link } from 'react-router-dom';
import { ShelterCard } from './ShelterCard';

export type Shelter = {
  id: number;
  name: string;
  address: string;
  image?: { file: { url: string; name: string } };
  capacity: number | null;
};

const shelters: Shelter[] = [
  {
    id: 1,
    name: 'Downtown Community Shelter',
    address: '123 Main St, Toronto, ON',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-1',
      },
    },
    capacity: 45,
  },
  {
    id: 2,
    name: 'Lakeside Women’s Shelter',
    address: '456 Lakeview Rd, Toronto, ON',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-2',
      },
    },
    capacity: 30,
  },
  {
    id: 3,
    name: 'North End Family Shelter',
    address: '789 North Ave, Toronto, ON',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-3',
      },
    },
    capacity: 60,
  },
  {
    id: 4,
    name: 'West End Youth Shelter',
    address: '12 Queen St W, Toronto, ON',
    capacity: 25,
  },
  {
    id: 5,
    name: 'Harbour Light Shelter',
    address: '95 Front St E, Toronto, ON',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-4',
      },
    },
    capacity: null,
  },
  {
    id: 6,
    name: 'Downtown Women’s Centre',
    address: '210 King St W, Toronto, ON',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-5',
      },
    },
    capacity: 35,
  },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col p-8 gap-8">
      {/* Top row with Back and Add Shelter buttons */}
      <div className="flex items-center justify-between">
        <Link to="/operator">
          <button className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-sm">
            Back
          </button>
        </Link>

        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
          Add Shelter
        </button>
      </div>

      {/* Grid of shelter cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        {shelters.map((shelter) => (
          <ShelterCard key={shelter.id} shelter={shelter} />
        ))}
      </div>
    </div>
  );
}
