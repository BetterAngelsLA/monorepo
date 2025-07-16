import { useAtom } from 'jotai';
import { flyoutAtom } from '../../atoms/flyoutAtom';
import { MenuIcon } from '@monorepo/react/icons';
import { MenuMobile } from './MenuMobile';

export function MenuBtnMobile(){
    const [_flyout, setFlyout] = useAtom(flyoutAtom);

    function onClick(){
        setFlyout({
            content: <MenuMobile />
        })
    }

    return (
        <div>
            <button onClick={onClick}>
                <MenuIcon className="h-4 block lg:hidden" fill="white" />
            </button>
            <div className="hidden lg:flex space-x-10 text-sm">
                <div>HOME</div>
                <div>ABOUT US</div>
            </div>
        </div>
    )
}

