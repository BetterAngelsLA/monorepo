import { Button, Flex } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { ShelterCard } from './ShelterCard';

export type Shelter = {
  id: number;
  name: string;
  address: string;
  image?: { file: { url: string; name: string } };
  capacity: number;
};

const shelters: Shelter[] = [
  { id: 1, name: 'Downtown Community Shelter', address: '123 Main St, Toronto, ON', image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-1',
      },
    },
    capacity: 45 },
  { id: 2, name: 'Lakeside Women’s Shelter', address: '456 Lakeview Rd, Toronto, ON', image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-1',
      },
    },
    capacity: 30 },
  { id: 3, name: 'North End Family Shelter', address: '789 North Ave, Toronto, ON',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-1',
      },
    }, capacity: 60 },
  { id: 4, name: 'West End Youth Shelter', address: '12 Queen St W, Toronto, ON',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-1',
      },
    }, capacity: 25 },
  { id: 5, name: 'Harbour Light Shelter', address: '95 Front St E, Toronto, ON',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-1',
      },
    },  capacity: 40 },
  { id: 6, name: 'Downtown Women’s Centre', address: '210 King St W, Toronto, ON',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-1',
      },
    }, capacity: 35 },
];

// // Dummy placeholder ShelterCard
// function ShelterCard({ name, address, capacity }: Omit<Shelter, 'id'>) {
//   return (
//     <Flex
//       direction="column"
//       borderWidth="0.0625rem"
//       borderRadius="0.75rem"
//       p="1.5rem"
//       bg="gray.50"
//       borderColor="gray.200"
//       boxShadow="sm"
//       gap="0.5rem"
//       flex="0 0 16rem"
//     >
//       <Flex bg="gray.100" borderRadius="0.5rem" h="8rem" />
//       <Text textStyle="headingMd" m={0}>
//         {name}
//       </Text>
//       <Text textStyle="bodySm" color="gray.600" m={0}>
//         {address}
//       </Text>
//       <Text textStyle="bodySm" color="gray.700" m={0}>
//         Capacity: {capacity}
//       </Text>
//     </Flex>
//   );
// }



export default function Dashboard() {
  return (
    <Flex direction="column" p="2rem" gap="2rem">
      {/* Top row with Back and another button */}
      <Flex align="center" justify="space-between">
        <Link to="/operator">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>

        <Button variant="solid" size="sm" colorScheme="blue">
          Add Shelter
        </Button>
      </Flex>

      {/* Grid of shelter cards */}
      <Flex flexWrap="wrap" gap="1.5rem">
        {shelters.map((shelter) => (
          <ShelterCard key={shelter.id} shelter={shelter} />
        ))}
      </Flex>
    </Flex>
  );
}
