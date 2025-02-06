import AnnenbergLogo from '../../../../assets/images/AF-2022-Horiz.png';
import BaLogo from '../../../../assets/images/BA-logo.png';
import ImagineLaLogo from '../../../../assets/images/imagine_la_logo.png';
import MayorsFundLogo from '../../../../assets/images/mayors-fund-logo.png';
import RSKFLogo from '../../../../assets/images/RSKF_LA_Logotype_Black.png';
import PartnerCard from './PartnerCard';

const PARTNERS = [
  {
    link: 'https://www.betterangels.la/',
    ariaLabel: 'open better angels LA website in new tab',
    imgSrc: BaLogo,
    imgAlt: 'partner better angels LA',
    width: '[212px]',
  },
  {
    link: 'https://www.imaginela.org/',
    ariaLabel: 'open imagine LA website in new tab',
    imgSrc: ImagineLaLogo,
    imgAlt: 'partner imagine LA',
    width: '[164px]',
  },
  {
    link: 'https://www.mayorsfundla.org/',
    ariaLabel: "open Mayor's fund for Los Angeles website in new tab",
    imgSrc: MayorsFundLogo,
    imgAlt: "partner Mayor's fund for Los Angeles",
    width: '[212px]',
  },
  {
    link: 'https://annenberg.org/',
    ariaLabel: 'open Annenberg Foundation website in new tab',
    imgSrc: AnnenbergLogo,
    imgAlt: 'sponsor Annenberg Foundation',
    width: '[212px]',
  },
  {
    link: 'https://www.kaynefoundation.org/',
    ariaLabel: 'open R&S Kayne Foundation website in new tab',
    imgSrc: RSKFLogo,
    imgAlt: 'sponsor R&S Kayne Foundation',
    width: '[212px]',
  },
  // ... other partners
];

export default function Partners() {
  return (
    <div className="bg-brand-sky-blue w-full flex flex-col items-center justify-center py-12 md:py-20 px-10">
      <h2 className="text-2xl md:text-[40px] md:leading-[1.2] font-bold mb-6">
        This site is brought to you by
      </h2>
      <div className="flex flex-col justify-center flex-wrap md:flex-row flex-grow h-full gap-6">
        {PARTNERS.map(({ link, ariaLabel, imgSrc, imgAlt, width }) => (
          <PartnerCard key={link} ariaLabel={ariaLabel} link={link}>
            <img className={`w-${width}`} src={imgSrc} alt={imgAlt} />
          </PartnerCard>
        ))}
      </div>
    </div>
  );
}
