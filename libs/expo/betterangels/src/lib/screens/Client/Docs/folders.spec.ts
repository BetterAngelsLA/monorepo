import { ClientDocumentNamespaceEnum } from '../../../apollo';
import { DOC_FOLDER_TITLES, getDocFolder } from './folders';

describe('getDocFolder', () => {
  it('maps doc-ready namespaces to the Doc Ready folder', () => {
    expect(
      getDocFolder(ClientDocumentNamespaceEnum.DriversLicenseFront),
    ).toBe(DOC_FOLDER_TITLES.DOC_READY);
    expect(
      getDocFolder(ClientDocumentNamespaceEnum.DriversLicenseBack),
    ).toBe(DOC_FOLDER_TITLES.DOC_READY);
    expect(getDocFolder(ClientDocumentNamespaceEnum.PhotoId)).toBe(
      DOC_FOLDER_TITLES.DOC_READY,
    );
    expect(getDocFolder(ClientDocumentNamespaceEnum.BirthCertificate)).toBe(
      DOC_FOLDER_TITLES.DOC_READY,
    );
    expect(getDocFolder(ClientDocumentNamespaceEnum.SocialSecurityCard)).toBe(
      DOC_FOLDER_TITLES.DOC_READY,
    );
  });

  it('maps consent, HMIS and income forms to the Forms folder', () => {
    expect(getDocFolder(ClientDocumentNamespaceEnum.ConsentForm)).toBe(
      DOC_FOLDER_TITLES.FORMS,
    );
    expect(getDocFolder(ClientDocumentNamespaceEnum.HmisForm)).toBe(
      DOC_FOLDER_TITLES.FORMS,
    );
    expect(getDocFolder(ClientDocumentNamespaceEnum.IncomeForm)).toBe(
      DOC_FOLDER_TITLES.FORMS,
    );
  });

  it('maps other client documents to the Other folder', () => {
    expect(getDocFolder(ClientDocumentNamespaceEnum.OtherClientDocument)).toBe(
      DOC_FOLDER_TITLES.OTHER,
    );
  });

  it('defaults namespaces not exposed in the upload modal to Doc Ready', () => {
    expect(getDocFolder(ClientDocumentNamespaceEnum.OtherDocReady)).toBe(
      DOC_FOLDER_TITLES.DOC_READY,
    );
    expect(getDocFolder(ClientDocumentNamespaceEnum.OtherForm)).toBe(
      DOC_FOLDER_TITLES.DOC_READY,
    );
  });
});
