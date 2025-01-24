import Annenberg from '../../../../assets/images/AF-2022-Horiz.png';
import BaLogo from '../../../../assets/images/BA-logo.png';
import Imagine from '../../../../assets/images/imagine_la_logo.png';
import Mayor from '../../../../assets/images/mayors-fund-logo.png';
import Kayn from '../../../../assets/images/RSKF_LA_Logotype_Black.png';
import PartnerCard from './PartnerCard';

export default function Partners() {
  return (
    <div className="bg-brand-sky-blue w-full flex flex-col items-center justify-center py-12 md:py-20 px-10">
      <h2 className="text-2xl md:text-[40px] md:leading-[94.5px] font-bold mb-6">
        This site is brought to you by
      </h2>
      <div className="flex flex-col justify-center flex-wrap md:flex-row flex-grow h-full gap-6">
        <PartnerCard link="https://www.betterangels.la/">
          <img className="w-[212px]" src={BaLogo} alt="partner imagine LA" />
        </PartnerCard>
        <PartnerCard link="https://www.imaginela.org/">
          <img className="w-[164px]" src={Imagine} alt="partner imagine LA" />
        </PartnerCard>
        <PartnerCard link="https://www.mayorsfundla.org/">
          <img
            className="w-[212px]"
            src={Mayor}
            alt="partner Mayor's fund for Los Angeles"
          />
        </PartnerCard>
        <PartnerCard link="https://annenberg.org/">
          <img
            className="w-[212px]"
            src={Annenberg}
            alt="Annenberg Foundation"
          />
        </PartnerCard>
        <PartnerCard link="https://www.kaynefoundation.org/">
          <img
            className="w-[212px]"
            src={Kayn}
            alt="R&S Kayne Foundation Logo"
          />
        </PartnerCard>
      </div>
    </div>
  );
}
