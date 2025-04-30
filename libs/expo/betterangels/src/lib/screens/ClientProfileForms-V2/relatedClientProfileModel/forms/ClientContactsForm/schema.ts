// import { Regex } from '@monorepo/expo/shared/static';
// import { z } from 'zod';
// import { RelationshipTypeEnum } from '../../../../../apollo';

// export const clientContactFromSchema = z
//   .object({
//     relationshipToClient: z
//       .nativeEnum(RelationshipTypeEnum)
//       .optional()
//       .refine((val) => val !== undefined, {
//         message: '',
//       }),
//     email: z
//       .string()
//       .regex(Regex.email, 'Enter a valid email address')
//       .optional()
//       .or(z.literal('')),
//     phoneNumber: z
//       .string()
//       .regex(
//         Regex.phoneNumber,
//         'Enter a 10-digit phone number without space or special characters'
//       )
//       .optional()
//       .or(z.literal('')),
//     name: z.string().optional(),
//     mailingAddress: z.string().optional(),
//     missingOneOfError: z.string().optional(),
//   })
//   .refine(
//     ({ email, phoneNumber, mailingAddress }) =>
//       !!email || !!phoneNumber || !!mailingAddress,
//     {
//       message: 'One of name, email or address is required.',
//       path: ['missingOneOfError'],
//     }
//   );

// export type TClientContactFormState = z.infer<typeof clientContactFromSchema>;
