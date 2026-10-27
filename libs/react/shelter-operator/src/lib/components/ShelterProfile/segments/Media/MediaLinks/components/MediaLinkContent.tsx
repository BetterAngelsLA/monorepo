import { MediaLinkTypeChoices } from '@monorepo/ba-platform/types';
import { TextLink } from '@monorepo/react/components';
import { enumDisplayMediaLinkTypeChoices } from '@monorepo/react/shelter';
import type { ReactNode } from 'react';

type TProps = {
  title?: string | null;
  mediaType: MediaLinkTypeChoices;
  url: string;
};

type TFieldProps = {
  label: string;
  children: ReactNode;
};

function Field(props: TFieldProps) {
  const { label, children } = props;

  return (
    <>
      <span className="text-xs text-[#747A82]">{label}</span>
      <span className="min-w-0">{children}</span>
    </>
  );
}

export function MediaLinkContent(props: TProps) {
  const { title, mediaType, url } = props;

  return (
    <div className="grid grid-cols-[max-content_1fr] items-baseline gap-x-3 gap-y-1 py-1">
      <Field label="title">
        {title || <span className="italic text-sm">---</span>}
      </Field>
      <Field label="type">{enumDisplayMediaLinkTypeChoices[mediaType]}</Field>
      <Field label="url">
        <TextLink href={url} openExternal={true} className="break-all" />
      </Field>
    </div>
  );
}
