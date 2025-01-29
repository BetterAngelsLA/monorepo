import { useSearchParams } from 'react-router-dom';
import { surveyConfig } from '../../pages/introduction/firesSurvey/config/config';
import { TAnswer, TOption } from '../components/survey/types';
import { getAllQuestions } from '../components/survey/utils/validateConfig';

const allQestions = getAllQuestions(surveyConfig);

function findQuestionById(id: string) {
  return allQestions.find((q) => q.id === id);
}

function getAnswerTags(answer: TAnswer, answerOptions: TOption[]): string[] {
  const answerTags: string[] = [];

  let results = answer.result;

  if (typeof results === 'string') {
    results = [results];
  }

  for (const result of results) {
    const resultOption = answerOptions.find((o) => o.optionId === result);

    if (!resultOption) {
      continue;
    }

    const optionTags = resultOption.tags || [];

    for (const tag of optionTags) {
      answerTags.push(tag);
    }
  }

  return answerTags;
}

function getTagsFromAnswers(answers: TAnswer[]): string[] {
  const tags: string[] = [];

  for (const answer of answers) {
    const questionAnswered = findQuestionById(answer.questionId);

    if (!questionAnswered?.options) {
      continue;
    }

    const answerTags = getAnswerTags(answer, questionAnswered?.options);

    for (const answerTag of answerTags) {
      tags.push(answerTag);
    }
  }

  return tags;
}

export const useAnswerTags = (answers?: TAnswer[]): string[] => {
  const [searchParams] = useSearchParams();

  if (answers?.length) {
    return getTagsFromAnswers(answers);
  }

  const tagsParamStr = searchParams.get('tags');

  if (!tagsParamStr) {
    return [];
  }

  return tagsParamStr.split(',');
};
