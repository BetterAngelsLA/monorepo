import { useAtom } from 'jotai';
import { ReactElement, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Flyout } from './Flyout';
import { flyoutAtom } from '../atoms/flyoutAtom';

type IProps = {
    className?: string;
}

export function Flyoutcontainer(props: IProps): ReactElement | null {
    const {className = ''} = props;

    const location = useLocation();
    const [flyout, setFlyout] = useAtom(flyoutAtom);

    useEffect((): void => {
        setFlyout(null);
    }, [location.pathname]);

    if (!flyout?.content) return null;

    return <Flyout className={className}>{flyout?.content}</Flyout>
}
