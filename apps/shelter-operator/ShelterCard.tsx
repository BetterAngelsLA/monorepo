import { Flex, Text } from '@chakra-ui/react';
import type { Shelter } from './Dashboard';


type TShelterCard = {
  shelter: Shelter;
};

export function ShelterCard({
  shelter: { name, image, address, capacity },
}: TShelterCard) {
  return (
    <Flex
      direction="column"
      borderWidth="0.0625rem"
      borderRadius="0.75rem"
      p="1.5rem"
      bg="gray.50"
      borderColor="gray.200"
      boxShadow="sm"
      gap="0.5rem"
      flex="0 0 16rem"
    >
      <Flex bg="gray.100" borderRadius="0.5rem" h="8rem">
         <img
          src={image?.file.url}
          alt={image?.file.name}
          className="w-full h-48 object-cover rounded-xl mb-4"
        />
      </Flex>
      <Text textStyle="headingMd" m={0}>
        {name}
      </Text>
      <Text textStyle="bodySm" color="gray.600" m={0}>
        {address}
      </Text>

      {capacity ? <Text textStyle="bodySm" color="gray.700" m={0}>
        Beds Availiable: {capacity}
      </Text> : <Text textStyle="bodySm" color="gray.700" m={0}>
        Beds Availiable: Data Not Availiable
      </Text>}

    </Flex>
  );
}
