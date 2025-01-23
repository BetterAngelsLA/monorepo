// import { useQuery } from '@tanstack/react-query';
// import { useEffect } from 'react';
// import { fetchResourcesByTagsFn } from '../../clients/sanityCms/queries/fetchResourcesByTags';
// import { mergeCss } from '../../utils/styles/mergeCss';
// import { IProps } from './SurveyResults';

// export function SurveyResults(props: IProps) {
//   const { results, className } = props;

//   const { answers = [] } = results;

//   const queryTags = [
//     'document-replacement-other',
//     'document-replacement-income-tax',
//   ];

//   const fetchResources = async () => {
//     const response = await fetch('queryFn.url');

//     return response.json();
//   };

//   console.log();
//   console.log('| -------------  SurveyResults  ------------- |');
//   console.log(answers);
//   console.log();

//   const myQueryFn = fetchResourcesByTagsFn([]);

//   const { isLoading, isError, data, error } = useQuery({
//     queryKey: ['resourcesByTags', 'hello', 'another tag'],
//     // queryFn: fetchResources,
//   });

//   useEffect(() => {
//     console.log();
//     console.log('| -------------  SANITY data  ------------- |');
//     console.log(data?.result);
//     console.log();
//   }, [data]);

//   const parentCss = [className];

//   function answerToArr(answer: string | string[]) {
//     if (typeof answer === 'string') {
//       return [answer];
//     }

//     return answer || [];
//   }

//   return (
//     <div className={mergeCss(parentCss)}>
//       <div className="mt-4 mb-8 font-bold text-2xl">Survey Answers</div>

//       {answers.map((answer) => {
//         return (
//           <div
//             key={answer.questionId}
//             className="mb-8 border-b-2 last:border-b-0"
//           >
//             <div>
//               <div>Question Id: {answer.questionId}</div>
//               <div className="mb-2 font-bold">Answer:</div>
//               <div>{answerToArr(answer.result).join(', ')}</div>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }
